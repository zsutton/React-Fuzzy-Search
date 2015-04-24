var React = require('react');
var TestUtils = require('react/lib/ReactTestUtils');
var expect = require('expect');
var FuzzySearch = require("../src/index")
var _testData = require("./data")


function createComponent(onChange){
	return (
		<FuzzySearch
          idField="id" // The name of the id (or other field) per object in the items array to use as a key property for results)
          items={_testData} // An array (or Immutable.js List)
          nameField="n" // The name of the property to display as results
          maxUnfilteredItems={100} // The number of item to display when not searching
          minScore={.7} // The minimum score to place in the list. minScore is multiplied by the number of search terms.
          onChange={onChange} // Item selected callback
          placeholder="Search..." 
          searchField="n" // The name of the property to search
        />
	);
}

describe("Search arbritary data and find best matches", function(){
	it('renders', function () {
		var fuzzySearch = TestUtils.renderIntoDocument(createComponent());
		expect(fuzzySearch).toExist();
	});

	it("returns results", function(done){
		var fuzzySearch = TestUtils.renderIntoDocument(createComponent());
		var inp = TestUtils.findRenderedDOMComponentWithClass(fuzzySearch, "fuzzy-inp")

		TestUtils.Simulate.focus(inp)
        TestUtils.Simulate.change(inp, { target: { value: "tiffany morton"}})
		
		setTimeout(function(){
			var results = TestUtils.scryRenderedDOMComponentsWithClass(fuzzySearch, "fuzzy-search-result")
			expect(results.length).toBeGreaterThan(0)
			done();
		}, 300)
	})

	it("ranks an exact match number one", function(done){
		var fuzzySearch = TestUtils.renderIntoDocument(createComponent());
		var inp = TestUtils.findRenderedDOMComponentWithClass(fuzzySearch, "fuzzy-inp")

		TestUtils.Simulate.focus(inp)
        TestUtils.Simulate.change(inp, { target: { value: "tiffany morton"}})

        setTimeout(function(){
			var results = TestUtils.scryRenderedDOMComponentsWithClass(fuzzySearch, "fuzzy-search-result")
			expect(results[0].getDOMNode().textContent).toBe("Tiffany Morton")
			done();
		}, 300)
	})

	it("ranks closest match number one", function(done){
		var fuzzySearch = TestUtils.renderIntoDocument(createComponent());
		var inp = TestUtils.findRenderedDOMComponentWithClass(fuzzySearch, "fuzzy-inp")

		TestUtils.Simulate.focus(inp)
        TestUtils.Simulate.change(inp, { target: { value: "tiphanie morten"}})

        setTimeout(function(){
			var results = TestUtils.scryRenderedDOMComponentsWithClass(fuzzySearch, "fuzzy-search-result")
			expect(results[0].getDOMNode().textContent).toBe("Tiffany Morton")
			done();
		}, 300)
	})

	it("excludes results that are poor matches", function(done){
		var fuzzySearch = TestUtils.renderIntoDocument(createComponent());
		var inp = TestUtils.findRenderedDOMComponentWithClass(fuzzySearch, "fuzzy-inp")

		TestUtils.Simulate.focus(inp)
        TestUtils.Simulate.change(inp, { target: { value: "doreen levine"}})

        setTimeout(function(){
			var results = TestUtils.scryRenderedDOMComponentsWithClass(fuzzySearch, "fuzzy-search-result")
			expect(results.some(n => n.getDOMNode().textContent == "Dong Schwartz")).toBe(false)
			done();
		}, 300)
	})

	afterEach(function(done){
        var React = require("react/addons");
        React.unmountComponentAtNode(document.body);
        document.body.innerHTML == "";
        setTimeout(done);
    })
})