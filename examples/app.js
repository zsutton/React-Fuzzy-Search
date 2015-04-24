var React = require("react"),
	FuzzySearch = require("../src/"),
	_someData = require("../tests/data")

var TestComponent = React.createClass({
	getInitialState: function(){
		return {
			selected: null
		}
	},

	render: function(){
		return (
			<div>
				<FuzzySearch
		          idField="id" // The name of the id (or other field) per object in the items array to use as a key property for results)
		          items={_someData} // An array (or Immutable.js List)
		          nameField="n" // The name of the property to display as results
		          maxUnfilteredItems={100} // The number of item to display when not searching
		          minScore={.7} // The minimum score to place in the list. minScore is multiplied by the number of search terms.
		          onChange={this.onSearchChange} // Item selected callback
		          placeholder="Search..." 
		          searchField="n" // The name of the property to search
		        />

		        { this.state.selected &&
		        	<div>
		        		{ this.state.selected.n } was selected
		        	</div>
		        }
			</div>
		);
	},

	onSearchChange: function(selected){
		this.setState({ selected })
	}
})

React.render(<TestComponent />, document.getElementById("content"))