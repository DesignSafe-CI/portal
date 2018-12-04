// webpack plugins
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const webpack = require('webpack');
const path = require('path');
const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = function(env, arg) {
    var smap = false;
    env == 'prod' ? smap = false : smap='cheap-module-eval-source-map';
    return {
        devtool: smap,
        entry: {
          "rapid" : "./designsafe/static/scripts/rapid/index.js",
          "geo" : "./designsafe/static/scripts/geo/index.js",
          "base": "./designsafe/static/scripts/ng-designsafe/ng-designsafe.js",
          "dd": "./designsafe/static/scripts/data-depot/index.js",
          "workspace": "./designsafe/static/scripts/workspace/app.js",
          "search": "./designsafe/static/scripts/search/index.js",
          "dashboard": "./designsafe/static/scripts/dashboard/index.js",
          "applications": "./designsafe/static/scripts/applications/app.js",
          "notifications": "./designsafe/static/scripts/notifications/app.js"
        },
        output: {
            publicPath: "/static/build/",
            path: __dirname + "/designsafe/static/build/",
            filename: "[name].bundle.js"
        },
        resolve: {
            extensions: ['.js'],
            modules: ['node_modules']
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015'],
                        plugins: ["angularjs-annotate"]
                    }
                },
                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'html-loader'
                    }]
                },
                {
                  test: /\.(ttf|woff|eot|svg|png|jpg)(\?[\s\S]+)?$/,
                  loader: 'file-loader'
                },
                {
                    test: /\.(s?)css$/,
                    use: ExtractTextPlugin.extract({
                        use: [{
                            loader: 'css-loader',
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                                includePaths: ["./designsafe/static/styles"]
                            }
                        }]
                    })
                },
            ]
        },
        plugins: [
            new ExtractTextPlugin("[name].bundle.css"),
            new LiveReloadPlugin(),
            new webpack.ProvidePlugin({
                jQuery: 'jquery',
                $: 'jquery',
                jquery: 'jquery'
            })
        ],
        externals: {
            jQuery: 'jQuery',
            $: 'jQuery',
            jquery: 'jQuery',
            Modernizr: 'Modernizr',
            angular: 'angular',
            d3: 'd3',
            moment: 'moment',
            _: '_',
            window: 'window',
            djng: 'djng'
        }
    };
};
