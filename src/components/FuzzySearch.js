var React = require("react")
var levenshtein = require("fast-levenshtein")
var PriorityQueue = require('priorityqueuejs');
var cx = require("classnames")
var containsNode = require("../utils/containsNode")

var SearchWorker = require("../worker/worker")
var workerBlob = new Blob(['(' + SearchWorker.toString() + ')();'], {type: "text/javascript"});
var workerBlobURL = window.URL.createObjectURL(workerBlob);

var punctuationRE = /[^\w ]/g

function computeSearchValues(items, opts){
	var { field, delim, removePunctuation, useWebWorkers, searchLowerCase, threadCount } = opts;

	var _searchItems = [],
		slices = [];

	items = typeof items.toArray  == "function" ?
		items.toArray() :
		items;

	items.forEach(function(item){
		var _searchValues = [],
			added = {};
		_searchItems.push({ _originalItem: item, _searchValues })

		var searchField = item[field]

		if(removePunctuation)
			searchField = searchField.replace(punctuationRE, "")

		searchField.split(delim).forEach(function(term){
			var _term = searchLowerCase ? term.toLowerCase() : term

			/**
				Track if the field has multiples of the same word and ignore them if so
			*/
			if(!added[_term]){
				_searchValues.push(_term)
				added[_term] = true
			}
		})
	})

	/**
		If we're using web workers split them computed search data into equal chunks per thread
	*/
	if(useWebWorkers){
		for(var i = 0; i < threadCount; i++){
			var start = Math.floor(i * (_searchItems.length / threadCount)),
				end = Math.floor((i + 1) * (_searchItems.length / threadCount))
			if(i < 3)
				slices.push(_searchItems.slice(start, end))
			else
				slices.push(_searchItems.slice(start))
		}
	}

	return {
		computing: false,
		items: _searchItems,
		slices: slices
	}
}

var FuzzySearchResult = React.createClass({
	render: function(){
		var attr = this.props.item,
			classes = cx({
				"fuzzy-search-result": true,
				"hover-blue": this.props.selectItem
			})

		return (
			<li className={classes} onClick={this.props.selectItem && this.select} style={this.props.style}>
				<div className="inline-top" style={{ paddingLeft: 4, marginTop:2 }}>
					<div>
						{ attr[this.props.nameField] + (this.props.showScore ? this.props.score : '' ) }
					</div>
				</div>
			</li>
		);
	},

	select: function (e) {
		this.props.selectItem(this.props.item)

		e.stopPropagation();
	}
});

