var path = require("path")
var webpack = require("webpack")

var config = {
  entry: './src/index.js',
  output: {
    filename: 'build/bundle.js',
    publicPath: "build"
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
        new webpack.optimize.UglifyJsPlugin()
    ]);
}
else {
    config.devtool = 'sourcemap';
    config.debug = true;
}

module.exports = config;
