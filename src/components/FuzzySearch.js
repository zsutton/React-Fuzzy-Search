var React = require("react");
var PriorityQueue = require('priorityqueuejs');
var cx = require("classnames")
var containsNode = require("../utils/containsNode")
var JaroWinkler = require("../utils/JaroWinkler")

var SearchWorker = require("../worker/worker")

// temporarily disabling IE10
var _canUseWorkers = !!window.Worker && !/MSIE/i.test(navigator.userAgent);

var punctuationRE = /[^\w ]/g

function computeSearchValues(items, opts){
	var { field, searchField, delim, immutable, removePunctuation, useWebWorkers, searchLowerCase, threadCount } = opts;

	searchField = searchField || field;

	var _searchItems = [],
		slices = [];

	items = typeof items.toArray  == "function" ?
		items.toArray() :
		items;

	items.forEach(function(item){
		var _searchValues = [],
			added = {};
		_searchItems.push({ _originalItem: item, _searchValues })

		var curSearchField = item[searchField]

		if(removePunctuation)
			curSearchField = curSearchField.replace(punctuationRE, "")

		curSearchField.split(delim).forEach(function(term){
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
	if(useWebWorkers && immutable){
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
		return (
			<li className="fuzzy-search-result" onClick={this.props.selectItem && this.select} style={this.props.style}>
				<div className="inline-top" style={{ paddingLeft: 4, marginTop:2 }}>
					<div>
						{ this.props.item[this.props.nameField] + (this.props.showScore ? this.props.score : '' ) }
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
			threadID: 0,
			threadResults: {}
		}
	},

	componentDidMount: function(){
		this._computeData()

		if(this.props.initialSelectedID){
			var selectedItem = this.props.items.filter(function (item) { return item[this.props.idField] == this.props.initialSelectedID}.bind(this))
			if(selectedItem.length === 1)
				this.setState({ selectedItem: selectedItem[0] });
		}
	},

	getDefaultProps: function(){
		return {
			containerClassName: "",
			delim: " ",
			immutable: true,
			maxItems: 25,
			minScore: .7,
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
				/*
					Minimum score is a value [0,1] multiplied by the number of search terms. If 
					there are 3 search terms and the minScore is .7 a result's score would need
					to be at least 2.1
				*/
				var minScore = this.props.minScore * this.getSearchTerms().length;
				
				var results = this.state.threadResults[this.state.threadID]
									.reduce(function(acc, res) { return acc.concat(res) }, [])
									.filter(function(res) { return res._score > minScore })
									.sort(function(a,b) { return b._score - a._score })

				this.setState({
					results: results.slice(0, this.props.maxItems),
					searchingAsync: false
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
		// check if all threads have returned a result
		return this.state.threadResults[this.state.threadID].length == this.props.threadCount
	},

	_computeData: function(){
		this.setState(computeSearchValues(this.props.items, this.props), this._createWorkers)
	},

	_createWorkers: function(){
		if(this.props.useWebWorkers && _canUseWorkers){
			this._threads = [];
			
			var workerBlob;
			try{
				workerBlob = new Blob(['(' + SearchWorker.toString() + ')();'], {type: "text/javascript"});
			}
			catch(e){
				var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
				blob = new BlobBuilder();
				blob.append(SearchWorker.toString());
				workerBlob = blob.getBlob();
			}
			
			var workerBlobURL = window.URL.createObjectURL(workerBlob);

			for(var i = 0; i < this.props.threadCount; i++){
				var worker;
				try{
					worker = new Worker(workerBlobURL);

					worker.onmessage = this.onWorkerMessage;

					worker.postMessage({
						cmd: "setData",
						items: this.state.slices[i]
					})

					this._threads.push({ worker })
					}
				catch(e){
					// if(e.code == 18){
						// TODO: handle IE10 security error
					// }
				}
			}

			window.URL.revokeObjectURL(workerBlob);
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
		var items = this.getItems(),
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
	
	getItems: function(){
		if(this.state.searchTerm.length){
			return this.state.results
		}
		else{
			if(this.state.items){
				if(this.props.maxUnfilteredItems)
					return this.state.items.slice(0, this.props.maxUnfilteredItems)
				else
					return this.state.items;
			}

		}
		
		return [];
	},

	getSearchTerms: function(){
		return this.state.searchTerm
				.split(" ")
				.filter(function(term) { return term.length > 0 })
				.map(function(term) { return term.toLowerCase() });
	},

	runSearch: function(searchTerms){
		var queue = new PriorityQueue(function(a,b) { return b.dist - a.dist }),
			results = [],
			minDist = 0,
			cache = {};

		for(var i = 0; i < this.state.items.length; i++){
			var item = this.state.items[i],
				totalDist = 0,
				flagged = {};

			for(var j = 0; j < searchTerms.length; j++){
				var searchTerm = searchTerms[j],
					maxDist = 0,
					flagPos;

				cache[searchTerm] = cache[searchTerm] || {}

				for(var k = 0; k < item._searchValues.length; k++){
					var searchValue = item._searchValues[k],	
						curDist;

					if(searchTerm == searchValue){
						if(!flagged[j]){
							flagPos = j;
							maxDist = 1.1
							break;
						}
					}
					else if(cache[searchTerm][searchValue])
						curDist = cache[searchTerm][searchValue]
					else
						curDist = cache[searchTerm][searchValue] = JaroWinkler.get(searchTerm, searchValue)

					if(curDist > maxDist && (!flagged[j] || curDist > flagged[j])){
						flagPos = j;
						maxDist = curDist;
					}
				}
				
				/*
					Worth noting that flagging is crude and only works in one direction. A search term can be a top match
					for a search value and then supplanted by a later search term but its maxDist will not be recalculated.
				*/
				flagged[flagPos] = maxDist;
				totalDist += maxDist;
			}

			if(queue.size() < this.props.maxItems){
				if(totalDist < minDist)
					minDist = totalDist;
				queue.enq({ item: item, dist: totalDist })
			}
			else if(totalDist > minDist){
				queue.deq()
				minDist = queue.peek().dist;
				queue.enq({ item: item, dist: totalDist })
			}
		}

		var minScore = this.props.minScore * searchTerms.length;

		while(queue.size()){
			var _res = queue.deq();
			if(_res.dist > minScore){
				_res.item._score = _res.dist;
				results.unshift(_res.item)
			}
		}

		this.setState({
			results
		})
	},

	search: function(e){
		var threadID = this.state.threadID + 1,
			threadResults = {};

		threadResults[threadID] = []

		this.setState({
			searching: true,
			searchTerm: e.target.value,
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
		var searchTerms = this.getSearchTerms();

		if(this.props.useWebWorkers && _canUseWorkers){
			/*
				Each new state.searchTerm gets a threadID by which the web workers results will be tracked. 
			*/
			for(var i = 0; i < this.props.threadCount; i++){
				var worker = this._threads[i].worker,
					slice = this.state.slices[i]

				worker.postMessage({
					cmd: "search",
					opts: {
						maxItems: this.props.maxItems
					},
					searchTerms,
					threadID: this.state.threadID
				})
			}

			this.setState({
				searchingAsync: true
			})
		}
		else if(!this.props.immutable){
			this.setState(computeSearchValues(this.props.items, this.props), function(){
				this.runSearch(searchTerms);
			})
		}
		else{
			this.runSearch(searchTerms);
		}
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


module.exports = FuzzySearch;
