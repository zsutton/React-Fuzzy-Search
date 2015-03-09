React Fuzzy Search
==================

About
-----

An approximate search component. FuzzySearch allows a user to search data using any possible matching words, regardless of order, and with a best match searching algorithm that allows for misspellings and typos. For example, given a dataset with "March 16th Safety and Awareness Training, Room 217" a search for "Saferty Training" (note the typo) will rate it as a top result (assuming no better matches).

## Installation

```sh
npm install react-fuzzy-search
```

Note: This component is written using CommonJS modules. Unfortunately, both Browserify and Webpack have different methods for using CommonJS in web workers so I've opted to instead include requirements directly in the worker.js file.

## Usage Notes

```javascript
	var FuzzySearch = require("react-fuzzy-search")

	...

	<FuzzySearch
		idField="id" // The name of the id (or other field) per object in the items array to use as a key property for results)
        items={peopleSearchData} // An array (or Immutable.js List)
        field="name" // The name of the property to search
        immutable={true} // Defaults to true. See note below
        nameField="name" // The name of the property to display as results
        placeholder="Search..." 
        removePunctuation={true} // If true remove punctuation from the search field
        showScore={false} // If true show the calculated score next to each result. For debugging
        threadCount={2} // If using webworkers, the number of threads
        useWebWorkers={true} // Internally FuzzySearch will check for web worker support so this can be set for all browsers.
	/>

```

### Immutability
In order to be performant over large data sets, FuzzySearch does some precomputations over data. FuzzySearch will detect a change in data and re-compute the search data, but in order to do so the items prop must fail an equality check.

```javascript
var items = ["Bob", "Dave", "Sally"]

items[1] = "David" // Bad: this.props.items == nextProps.items => true
items.push("Amy") // Also bad: this.props.items == nextProps.items => true

items = items.concat("Andy") // Good: this.props.items == nextProps.items => false
items = items.slice(0)[1] = "David" // this.props.items == nextProps.items => false
```

An even simpler way would be to use Immutable.js

Alternatively, immutable can be set to false and items can be updated in place. I haven't tested performance in this case but it's possible FuzzySearch is still performant for small datasets.

## Support
Chrome, Firefox, IE>=8.