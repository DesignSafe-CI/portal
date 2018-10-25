// webpack plugins
const webpack = require('webpack');
const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    devtool: 'source-map',
    resolve: {
        extensions: ['.js'],
        modules: ['node_modules'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: ['es2015'],
                    plugins: ['angularjs-annotate'],
                },
            },
            {
                test: /\.(html)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'html-loader',
                    },
                ],
            },
            {
                test: /\.(s?)css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                                includePaths: ['./designsafe/static/styles'],
                            },
                        },
                    ],
                }),
            },
        ],
    },
    plugins: [
        new ExtractTextPlugin('./designsafe/static/styles/base.css'),
        new ngAnnotatePlugin({add: true}), // eslint-disable-line new-cap
        new LiveReloadPlugin(),
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            $: 'jquery',
            jquery: 'jquery',
        }),
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
        L: 'L',
        window: 'window',
        djng: 'djng',
    },
};
