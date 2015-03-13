(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.FuzzySearch = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./components/FuzzySearch.js")

},{"./components/FuzzySearch.js":4}],2:[function(require,module,exports){
function classNames() {
	var args = arguments;
	var classes = [];

	for (var i = 0; i < args.length; i++) {
		var arg = args[i];
		if (!arg) {
			continue;
		}

		if ('string' === typeof arg || 'number' === typeof arg) {
			classes.push(arg);
		} else if ('object' === typeof arg) {
			for (var key in arg) {
				if (!arg.hasOwnProperty(key) || !arg[key]) {
					continue;
				}
				classes.push(key);
			}
		}
	}
	return classes.join(' ');
}

// safely export classNames in case the script is included directly on a page
if (typeof module !== 'undefined' && module.exports) {
	module.exports = classNames;
}

},{}],3:[function(require,module,exports){
/**
 * Expose `PriorityQueue`.
 */
module.exports = PriorityQueue;

/**
 * Initializes a new empty `PriorityQueue` with the given `comparator(a, b)`
 * function, uses `.DEFAULT_COMPARATOR()` when no function is provided.
 *
 * The comparator function must return a positive number when `a > b`, 0 when
 * `a == b` and a negative number when `a < b`.
 *
 * @param {Function}
 * @return {PriorityQueue}
 * @api public
 */
function PriorityQueue(comparator) {
  this._comparator = comparator || PriorityQueue.DEFAULT_COMPARATOR;
  this._elements = [];
}

/**
 * Compares `a` and `b`, when `a > b` it returns a positive number, when
 * it returns 0 and when `a < b` it returns a negative number.
 *
 * @param {String|Number} a
 * @param {String|Number} b
 * @return {Number}
 * @api public
 */
PriorityQueue.DEFAULT_COMPARATOR = function(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  } else {
    a = a.toString();
    b = b.toString();

    if (a == b) return 0;

    return (a > b) ? 1 : -1;
  }
};

/**
 * Returns whether the priority queue is empty or not.
 *
 * @return {Boolean}
 * @api public
 */
PriorityQueue.prototype.isEmpty = function() {
  return this.size() === 0;
};

/**
 * Peeks at the top element of the priority queue.
 *
 * @return {Object}
 * @throws {Error} when the queue is empty.
 * @api public
 */
PriorityQueue.prototype.peek = function() {
  if (this.isEmpty()) throw new Error('PriorityQueue is empty');

  return this._elements[0];
};

/**
 * Dequeues the top element of the priority queue.
 *
 * @return {Object}
 * @throws {Error} when the queue is empty.
 * @api public
 */
PriorityQueue.prototype.deq = function() {
  var first = this.peek();
  var last = this._elements.pop();
  var size = this.size();

  if (size === 0) return first;

  this._elements[0] = last;
  var current = 0;

  while (current < size) {
    var largest = current;
    var left = (2 * current) + 1;
    var right = (2 * current) + 2;

    if (left < size && this._compare(left, largest) >= 0) {
      largest = left;
    }

    if (right < size && this._compare(right, largest) >= 0) {
      largest = right;
    }

    if (largest === current) break;

    this._swap(largest, current);
    current = largest;
  }

  return first;
};

/**
 * Enqueues the `element` at the priority queue and returns its new size.
 *
 * @param {Object} element
 * @return {Number}
 * @api public
 */
PriorityQueue.prototype.enq = function(element) {
  var size = this._elements.push(element);
  var current = size - 1;

  while (current > 0) {
    var parent = Math.floor((current - 1) / 2);

    if (this._compare(current, parent) <= 0) break;

    this._swap(parent, current);
    current = parent;
  }

  return size;
};

/**
 * Returns the size of the priority queue.
 *
 * @return {Number}
 * @api public
 */
PriorityQueue.prototype.size = function() {
  return this._elements.length;
};

/**
 *  Iterates over queue elements
 *
 *  @param {Function} fn
 */
PriorityQueue.prototype.forEach = function(fn) {
  return this._elements.forEach(fn);
};

/**
 * Compares the values at position `a` and `b` in the priority queue using its
 * comparator function.
 *
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 * @api private
 */
PriorityQueue.prototype._compare = function(a, b) {
  return this._comparator(this._elements[a], this._elements[b]);
};

/**
 * Swaps the values at position `a` and `b` in the priority queue.
 *
 * @param {Number} a
 * @param {Number} b
 * @api private
 */
PriorityQueue.prototype._swap = function(a, b) {
  var aux = this._elements[a];
  this._elements[a] = this._elements[b];
  this._elements[b] = aux;
};

},{}],4:[function(require,module,exports){
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
	var $__0=           opts,field=$__0.field,searchField=$__0.searchField,delim=$__0.delim,immutable=$__0.immutable,removePunctuation=$__0.removePunctuation,useWebWorkers=$__0.useWebWorkers,searchLowerCase=$__0.searchLowerCase,threadCount=$__0.threadCount;

	searchField = searchField || field;

	var _searchItems = [],
		slices = [];

	items = typeof items.toArray  == "function" ?
		items.toArray() :
		items;

	items.forEach(function(item){
		var _searchValues = [],
			added = {};
		_searchItems.push({ _originalItem: item, _searchValues:_searchValues })

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

var FuzzySearchResult = React.createClass({displayName: "FuzzySearchResult",
	render: function(){
		return (
			React.createElement("li", {className: "fuzzy-search-result", onClick: this.props.selectItem && this.select, style: this.props.style}, 
				React.createElement("div", {className: "inline-top", style: { paddingLeft: 4, marginTop:2}}, 
					React.createElement("div", null, 
						 this.props.item[this.props.nameField] + (this.props.showScore ? this.props.score : '') 
					)
				)
			)
		);
	},

	select: function (e) {
		this.props.selectItem(this.props.item)

		e.stopPropagation();
	}
});

var FuzzySearch = React.createClass({displayName: "FuzzySearch",
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

					this._threads.push({ worker:worker })
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
			React.createElement("span", {className: "fuzzy-search " + this.props.containerClassName}, 
				React.createElement("input", React.__spread({}, 
					this.props, 
					{className: inpClasses, 
					disabled: this.state.computing, 
					onChange: this.search, 
					onFocus: this.setActive, 
					ref: "input", 
					type: "text", 
					value: inactive ?
						this.state.selectedItem[this.props.nameField] :
						this.state.searchTerm
					})
				), 
				
				 this.state.active &&
					React.createElement("ul", {className: "fuzzy-results-cont"}, 
						 items.map(function(result) {
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
						}, this)
					)
				
			)
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
			results:results
		})
	},

	search: function(e){
		var threadID = this.state.threadID + 1,
			threadResults = {};

		threadResults[threadID] = []

		this.setState({
			searching: true,
			searchTerm: e.target.value,
			threadID:threadID,
			threadResults:threadResults
		}, this.startSearch)
	},

	selectItem: function (selectedItem) {
		this.setState({ active: false, selectedItem:selectedItem });

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
					searchTerms:searchTerms,
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

				this.setState({ threadResults:threadResults })
			}
		}	
	}
})


