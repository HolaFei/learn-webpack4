const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const StyleLintPlugin = require('stylelint-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const merge = require('webpack-merge')

const mockHandler = require('./mockHandler')

const chalk = require('chalk')
const log = console.log

const util = require('util')
const fs = require('fs')
const readDir = util.promisify(fs.readdir)
const stat = util.promisify(fs.stat)

module.exports = async (env, argv) => {
  if (!env || !env.proj) {
    log(`${chalk.whiteBright.bgRedBright.bold('[错误]')} 请在命令行后面加上参数 ${chalk.whiteBright.bgBlueBright('`-- --env.proj={targetDir}/{projDir}`')}`)
    log(`${chalk.whiteBright.bgGreen('例如：')} ${chalk.green('-- --env.proj=topics/my-topic-project')}`)
    process.exit(0)
  }

  const dev = process.env.NODE_ENV === 'development'
  console.log(dev ? '开发模式' : '生产模式')

  const projDirs = env.proj.split('/')
  const targetDir = projDirs[0]
  const projDir = projDirs[1]
  const outputPath = path.resolve(__dirname, targetDir, projDir)
  const entryPathBase = `./src/${projDir}`

  const entryFiles = []

  try {
    const res = await readDir(`${entryPathBase}/js`)
    for (let v of res) {
      try {
        const stats = await stat(`${entryPathBase}/js/${v}`)
        if (stats.isFile()) {
          entryFiles.push(v)
        }
      } catch (err) {
        log(err)
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      log(`${chalk.whiteBright.bgRedBright(`项目目录 ${entryPathBase}/js 不存在，请手动新建`)}`)
    } else {
      log(err)
    }
    process.exit(0)
  }

  if (entryFiles.length === 0) {
    log(chalk.redBright('缺少入口文件'))
    process.exit(0)
  }

  /**
   * 入口
   */
  const entry = {}
  entryFiles.forEach(v => {
    entry[v.substring(0, v.length - 3)] = `${entryPathBase}/js/${v}`
  })

  /**
   * 页面
   */
  const pageFiles = []
  try {
    const res = await readDir(entryPathBase)
    for (let v of res) {
      try {
        const stats = await stat(`${entryPathBase}/${v}`)
        if (stats.isFile() && /\.html$/.test(v)) {
          pageFiles.push(v)
        }
      } catch (err) {
        log(err)
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      log(`${chalk.whiteBright.bgRedBright(`项目 ${entryPathBase} 的页面不存在，请手动新建`)}`)
    } else {
      log(err)
    }
    process.exit(0)
  }

  if (pageFiles.length === 0) {
    log(chalk.redBright('缺少HTML文件'))
    process.exit(0)
  }

  const pages = []
  pageFiles.forEach(v => {
    pages.push(new HtmlWebpackPlugin({
      filename: v,
      template: `${entryPathBase}/${v}`,
      chunks: ['runtime', 'vendor', 'polyfill', 'commons', v.substring(0, v.length - 5)],
      chunksSortMode: 'manual'
    }))
  })

  const baseConf = {
    entry,
    output: {
      filename: dev ? 'js/[name].js' : 'js/[name]-[contenthash:8].js',
      path: outputPath
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
        files: '**/*.css'
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
      new CleanWebpackPlugin([env.proj]),
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

  return config
}
