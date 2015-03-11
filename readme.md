React Fuzzy Search
==================

About
-----

An approximate search component. FuzzySearch allows users to search data using search terms (in any order) with a best match searching algorithm that allows for misspellings and typos. For example, given a dataset with "March 16th Safety and Awareness Training, Room 217" a search for "Saferty Training 217" (note the typo) will rate it as a top result (assuming no better matches).

## Installation

```sh
npm install react-fuzzy-search
```

#### Installation Note

This component is written using CommonJS modules. Unfortunately, both Browserify and Webpack have different methods for using CommonJS in web workers so I've opted to instead include requirements directly in the worker.js file and load it as a blob.

For users that means no additional configuration of a path to the worker.js file. There is a current incompatibility with web workers due to this at the moment that I hope to resolve.



## Usage Notes

```javascript
        var FuzzySearch = require("react-fuzzy-search")

        ...

        // Note: bold props are required.

        <FuzzySearch
          containerClassName="extra-class" // Default "". An optional extra class for the wrapper component
          **idField**="id" // The name of the id (or other field) per object in the items array to use as a key property for results)
          **items**={peopleSearchData} // An array (or Immutable.js List)
          **field**="name" // The name of the property to search
          immutable={true} // Defaults to true. See note below
          initialSelectedID={-1} // Default undefined. 
          **nameField**="name" // The name of the property to display as results
          maxUnfilteredItems={100} // The number of item to display when not searching
          minScore={.7} // The minimum score to place in the list. minScore is multiplied by the number of search terms.
          onChange={this.onSearchChange} // Item selected callback
          placeholder="Search..." 
          removePunctuation={true} // If true remove punctuation from the search field
          showScore={false} // If true show the calculated score next to each result. For debugging
          threadCount={2} // If using webworkers, the number of threads
          useWebWorkers={true} // Internally FuzzySearch will check for web worker support so this can be set for all browsers.
        />

```

### Immutability
In order to be performant over large data sets, FuzzySearch does some precomputations on its data. FuzzySearch will detect a change in data and re-compute the search data, but in order to do so the items prop must fail an equality check.

If it's not clear what that means: many array methods will update the array they are called on, changing it in place. For example, push, pop, shift, unshift, splice and sort all result in changes to the original array. Some methods, slice and concat notably, will create a new array leaving the array they were called on unchanged. For example,

```javascript
var items = ["Bob", "Dave", "Sally"]

items[1] = "David" // Bad: this.props.items == nextProps.items => true
items.push("Amy") // Also bad: this.props.items == nextProps.items => true

items = items.concat("Andy") // Good: this.props.items == nextProps.items => false
items = items.slice(0)[1] = "David" // this.props.items == nextProps.items => false
```

An even simpler way would be to use [Immutable.js](https://github.com/facebook/immutable-js).

Alternatively, immutable can be set to false and items can be updated in place. I haven't tested performance in this case but it's possible FuzzySearch is still performant for small datasets.

## Support
Chrome, Firefox, IE>=8.

#### Web worker support
Due to IE10 throwing a SecurityError when using Blobs with web workers they are disabled IE <11. 