module.exports = FuzzySearch;


},{"../utils/JaroWinkler":5,"../utils/containsNode":6,"../worker/worker":7,"classnames":2,"priorityqueuejs":3,"react":"react"}],5:[function(require,module,exports){
module.exports = {
	weight: 0.1,

	get: function(str1, str2){
		str1 = str1.toLowerCase();
		str2 = str2.toLowerCase();

		var jaroDist;
		if(str1 == str2)
			jaroDist = 1;
		else if(!str1.length || !str2.length)
			jaroDist = 0
		else{
			var matchWindow = Math.max(0, Math.floor(Math.max(str1.length, str2.length)/2-1)),
				str1Flags = new Array(str1.length),
				str2Flags = new Array(str2.length),
				matches = 0;
	  
			for(var i = 0; i < str1.length; i += 1){
				var start = i > matchWindow ? i - matchWindow : 0,
					end = i + matchWindow < str2.length ? i + matchWindow : str2.length - 1;

				for(var j = start; j < end + 1; j++){
					if(!str2Flags[j] && str2[j] == str1[i]){
						str1Flags[i] = str2Flags[j] = true;
						matches++;
						break;
					}
				}
			}

			if(!matches){
				jaroDist = 0;
			}
			else{
				var transpositions = 0,
					str2Offset = 0;

				for(var i = 0; i < str1Flags.length; i++){
					if(str1Flags[i]){
						for(var j = str2Offset; j < str2.length; j++){
							if(str2Flags[j]){
								str2Offset = j + 1
								break
							}
						}
						if(str1Flags[i] != str2Flags[j])
							transpositions += 1
					}
				}

				transpositions /= 2

				jaroDist = ((matches / str1.length) + (matches / str2.length) + ((matches - transpositions) / matches)) / 3
			}
		}

		// count the number of matching characters up to 4
		var matches = 0
		for(var i = 0; i < 4; i++) {
			if(str1[i]==str2[i])
				matches += 1
			else
				break
		}

		return jaroDist + (matches * this.weight * (1 - jaroDist));
	}
};

},{}],6:[function(require,module,exports){
function containsNode(parentNode, childNode) {
	if('contains' in parentNode) {
		return parentNode.contains(childNode);
	}
	else {
		return parentNode.compareDocumentPosition(childNode) % 16;
	}
}

module.exports = containsNode;

},{}],7:[function(require,module,exports){
var worker = function(){
	/**
		priorityqueuejs
		https://github.com/janogonzalez/priorityqueuejs
		MIT
	*/


	/**
	 * Initializes a new empty `PriorityQueue` with the given `comparator(a, b)`
	 * function, uses `.DEFAULT_COMPARATOR()` when no function is provided.
	 *
	 * The comparator function must return a positive number when `a > b`, 0 when
	 * `a == b` and a negative number when `a < b`.
	 *
	 * @param {Function}
	 * @return {PriorityQueue}
	 * @api public
	 */
	function PriorityQueue(comparator) {
	  this._comparator = comparator || PriorityQueue.DEFAULT_COMPARATOR;
	  this._elements = [];
	}

	/**
	 * Compares `a` and `b`, when `a > b` it returns a positive number, when
	 * it returns 0 and when `a < b` it returns a negative number.
	 *
	 * @param {String|Number} a
	 * @param {String|Number} b
	 * @return {Number}
	 * @api public
	 */
	PriorityQueue.DEFAULT_COMPARATOR = function(a, b) {
	  if (typeof a === 'number' && typeof b === 'number') {
	    return a - b;
	  } else {
	    a = a.toString();
	    b = b.toString();

	    if (a == b) return 0;

	    return (a > b) ? 1 : -1;
	  }
	};

	/**
	 * Returns whether the priority queue is empty or not.
	 *
	 * @return {Boolean}
	 * @api public
	 */
	PriorityQueue.prototype.isEmpty = function() {
	  return this.size() === 0;
	};

	/**
	 * Peeks at the top element of the priority queue.
	 *
	 * @return {Object}
	 * @throws {Error} when the queue is empty.
	 * @api public
	 */
	PriorityQueue.prototype.peek = function() {
	  if (this.isEmpty()) throw new Error('PriorityQueue is empty');

	  return this._elements[0];
	};

	/**
	 * Dequeues the top element of the priority queue.
	 *
	 * @return {Object}
	 * @throws {Error} when the queue is empty.
	 * @api public
	 */
	PriorityQueue.prototype.deq = function() {
	  var first = this.peek();
	  var last = this._elements.pop();
	  var size = this.size();

	  if (size === 0) return first;

	  this._elements[0] = last;
	  var current = 0;

	  while (current < size) {
	    var largest = current;
	    var left = (2 * current) + 1;
	    var right = (2 * current) + 2;

	    if (left < size && this._compare(left, largest) >= 0) {
	      largest = left;
	    }

	    if (right < size && this._compare(right, largest) >= 0) {
	      largest = right;
	    }

	    if (largest === current) break;

	    this._swap(largest, current);
	    current = largest;
	  }

	  return first;
	};

	/**
	 * Enqueues the `element` at the priority queue and returns its new size.
	 *
	 * @param {Object} element
	 * @return {Number}
	 * @api public
	 */
	PriorityQueue.prototype.enq = function(element) {
	  var size = this._elements.push(element);
	  var current = size - 1;

	  while (current > 0) {
	    var parent = Math.floor((current - 1) / 2);

	    if (this._compare(current, parent) <= 0) break;

	    this._swap(parent, current);
	    current = parent;
	  }

	  return size;
	};

	/**
	 * Returns the size of the priority queue.
	 *
	 * @return {Number}
	 * @api public
	 */
	PriorityQueue.prototype.size = function() {
	  return this._elements.length;
	};

	/**
	 *  Iterates over queue elements
	 *
	 *  @param {Function} fn
	 */
	PriorityQueue.prototype.forEach = function(fn) {
	  return this._elements.forEach(fn);
	};

	/**
	 * Compares the values at position `a` and `b` in the priority queue using its
	 * comparator function.
	 *
	 * @param {Number} a
	 * @param {Number} b
	 * @return {Number}
	 * @api private
	 */
	PriorityQueue.prototype._compare = function(a, b) {
	  return this._comparator(this._elements[a], this._elements[b]);
	};

	/**
	 * Swaps the values at position `a` and `b` in the priority queue.
	 *
	 * @param {Number} a
	 * @param {Number} b
	 * @api private
	 */
	PriorityQueue.prototype._swap = function(a, b) {
	  var aux = this._elements[a];
	  this._elements[a] = this._elements[b];
	  this._elements[b] = aux;
	};

	var JaroWinkler = {
		weight: 0.1,

		get: function(str1, str2){
			str1 = str1.toLowerCase();
			str2 = str2.toLowerCase();

			var jaroDist;
			if(str1 == str2)
				jaroDist = 1;
			else if(!str1.length || !str2.length)
				jaroDist = 0
			else{
				var matchWindow = Math.max(0, Math.floor(Math.max(str1.length, str2.length)/2-1)),
					str1Flags = new Array(str1.length),
					str2Flags = new Array(str2.length),
					matches = 0;
		  
				for(var i = 0; i < str1.length; i += 1){
					var start = i > matchWindow ? i - matchWindow : 0,
						end = i + matchWindow < str2.length ? i + matchWindow : str2.length - 1;

					for(var j = start; j < end + 1; j++){
						if(!str2Flags[j] && str2[j] == str1[i]){
							str1Flags[i] = str2Flags[j] = true;
							matches++;
							break;
						}
					}
				}

				if(!matches){
					jaroDist = 0;
				}
				else{
					var transpositions = 0,
						str2Offset = 0;

					for(var i = 0; i < str1Flags.length; i++){
						if(str1Flags[i]){
							for(var j = str2Offset; j < str2.length; j++){
								if(str2Flags[j]){
									str2Offset = j + 1
									break
								}
							}
							if(str1Flags[i] != str2Flags[j])
								transpositions += 1
						}
					}

					transpositions /= 2

					jaroDist = ((matches / str1.length) + (matches / str2.length) + ((matches - transpositions) / matches)) / 3
				}
			}

			// count the number of matching characters up to 4
			var matches = 0
			for(var i = 0; i < 4; i++) {
				if(str1[i]==str2[i])
					matches += 1
				else
					break
			}

			return jaroDist + (matches * this.weight * (1 - jaroDist));
		}
	};

	var _items;

	self.addEventListener('message', function(e) {
	  var data = e.data;
	  switch (data.cmd) {
	    case 'setData':
	      _items = data.items;
	      break;
	    case 'search':
	      var results = runSearch(data.searchTerms, _items, data.opts)
	      self.postMessage({ threadID: data.threadID, results: results })
	      break;
	    case 'stop':
	      self.postMessage('stopped');
	      self.close(); 
	      break;
	  	default:
	  	  break;
	  };
	}, false);


	function runSearch(searchTerms, items, opts){
		var queue = new PriorityQueue(function(a,b) { return b.dist - a.dist }),
			results = [],
			minDist = 0,
			cache = {};

		for(var i = 0; i < items.length; i++){
			var item = items[i],
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
				
				flagged[flagPos] = maxDist;
				totalDist += maxDist;
			}

			if(queue.size() < opts.maxItems){
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

		while(queue.size()){
			var _res = queue.deq();
			_res.item._score = _res.dist;
			results.unshift(_res.item)
		}

		return results;
	}
}

module.exports = worker;

},{}]},{},[1])(1)
});