var FuzzySearch = React.createClass({
	getInitialState: function(){
		return {
			active: false,
			computing: true,
			results: [],
			searchTerm: "",
			searchTimes: {},
			threadID: 0,
			threadResults: {}
		}
	},

	componentDidMount: function(){
		this._computeData()

		if(this.props.initialSelectedID){
			var selectedItem = this.props.items.filter(function (item) { return item[this.props.idField] == this.props.initialSelectedID})
			if(selectedItem.length === 1)
				this.setState({ selectedItem: selectedItem[0] });
		}
	},

	getDefaultProps: function(){
		return {
			containerClassName: "",
			delim: " ",
			maxDist: 15,
			maxItems: 25,
			resultsComponent: FuzzySearchResult,
			searchLowerCase: true,
			threadCount: 2,
			useWebWorkers: !!window.Worker
		}
	},

	componentDidUpdate: function(prevProps, prevState){
		if(this.props.items != prevProps.items){
			this.setState({
				computing: true
			}, this._computeData)
		}
		else{
			if(this.state.active != prevState.active){
				if(this.state.active){
					document.addEventListener("click", this._checkForClose, false)
					this.refs.input.getDOMNode().focus();
				}
				else
					document.removeEventListener("click", this._checkForClose)
			}

			if(this.state.searchingAsync && this._asyncSearchComplete()){
				var results = this.state.threadResults[this.state.threadID]
									.reduce(function(acc, res) { return acc.concat(res) }, [])
									.sort(function(a,b) { return a._score - b._score })

				var searchTimes = this.state.searchTimes
				searchTimes[this.state.threadID].end = performance.now()

				this.setState({
					results: results.slice(0, this.props.maxItems),
					searchingAsync: false,
					searchTimes
				})
			}
		}
	},

	componentWillUnmount: function(){
		this._closeWorkers();
	},

	_checkForClose: function (e) {
		if(!containsNode(this.getDOMNode(), e.target))
			this.setInactive();
	},

	_asyncSearchComplete: function(){
		return this.state.threadResults[this.state.threadID].length == this.props.threadCount
	},

	_computeData: function(){
		this.setState(computeSearchValues(this.props.items, this.props), this._createWorkers)
	},

	_createWorkers: function(){
		if(this.props.useWebWorkers){
			this._threads = [];

			for(var i = 0; i < this.props.threadCount; i++){
				var worker = new Worker(workerBlobURL);

				worker.onmessage = this.onWorkerMessage;

				worker.postMessage({
					cmd: "setData",
					items: this.state.slices[i]
				})

				this._threads.push({ worker })
			}
		}

		if(this.state.searchTerm.length) 
			this.search({ target: { value: this.state.searchTerm }}) //hacky I know
	},

	_closeWorkers: function(){
		if(this.props.useWebWorkers && this._threads){
			this._threads.forEach(function(thread){
				thread.worker.terminate();
			})
		}
	},

	render: function () {
		var items = this.state.searchTerm.length ?
				this.state.results :
				this.state.items ?
					this.state.items.slice(0, this.props.maxItems) :
					[],
			inactive = this.state.selectedItem && !this.state.active,
			inpClasses = cx({
				"fuzzy-inp": true,
				"fuzzy-inp-inactive": inactive
			})

		return (
			<span className={"fuzzy-search " + this.props.containerClassName}>
				<input
					{...this.props}
					className={inpClasses}
					disabled={this.state.computing}
					onChange={this.search}
					onFocus={this.setActive}
					ref="input"
					type="text"
					value={inactive ?
						this.state.selectedItem[this.props.nameField] :
						this.state.searchTerm
					}
				/>

				{ this.props.showTimes &&
					<span>
						<FuzzySearchTime
							timing={this.state.searchTimes[this.state.threadID]}
						/>
					</span>
				}
				
				{ this.state.active &&
					<ul className="fuzzy-results-cont">
						{ items.map(function(result) {
							return (
								React.createElement(this.props.resultsComponent, {
									key: result._originalItem[this.props.idField],
									nameField: this.props.nameField,
									item: result._originalItem,
									score: result._score,
									selected: result._originalItem == this.state.selectedItem,
									selectItem: this.selectItem,
									showScore: this.props.showScore
								})
							)
						}, this)}
					</ul>
				}
			</span>
		);
	},

	runSearch: function(searchTerms){
		var	queue = new PriorityQueue(function(a, b) { return a.dist - b.dist }),
			results = [],
			maxDist = -1,
			cache = {};


		for(var i = 0; i < this.state.items.length; i++){
			var item = this.state.items[i],
				dist = 0;

			for(var j = 0; j < searchTerms.length; j++){
				var searchTerm= searchTerms[j],
					minDist = 10000;

				cache[searchTerm] = cache[searchTerm] || {}

				for(var k = 0; k < item._searchValues.length; k++){
					var searchValue = item._searchValues[k],
						curDist;

					/*
						Special case for an exact match
					*/

					if(searchValue == searchTerm){
						minDist = -1;
						break;
					}
					else{
						/*
							searchWithSubstringWhenLessThan is a number that will use a substring 
							of the original value's length rather than the full. Useful in cases 
							where e.g. searching for wag is a closer match to zac than wagoner
						*/
						var useSubstr = this.props.searchWithSubstring ||
							(searchTerm.length <= this.props.searchWithSubstringWhenLessThan && searchValue.length > this.props.searchWithSubstringWhenLessThan);

						if(useSubstr)
							searchValue = searchValue.substr(0, searchTerm.length);

						if(cache[searchTerm] && cache[searchTerm][searchValue])
							curDist = cache[searchTerm][searchValue]
						else
							curDist = cache[searchTerm][searchValue] = levenshtein.get(searchTerm, searchValue)
					}

					if(curDist < minDist)
						minDist = curDist;
				}

				dist += minDist;
			}

			if(item._searchValues.length < searchTerms.length)
				dist += (searchTerms.length - item._searchValues.length) * 5;

			if(queue.size() < this.props.maxItems){
				if(dist > maxDist)
					maxDist = dist;
				queue.enq({ item, dist })
			}
			else if(dist < maxDist){
				queue.deq()
				maxDist = queue.peek().dist;
				queue.enq({ item, dist })
			}
		}

		while(queue.size()){
			var _res = queue.deq();
			if(_res.dist < this.props.maxDist){
				_res.item._score = _res.dist;
				results.unshift(_res.item)
			}
		}


		var	searchTimes = this.state.searchTimes;
		searchTimes[this.state.threadID].end = performance.now()

		this.setState({
			results,
			searchTimes
		})
	},

	search: function(e){
		var threadID = this.state.threadID + 1,
			threadResults = {},
			searchTimes = this.state.searchTimes;

		threadResults[threadID] = []
		searchTimes[threadID] = { searchTerm: e.target.value, start: performance.now() }

		this.setState({
			searching: true,
			searchTerm: e.target.value,
			searchTimes,
			threadID,
			threadResults
		}, this.startSearch)
	},

	selectItem: function (selectedItem) {
		this.setState({ active: false, selectedItem });

		if(this.props.onChange)
			this.props.onChange(selectedItem);
	},

	setActive: function (e) {
		this.setState({
			active: true
		});

		if(this.props.onFocus)
			this.props.onFocus(e)
		else if(e && e.stopPropagation)
			e.stopPropagation();
	},

	setInactive: function (e) {
		this.setState({
			active: false
		});

		if(this.props.onBlur)
			this.props.onBlur(e)
		else if(e && e.stopPropagation)
			e.stopPropagation();
	},

	startSearch: function(){
		var searchTerms = this.state.searchTerm
				.split(" ")
				.filter(function(term) { return term.length > 1 })
				.map(function(term) { return term.toLowerCase() });

		if(this.props.useWebWorkers){
			for(var i = 0; i < this.props.threadCount; i++){
				var worker = this._threads[i].worker,
					slice = this.state.slices[i]

				worker.postMessage({
					cmd: "search",
					opts: {
						maxDist: this.props.maxDist,
						maxItems: this.props.maxItems,
						searchWithSubstring: this.props.searchWithSubstring,
						searchWithSubstringWhenLessThan: this.props.searchWithSubstringWhenLessThan
					},
					searchTerms,
					threadID: this.state.threadID
				})
			}

			this.setState({
				searchingAsync: true
			})
		}
		else
			this.runSearch(searchTerms);
	},

	onWorkerMessage: function(e){
		if(e.data && e.data.results){
			var threadResults = this.state.threadResults,
				threadResultsForID = threadResults[e.data.threadID]

			if(threadResultsForID){
				threadResultsForID.push(e.data.results)
				this.state.threadResults[e.data.threadID] = threadResultsForID;

				this.setState({ threadResults })
			}
		}	
	}
})

var FuzzySearchTime = React.createClass({
	render: function () {
		var timing = this.props.timing

		if(timing && timing.end)
			console.log(timing.searchTerm, timing.end - timing.start)

		return timing && timing.searchTerm ?
			<span>
				{ timing.end ? 
					" - searching for " + timing.searchTerm + " took " + (timing.end - timing.start).toFixed(1) + "ms"
			 	:
					" - searching for " + timing.searchTerm
				}
			</span>
		:
			<span />
	}
})


module.exports = FuzzySearch;
