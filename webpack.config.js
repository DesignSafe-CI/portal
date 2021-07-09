const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env) => {
    const sourceMap = env.production ? 'source-map' : 'eval-cheap-module-source-map';
    return {
        mode: process.env.NODE_ENV,
        devtool: sourceMap,
        entry: {
            rapid: './designsafe/static/scripts/rapid/index.js',
            geo: './designsafe/static/scripts/geo/index.js',
            base: './designsafe/static/scripts/ng-designsafe/ng-designsafe.js',
            dd: './designsafe/static/scripts/data-depot/index.js',
            workspace: './designsafe/static/scripts/workspace/app.js',
            search: './designsafe/static/scripts/search/index.js',
            dashboard: './designsafe/static/scripts/dashboard/index.js',
            applications: './designsafe/static/scripts/applications/app.js',
            notifications: './designsafe/static/scripts/notifications/app.js',
            nco: './designsafe/static/scripts/nco/app.js',
        },
        output: {
            publicPath: '/static/build/',
            path: `${__dirname}/designsafe/static/build/`,
            filename: '[name].bundle.js',
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['angularjs-annotate'],
                    },
                },
                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'html-loader',
                        },
                    ],
                },
                {
                    test: /\.(ttf|woff|eot|svg|png|jpg)(\?[\s\S]+)?$/,
                    loader: 'file-loader',
                },
                {
                    test: /\.(s?)css$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: true,
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                                sassOptions: {
                                    includePaths: ['./designsafe/static/styles'],
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.coffee$/,
                    use: [
                        {
                            loader: 'coffee-loader',
                        },
                    ],
                },
            ],
        },
        resolve: {
            extensions: ['.js'],
            modules: ['node_modules'],
        },
        plugins: [
            new webpack.ProgressPlugin(),
            new CleanWebpackPlugin(),
            new MiniCssExtractPlugin({
                filename: '[name].bundle.css',
                chunkFilename: '[id].css',
            }),
            new webpack.ProvidePlugin({
                jQuery: 'jquery',
                $: 'jquery',
                jquery: 'jquery',
                d3: 'd3',
            }),
        ],
        externals: {
            jQuery: 'jQuery',
            $: 'jQuery',
            jquery: 'jQuery',
            Modernizr: 'Modernizr',
            angular: 'angular',
            moment: 'moment',
            _: '_',
            window: 'window',
            d3plus: 'd3plus',
        },
    };
};
