(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.FuzzySearch = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./components/FuzzySearch.js")

},{"./components/FuzzySearch.js":5}],2:[function(require,module,exports){
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
(function() {
  'use strict';

  /**
   * Extend an Object with another Object's properties.
   *
   * The source objects are specified as additional arguments.
   *
   * @param dst Object the object to extend.
   *
   * @return Object the final object.
   */
  var _extend = function(dst) {
    var sources = Array.prototype.slice.call(arguments, 1);
    for (var i=0; i<sources.length; ++i) {
      var src = sources[i];
      for (var p in src) {
        if (src.hasOwnProperty(p)) dst[p] = src[p];
      }
    }
    return dst;
  };

  /**
   * Based on the algorithm at http://en.wikipedia.org/wiki/Levenshtein_distance.
   */
  var Levenshtein = {
    /**
     * Calculate levenshtein distance of the two strings.
     *
     * @param str1 String the first string.
     * @param str2 String the second string.
     * @return Integer the levenshtein distance (0 and above).
     */
    get: function(str1, str2) {
      // base cases
      if (str1 === str2) return 0;
      if (str1.length === 0) return str2.length;
      if (str2.length === 0) return str1.length;

      // two rows
      var prevRow  = new Array(str2.length + 1),
          curCol, nextCol, i, j, tmp;

      // initialise previous row
      for (i=0; i<prevRow.length; ++i) {
        prevRow[i] = i;
      }

      // calculate current row distance from previous row
      for (i=0; i<str1.length; ++i) {
        nextCol = i + 1;

        for (j=0; j<str2.length; ++j) {
          curCol = nextCol;

          // substution
          nextCol = prevRow[j] + ( (str1.charAt(i) === str2.charAt(j)) ? 0 : 1 );
          // insertion
          tmp = curCol + 1;
          if (nextCol > tmp) {
            nextCol = tmp;
          }
          // deletion
          tmp = prevRow[j + 1] + 1;
          if (nextCol > tmp) {
            nextCol = tmp;
          }

          // copy current col value into previous (in preparation for next iteration)
          prevRow[j] = curCol;
        }

        // copy last col value into previous (in preparation for next iteration)
        prevRow[j] = nextCol;
      }

      return nextCol;
    },

    /**
     * Asynchronously calculate levenshtein distance of the two strings.
     *
     * @param str1 String the first string.
     * @param str2 String the second string.
     * @param cb Function callback function with signature: function(Error err, int distance)
     * @param [options] Object additional options.
     * @param [options.progress] Function progress callback with signature: function(percentComplete)
     */
    getAsync: function(str1, str2, cb, options) {
      options = _extend({}, {
        progress: null
      }, options);

      // base cases
      if (str1 === str2) return cb(null, 0);
      if (str1.length === 0) return cb(null, str2.length);
      if (str2.length === 0) return cb(null, str1.length);

      // two rows
      var prevRow  = new Array(str2.length + 1),
          curCol, nextCol,
          i, j, tmp,
          startTime, currentTime;

      // initialise previous row
      for (i=0; i<prevRow.length; ++i) {
        prevRow[i] = i;
      }

      nextCol = 1;
      i = 0;
      j = -1;

      var __calculate = function() {
        // reset timer
        startTime = new Date().valueOf();
        currentTime = startTime;

        // keep going until one second has elapsed
        while (currentTime - startTime < 1000) {
          // reached end of current row?
          if (str2.length <= (++j)) {
            // copy current into previous (in preparation for next iteration)
            prevRow[j] = nextCol;

            // if already done all chars
            if (str1.length <= (++i)) {
              return cb(null, nextCol);
            }
            // else if we have more left to do
            else {
              nextCol = i + 1;
              j = 0;
            }
          }

          // calculation
          curCol = nextCol;

          // substution
          nextCol = prevRow[j] + ( (str1.charAt(i) === str2.charAt(j)) ? 0 : 1 );
          // insertion
          tmp = curCol + 1;
          if (nextCol > tmp) {
            nextCol = tmp;
          }
          // deletion
          tmp = prevRow[j + 1] + 1;
          if (nextCol > tmp) {
            nextCol = tmp;
          }

          // copy current into previous (in preparation for next iteration)
          prevRow[j] = curCol;

          // get current time
          currentTime = new Date().valueOf();
        }

        // send a progress update?
        if (null !== options.progress) {
          try {
            options.progress.call(null, (i * 100.0/ str1.length));
          } catch (err) {
            return cb('Progress callback: ' + err.toString());
          }
        }

        // next iteration
        setTimeout(__calculate(), 0);
      };

      __calculate();
    }

  };

  // amd
  if (typeof define !== "undefined" && define !== null && define.amd) {
    define(function() {
      return Levenshtein;
    });
  }
  // commonjs
  else if (typeof module !== "undefined" && module !== null) {
    module.exports = Levenshtein;
  }
  // web worker
  else if (typeof self !== "undefined" && typeof self.postMessage === 'function' && typeof self.importScripts === 'function') {
    self.Levenshtein = Levenshtein;
  }
  // browser main thread
  else if (typeof window !== "undefined" && window !== null) {
    window.Levenshtein = Levenshtein;
  }
}());


},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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
	var $__0=         opts,field=$__0.field,delim=$__0.delim,removePunctuation=$__0.removePunctuation,useWebWorkers=$__0.useWebWorkers,searchLowerCase=$__0.searchLowerCase,threadCount=$__0.threadCount;

	var _searchItems = [],
		slices = [];

	items = typeof items.toArray  == "function" ?
		items.toArray() :
		items;

	items.forEach(function(item){
		var _searchValues = [],
			added = {};
		_searchItems.push({ _originalItem: item, _searchValues:_searchValues })

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

var FuzzySearchResult = React.createClass({displayName: "FuzzySearchResult",
	render: function(){
		var attr = this.props.item,
			classes = cx({
				"fuzzy-search-result": true,
				"hover-blue": this.props.selectItem
			})

		return (
			React.createElement("li", {className: classes, onClick: this.props.selectItem && this.select, style: this.props.style}, 
				React.createElement("div", {className: "inline-top", style: { paddingLeft: 4, marginTop:2}}, 
					React.createElement("div", null, 
						 attr[this.props.nameField] + (this.props.showScore ? this.props.score : '') 
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
					searchTimes:searchTimes
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

				this._threads.push({ worker:worker })
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

				 this.props.showTimes &&
					React.createElement("span", null, 
						React.createElement(FuzzySearchTime, {
							timing: this.state.searchTimes[this.state.threadID]}
						)
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

						if(cache[searchTerm][searchValue])
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
				queue.enq({ item:item, dist:dist })
			}
			else if(dist < maxDist){
				queue.deq()
				maxDist = queue.peek().dist;
				queue.enq({ item:item, dist:dist })
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
			results:results,
			searchTimes:searchTimes
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
			searchTimes:searchTimes,
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
					searchTerms:searchTerms,
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

				this.setState({ threadResults:threadResults })
			}
		}	
	}
})

var FuzzySearchTime = React.createClass({displayName: "FuzzySearchTime",
	render: function () {
		var timing = this.props.timing

		if(timing && timing.end)
			console.log(timing.searchTerm, timing.end - timing.start)

		return timing && timing.searchTerm ?
			React.createElement("span", null, 
				 timing.end ? 
					" - searching for " + timing.searchTerm + " took " + (timing.end - timing.start).toFixed(1) + "ms"
			 	:
					" - searching for " + timing.searchTerm
				
			)
		:
			React.createElement("span", null)
	}
})


module.exports = FuzzySearch;


},{"../utils/containsNode":6,"../worker/worker":7,"classnames":2,"fast-levenshtein":3,"priorityqueuejs":4,"react":"react"}],6:[function(require,module,exports){
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

	/**
	fast-levenshtein
	https://github.com/hiddentao/fast-levenshtein

	(MIT License)

	Copyright (c) 2013 Ramesh Nair

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	*/

	var levenshtein = {
	    /**
	     * Calculate levenshtein distance of the two strings.
	     *
	     * @param str1 String the first string.
	     * @param str2 String the second string.
	     * @return Integer the levenshtein distance (0 and above).
	     */
	    get: function(str1, str2) {
	      // base cases
	      if (str1 === str2) return 0;
	      if (str1.length === 0) return str2.length;
	      if (str2.length === 0) return str1.length;

	      // two rows
	      var prevRow  = new Array(str2.length + 1),
	          curCol, nextCol, i, j, tmp;

	      // initialise previous row
	      for (i=0; i<prevRow.length; ++i) {
	        prevRow[i] = i;
	      }

	      // calculate current row distance from previous row
	      for (i=0; i<str1.length; ++i) {
	        nextCol = i + 1;

	        for (j=0; j<str2.length; ++j) {
	          curCol = nextCol;

	          // substution
	          nextCol = prevRow[j] + ( (str1.charAt(i) === str2.charAt(j)) ? 0 : 1 );
	          // insertion
	          tmp = curCol + 1;
	          if (nextCol > tmp) {
	            nextCol = tmp;
	          }
	          // deletion
	          tmp = prevRow[j + 1] + 1;
	          if (nextCol > tmp) {
	            nextCol = tmp;
	          }

	          // copy current col value into previous (in preparation for next iteration)
	          prevRow[j] = curCol;
	        }

	        // copy last col value into previous (in preparation for next iteration)
	        prevRow[j] = nextCol;
	      }

	      return nextCol;
	    }
	}

	var _items;

	self.addEventListener('message', function(e) {
	  var data = e.data;
	  switch (data.cmd) {
	    case 'setData':
	      self.postMessage('setting data search');
	      _items = data.items;
	      break;
	    case 'search':
	      self.postMessage('starting search');

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
		var queue = new PriorityQueue(function(a,b) { return a.dist - b.dist }),
			results = [],
			maxDist = -1,
			cache = {};

		for(var i = 0; i < items.length; i++){
			var item = items[i],
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
						var useSubstr = opts.searchWithSubstring ||
							(searchTerm.length <= opts.searchWithSubstringWhenLessThan && searchValue.length > opts.searchWithSubstringWhenLessThan);

						if(useSubstr)
							searchValue = searchValue.substr(0, searchTerm.length);

						if(cache[searchTerm][searchValue])
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

			if(queue.size() < opts.maxItems){
				if(dist > maxDist)
					maxDist = dist;
				queue.enq({ item: item, dist: dist })
			}
			else if(dist < maxDist){
				queue.deq()
				maxDist = queue.peek().dist;
				queue.enq({ item: item, dist: dist })
			}
		}

		while(queue.size()){
			var _res = queue.deq();
			if(_res.dist < opts.maxDist){
				_res.item._score = _res.dist;
				results.unshift(_res.item)
			}
		}

		return results;
	}
}

module.exports = worker;

},{}]},{},[1])(1)
});