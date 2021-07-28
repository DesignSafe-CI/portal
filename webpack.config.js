const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

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
            filename: '[name].bundle.[hash].js',
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
                filename: '[name].bundle.[hash].css',
                chunkFilename: '[id].css',
            }),
            new HtmlWebpackPlugin(
                {
                    chunks: ['rapid'],
                    inject : false,
                    template : './designsafe/apps/rapid/templates/designsafe/apps/rapid/rapid_base.j2',
                    filename: '../../apps/rapid/templates/designsafe/apps/rapid/rapid_base.html',
                    minify: false,
                }
            ),
            new HtmlWebpackPlugin(
                {
                    chunks: ['geo'],
                    inject : false,
                    template : './designsafe/apps/geo/templates/designsafe/apps/geo/index.j2',
                    filename: '../../apps/geo/templates/designsafe/apps/geo/index.html',
                    minify: false,
                }
            ),
            new HtmlWebpackPlugin(
                {
                    chunks: ['base'],
                    inject : false,
                    template : './designsafe/templates/base.j2',
                    filename: '../../templates/base.html',
                    minify: false,
                }
            ),
            new HtmlWebpackPlugin(
                {
                    chunks: ['dd'],
                    inject : false,
                    template : './designsafe/apps/data/templates/data/data_depot.j2',
                    filename: '../../apps/data/templates/data/data_depot.html',
                    minify: false,
                }
            ),
            new HtmlWebpackPlugin(
                {
                    chunks: ['workspace'],
                    inject : false,
                    template : './designsafe/apps/workspace/templates/designsafe/apps/workspace/index.j2',
                    filename: '../../apps/workspace/templates/designsafe/apps/workspace/index.html',
                    minify: false,
                }
            ),
            new HtmlWebpackPlugin(
                {
                    chunks: ['search'],
                    inject : false,
                    template : './designsafe/apps/search/templates/designsafe/apps/search/index.j2',
                    filename: '../../apps/search/templates/designsafe/apps/search/index.html',
                    minify: false,
                }
            ),
            new HtmlWebpackPlugin(
                {
                    chunks: ['dashboard'],
                    inject : false,
                    template : './designsafe/apps/dashboard/templates/designsafe/apps/dashboard/index.j2',
                    filename: '../../apps/dashboard/templates/designsafe/apps/dashboard/index.html',
                    minify: false,
                }
            ),
            new HtmlWebpackPlugin(
                {
                    chunks: ['applications'],
                    inject : false,
                    template : './designsafe/apps/applications/templates/designsafe/apps/applications/index.j2',
                    filename: '../../apps/applications/templates/designsafe/apps/applications/index.html',
                    minify: false,
                }
            ),
            new HtmlWebpackPlugin(
                {
                    chunks: ['notifications'],
                    inject : false,
                    template : './designsafe/apps/notifications/templates/designsafe/apps/notifications/index.j2',
                    filename: '../../apps/notifications/templates/designsafe/apps/notifications/index.html',
                    minify: false,
                }
            ),
            new HtmlWebpackPlugin(
                {
                    chunks: ['nco'],
                    inject : false,
                    template : './designsafe/apps/nco/templates/designsafe/apps/nco/nco_index.j2',
                    filename: '../../apps/nco/templates/designsafe/apps/nco/nco_index.html',
                    minify: false,
                }
            ),
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
