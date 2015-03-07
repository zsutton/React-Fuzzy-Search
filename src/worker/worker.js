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

	JaroWinkler = {
		weight: 0.1,

		get: function(str1, str2){
			str1 = str1.toLowerCase();
			str2 = str2.toLowerCase();

			var jaroDist;
			if(str1 == str2)
				jaroDist = 1;
			else{
				var matchWindow = Math.max(0, Math.floor(Math.max(str1.length, str2.length)/2-1)),
					negMatchWindow = matchWindow * -1,
					matchLetter = [],
					transpositions = 0,
					matches = 0,
					start = 0,
					mismatch = 0;
		  
				if(matchWindow){
					for (var i = 0; i < str2.length; i++){
						var dist = str1.indexOf(str2[i], i - matchWindow)- i

						if((dist > -1 && dist < matchWindow) || (dist < 0 && dist > negMatchWindow)){
							matches += 1
							if(dist != 0){
								matchLetter.push(str2[i])
							}
						}
					}

					for (var i = 0; i < str1.length; i++){
						var dist = str2.indexOf(str1[i], i - matchWindow) - i

						if((dist > 0 && dist < matchWindow) || (dist < 0 && dist > negMatchWindow)){
							if(str1[i] != matchLetter[mismatch++])
								transpositions+=1
						}
					}
				}
				else{
					for (var i = 0; i < str2.length; i++){
						if(str1 == str2[i])
							matches += 1
					}
				}

				jaroDist = ((matches / str1.length) + (matches / str2.length) + ((matches - Math.floor(transpositions / 2)) / matches)) / 3
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
		debugger;
		var queue = new PriorityQueue(function(a,b) { return b.dist - a.dist }),
			results = [],
			minDist = 10000,
			cache = {};

		for(var i = 0; i < items.length; i++){
			var item = items[i],
				totalDist = 0;

			for(var j = 0; j < searchTerms.length; j++){
				var searchTerm= searchTerms[j],
					maxDist = 0;

				cache[searchTerm] = cache[searchTerm] || {}

				for(var k = 0; k < item._searchValues.length; k++){
					var searchValue = item._searchValues[k],	
						curDist;

					if(cache[searchTerm][searchValue])
						curDist = cache[searchTerm][searchValue]
					else
						curDist = cache[searchTerm][searchValue] = JaroWinkler.get(searchTerm, searchValue)

					if(curDist > maxDist)
						maxDist = curDist;
				}

				totalDist += maxDist;
			}

			if(item._searchValues.length < searchTerms.length)
				totalDist -= (searchTerms.length - item._searchValues.length) * 0.1;

			if(queue.size() < opts.maxItems){
				if(totalDist < minDist)
					minDist = totalDist;
				queue.enq({ item: item, dist: totalDist })
			}
			else if(totalDist < minDist){
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