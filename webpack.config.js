var webpack = require('webpack');
var path = require('path');

var src_path = path.resolve('./src');
var dist_path = path.resolve('./dist');

module.exports = {
    context: src_path,
    entry: [
        'webpack-dev-server/client?http://0.0.0.0:8080', 'webpack/hot/only-dev-server', 'babel-polyfill', './standalone/index.js',
        'file-loader?name=index.html!./standalone/index.html',
        'file-loader?name=everything.svg!./pages/everything.svg'],
    output: {
        path: dist_path,
        filename: 'index.js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: [['react']],
                    plugins: ['transform-es2015-destructuring', 'transform-es2015-parameters', 'transform-object-rest-spread', 'transform-es2015-modules-commonjs']
                }
            },
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
    ],
    devServer: {
        contentBase: dist_path,
        inline: false,
        hot: true,
        quiet: false,
        noInfo: false,
        disableHostCheck: false,
        host: 'localhost'
    },
    devtool: 'source-map'
};
