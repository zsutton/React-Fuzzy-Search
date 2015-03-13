React Fuzzy Search
==================

About
-----

An approximate search component. FuzzySearch allows users to search data using a best-match searching algorithm that allows for misspellings, typos and out-of-order search terms. For example, given a dataset with "March 16th Safety and Awareness Training, Room 217" a search for "Saferty Training 217" (note the typo) will rate it as a top result (assuming no better matches).

## Installation

```sh
npm install react-fuzzy-search
```

#### Installation Note

This component is written using CommonJS modules. Unfortunately, both Browserify and Webpack have different methods for using CommonJS in web workers so I've opted to instead include requirements directly in the worker.js file and load it as a blob.

That means no additional configuration of a path to the worker.js file. There is, however, a current incompatibility with web workers due to this at the moment that I hope to resolve (see support notes).



## Usage Notes

```javascript
        var FuzzySearch = require("react-fuzzy-search")

        ...

        // Note: starred props are required.

        <FuzzySearch
          containerClassName="extra-class" // Default "". An optional extra class for the wrapper component
          delim=" " // A delimiter to split the seachFields words by
          *idField="id" // The name of the id (or other field) per object in the items array to use as a key property for results)
          *items={peopleSearchData} // An array (or Immutable.js List)
          immutable={true} // Defaults to true. See note below
          initialSelectedID={-1} // Default undefined. 
          *nameField="name" // The name of the property to display as results
          maxUnfilteredItems={100} // The number of item to display when not searching
          minScore={.7} // The minimum score to place in the list. minScore is multiplied by the number of search terms.
          onChange={this.onSearchChange} // Item selected callback
          placeholder="Search..." 
          removePunctuation={true} // If true remove punctuation from the search field
          *searchField="name" // The name of the property to search
          showScore={false} // If true show the calculated score next to each result. For debugging
          threadCount={2} // If using webworkers, the number of threads
          useWebWorkers={true} // Internally FuzzySearch will check for web worker support so this can be set for all browsers.
        />

```

####More on usage

React Fuzzy Search requires four props.

* items {Array|Immutable List} An array of objects. 
* idField {*} A (unique) value for each object in the items array. This field is used as the key.
* nameField {String} The name that will be displayed as a result
* searchField {String} The name of the property in each item of the items array to be searched.

Given an array of people such as this 

```javascript

var people = [{ _id: 1, name: "Bob Davis" }, { _id: 2, name: "John Thomas" }, ...]

```

One could use React Fuzzy Search like this

```javascript

  <FuzzySearch
    idField="_id"
    items={peopleSearchData} 
    nameField="name"
    searchField="name"
  />

```


### Special Note on Immutability
In order to be performant over large data sets, React Fuzzy Search does some precomputations on its data. React Fuzzy Search will detect a change in data and re-compute the search data, but in order to do so the items prop must fail an equality check.

If it's not clear what that means: many array methods will update the array they are called on, changing it in place. For example, _push_, _pop_, _shift_, _unshift_, _splice_ and _sort_ all result in changes to the original array. Some methods, _slice_ and _concat_ notably, will create a new array leaving the array they were called on unchanged. And so,

```javascript
var items = ["Bob", "Dave", "Sally"]

items[1] = "David" // Bad: this.props.items == nextProps.items => true
items.push("Amy") // Also bad: this.props.items == nextProps.items => true

items = items.concat("Andy") // Good: this.props.items == nextProps.items => false
items = items.slice(0) // Good: creates a copy
items[1] = "David" // Can now update it: this.props.items == nextProps.items => false
```

If you need to make updates be sure that you use a method that creates a new array. Or use _slice(0)_ to set your data to a new copy before updating state. An even simpler way would be to use [Immutable.js](https://github.com/facebook/immutable-js).

Alternatively, immutable can be set to false and items can be updated in place. I haven't tested performance in this case but it's possible search is still performant for small datasets.

## Support
Chrome, Firefox, IE>=8.

#### Web worker support
Due to IE10 throwing a SecurityError when using creating a web worker with a blob, they are disabled IE <11. This will be fixed in a future patch.