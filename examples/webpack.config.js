var path = require("path")
var webpack = require("webpack")

var config = {
  entry: './examples/app.js',
  output: {
    filename: 'examples/main.js',
    publicPath: ""
  },
  module: {
    loaders: [
      { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
    ]
  },
  plugins: [ ]
};

if(process.env.NODE_ENV === 'production') {
    config.plugins = config.plugins.concat([
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.OccurenceOrderPlugin()
    ]);
}
else {
    config.devtool = 'eval';
    config.debug = true;
}

module.exports = config;
