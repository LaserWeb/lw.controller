var webpack = require('webpack');
var path = require('path');

var src_path = path.resolve('./src');
var dist_path = path.resolve('./dist');

module.exports = {
    context: src_path,
    entry: [
        'webpack-dev-server/client?http://0.0.0.0:8081', 'webpack/hot/only-dev-server', 'babel-polyfill', './standalone/index.js',
        'file-loader?name=index.html!./standalone/index.html',
        'file-loader?name=everything.svg!./pages/everything.svg',
        'file-loader?name=everything.css!./pages/everything.css',
        'file-loader?name=svg-script.js!./pages/svg-script.js',
    ],
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
            {
                test: /.*font.*\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader?limit=10000&mimetype=application/font-woff"
            },
            {
                test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
            },
            {
                test: /.*font.*\.svg(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
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
        port: 8081,
        host: 'localhost'
    },
    devtool: 'source-map'
};
