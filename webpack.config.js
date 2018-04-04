const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const StyleLintPlugin = require('stylelint-webpack-plugin')
const merge = require('webpack-merge')

const mockHandler = require('./mockHandler')

const dev = process.env.NODE_ENV === 'development'
console.log(dev ? '开发模式' : '生产模式')

/**
 * 入口 根据实际情况修改
 */
const entry = {
  polyfill: './src/js/polyfill.js',
  index: './src/js/index.js',
  about: './src/js/about.js'
}

/**
 * 页面 根据实际情况修改
 */
const pages = [
  new HtmlWebpackPlugin({
    template: 'src/index.html',
    chunks: ['runtime', 'vendor', 'polyfill', 'commons', 'index']
  }),
  new HtmlWebpackPlugin({
    filename: 'about.html',
    template: 'src/about.html',
    chunks: ['runtime', 'vendor', 'polyfill', 'commons', 'about']
  })
]

const baseConf = {
  entry,
  output: {
    filename: dev ? 'js/[name].js' : 'js/[name]-[contenthash:8].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'eslint-loader',
            options: {
              formatter: require('eslint-friendly-formatter')
            }
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: dev ? '[name].[ext]' : '[name]-[hash:8].[ext]',
              outputPath: 'img/'
            }
          }
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: dev ? '[name].[ext]' : '[name]-[hash:8].[ext]',
              outputPath: 'font/'
            }
          }
        ]
      },
      {
        test: /\.html$/,
        use: [{
          loader: 'html-loader'
        }]
      }
    ]
  },
  plugins: [
    ...pages,
    new StyleLintPlugin({
      files: 'src/**/*.css'
    })
  ]
}

const devConf = {
  mode: 'development',
  devtool: 'inline-cheap-module-source-map',
  devServer: {
    contentBase: './dist',
    clientLogLevel: 'error',
    stats: 'errors-only',
    hot: true,
    before: mockHandler
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              minimize: false,
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
}

const prodConf = {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: false,
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      }),
      new OptimizeCSSAssetsPlugin({})
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        default: false,
        commons: {
          name: 'commons',
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0
        },
        vendor: {
          // test: /[\\/]node_modules[\\/]/,
          test: /node_modules/,
          name: 'vendor',
          priority: 10,
          enforce: true
        }
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              // minimize: true,
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.HashedModuleIdsPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name]-[contenthash:8].css'
      // chunkFilename: 'css/[id]_[contenthash:8].css'
    }),
    new ManifestPlugin({
      filter (file) {
        return !((/\.map$/.test(file.name)) || (/\.html$/.test(file.name)))
      },
      map (file) {
        if (/\.js$/.test(file.name)) {
          file.name = `js/${file.name}`
        } else if (/\.css$/.test(file.name)) {
          file.name = `css/${file.name}`
        }
        return file
      }
    })
  ]
}

const config = dev ? merge(baseConf, devConf) : merge(baseConf, prodConf)

module.exports = config
