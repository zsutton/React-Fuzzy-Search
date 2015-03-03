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

	/**
		A quick and dirty Set optimized for size with
		add, has, remove (rather than delete for IE8) and clear 
	*/
	function _Set(){
		this.cache = {};
	}

	_Set.prototype.add = function(obj){
		obj.__inset = Date.now();
		this.cache[obj.__inset] = true;
	}

	_Set.prototype.has = function(obj){
		return obj.__inset && this.cache[obj.__inset]
	}

	_Set.prototype.remove = function(obj){
		delete this.cache[obj.__inset]
		delete obj.__inset
	}

	_Set.prototype.clear = function(){
		for(var item in this.cache)
			delete this.cache[item].__inset
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

	      var addedItems = new _Set()
	      var results = runSearch(data.searchTerms, _items, addedItems, data.opts)
	      self.postMessage({ threadID: data.threadID, results: results })

	      addedItems.clear()
	      break;
	    case 'stop':
	      self.postMessage('stopped');
	      self.close(); 
	      break;
	  	default:
	  	  break;
	  };
	}, false);


	function runSearch(searchTerms, items, addedItems, opts){
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
				if(!addedItems.has(items[i])){
					if(dist > maxDist)
						maxDist = dist;
					queue.enq({ item: item, dist: dist })
					addedItems.add(item)
				}
				else{
					while(item == items[i] && i < items.length)
						i++;
				}
			}
			else if(dist < maxDist){
				addedItems.remove(queue.deq().item)
				addedItems.add(item)
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