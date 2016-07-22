'use strict';

var _isObject2 = require('lodash/isObject');

var _isObject3 = _interopRequireDefault(_isObject2);

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _staticSiteGeneratorWebpackPlugin = require('static-site-generator-webpack-plugin');

var _staticSiteGeneratorWebpackPlugin2 = _interopRequireDefault(_staticSiteGeneratorWebpackPlugin);

var _extractTextWebpackPlugin = require('extract-text-webpack-plugin');

var _extractTextWebpackPlugin2 = _interopRequireDefault(_extractTextWebpackPlugin);

var _webpackConfigurator = require('webpack-configurator');

var _webpackConfigurator2 = _interopRequireDefault(_webpackConfigurator);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _babelConfig = require('./babel-config');

var _babelConfig2 = _interopRequireDefault(_babelConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('gatsby:webpack-config');


var modifyWebpackConfig = void 0;
try {
  var gatsbyNodeConfig = _path2.default.resolve(process.cwd(), './gatsby-node');
  debug('node config', gatsbyNodeConfig);

  var nodeConfig = require(gatsbyNodeConfig);

  debug('node config', JSON.stringify(nodeConfig));

  modifyWebpackConfig = nodeConfig.modifyWebpackConfig;
} catch (e) {
  debug(e.toString());
  if (e.code !== 'MODULE_NOT_FOUND' && !(0, _includes3.default)(e.Error, 'gatsby-node')) {
    console.log(e);
  }
}

// Five stages or modes:
//   1) develop: for `gatsby develop` command, hot reload and CSS injection into page
//   2) develop-html: same as develop without react-hmre in the babel config for html renderer
//   3) build-css: build styles.css file
//   4) build-html: build all HTML files
//   5) build-javascript: Build bundle.js for Single Page App in production

module.exports = function (program, directory, suppliedStage) {
  var webpackPort = arguments.length <= 3 || arguments[3] === undefined ? 1500 : arguments[3];
  var routes = arguments.length <= 4 || arguments[4] === undefined ? [] : arguments[4];

  var babelStage = suppliedStage;
  var stage = suppliedStage === 'develop-html' ? 'develop' : suppliedStage;

  debug('Loading webpack config for stage "' + stage + '"');
  function output() {
    switch (stage) {
      case 'develop':
        return {
          path: directory,
          filename: 'bundle.js',
          publicPath: 'http://' + program.host + ':' + webpackPort + '/'
        };
      case 'build-css':
        // Webpack will always generate a resultant javascript file.
        // But we don't want it for this step. Deleted by build-css.js.
        return {
          path: directory + '/public',
          filename: 'bundle-for-css.js',
          publicPath: '/'
        };
      case 'build-html':
        // A temp file required by static-site-generator-plugin. See plugins() below.
        // Deleted by build-html.js, since it's not needed for production.
        return {
          path: directory + '/public',
          filename: 'render-page.js',
          libraryTarget: 'umd'
        };
      case 'build-javascript':
        return {
          filename: 'bundle.js',
          path: directory + '/public'
        };
      default:
        throw new Error('The state requested ' + stage + ' doesn\'t exist.');
    }
  }

  function entry() {
    switch (stage) {
      case 'develop':
        return [require.resolve('webpack-hot-middleware/client'), __dirname + '/web-entry'];
      case 'build-css':
        return {
          main: __dirname + '/web-entry'
        };
      case 'build-html':
        return {
          main: __dirname + '/static-entry'
        };
      case 'build-javascript':
        return [__dirname + '/web-entry'];
      default:
        throw new Error('The state requested ' + stage + ' doesn\'t exist.');
    }
  }

  function plugins() {
    switch (stage) {
      case 'develop':
        return [new _webpack2.default.optimize.OccurenceOrderPlugin(), new _webpack2.default.HotModuleReplacementPlugin(), new _webpack2.default.NoErrorsPlugin(), new _webpack2.default.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV ? process.env.NODE_ENV : 'development')
          },
          __PREFIX_LINKS__: program.prefixLinks
        })];
      case 'build-css':
        return [new _webpack2.default.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV ? process.env.NODE_ENV : 'production')
          },
          __PREFIX_LINKS__: program.prefixLinks
        }), new _extractTextWebpackPlugin2.default('styles.css')];
      case 'build-html':
        return [new _staticSiteGeneratorWebpackPlugin2.default('render-page.js', routes), new _webpack2.default.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV ? process.env.NODE_ENV : 'production')
          },
          __PREFIX_LINKS__: program.prefixLinks
        }), new _extractTextWebpackPlugin2.default('styles.css')];
      case 'build-javascript':
        return [
        // Moment.js includes 100s of KBs of extra localization data
        // by default in Webpack that most sites don't want.
        // This line disables that.
        new _webpack2.default.IgnorePlugin(/^\.\/locale$/, /moment$/), new _webpack2.default.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV ? process.env.NODE_ENV : 'production')
          },
          __PREFIX_LINKS__: program.prefixLinks
        }), new _extractTextWebpackPlugin2.default('styles.css'), new _webpack2.default.optimize.DedupePlugin(), new _webpack2.default.optimize.UglifyJsPlugin()];
      default:
        throw new Error('The state requested ' + stage + ' doesn\'t exist.');
    }
  }

  function resolve() {
    return {
      extensions: ['', '.js', '.jsx', '.cjsx', '.coffee', '.json', '.less', '.css', '.scss', '.sass', '.toml', '.yaml'],
      root: [directory, _path2.default.resolve(__dirname, '..', 'isomorphic')],
      modulesDirectories: [directory + '/node_modules', 'node_modules']
    };
  }

  function devtool() {
    switch (stage) {
      case 'develop':
        return 'eval';
      case 'build-html':
        return false;
      case 'build-javascript':
        return 'source-map';
      default:
        return false;
    }
  }

  function module(config) {
    // Common config for every env.
    config.loader('cjsx', {
      test: /\.cjsx$/,
      loaders: ['coffee', 'cjsx']
    });
    config.loader('js', {
      test: /\.jsx?$/, // Accept either .js or .jsx files.
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: (0, _babelConfig2.default)(program, babelStage)
    });
    config.loader('coffee', {
      test: /\.coffee$/,
      loader: 'coffee'
    });
    config.loader('md', {
      test: /\.md$/,
      loader: 'markdown'
    });
    config.loader('html', {
      test: /\.html$/,
      loader: 'html'
    });
    config.loader('json', {
      test: /\.json$/,
      loaders: ['json']
    });
    // Match everything except config.toml.
    config.loader('toml', {
      test: /^((?!config).)*\.toml$/,
      loaders: ['toml']
    });
    config.loader('yaml', {
      test: /\.yaml/,
      loaders: ['yaml']
    });
    config.loader('config', {
      test: /config\.toml/,
      loader: 'config',
      query: {
        directory: directory
      }
    });
    // Image loaders.
    config.loader('images', {
      test: /\.(jpe?g|png|gif|svg)$/i,
      loaders: ['url-loader?limit=10000', 'image-webpack-loader?{progressive:true, optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}}']
    });
    // Font loaders.
    config.loader('woff', {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=10000&minetype=application/font-woff'
    });
    config.loader('ttf', {
      test: /\.(ttf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file-loader'
    });
    config.loader('eot', {
      test: /\.(eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file-loader'
    });

    var cssModulesConf = 'css?modules&minimize&importLoaders=1';
    var cssModulesConfDev = cssModulesConf + '&sourceMap&localIdentName=[name]---[local]---[hash:base64:5]';

    switch (stage) {
      case 'develop':

        config.loader('css', {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          loaders: ['style', 'css', 'postcss']
        });
        config.loader('less', {
          test: /\.less/,
          exclude: /\.module\.less$/,
          loaders: ['style', 'css', 'less']
        });
        config.loader('sass', {
          test: /\.(sass|scss)/,
          exclude: /\.module\.(sass|scss)$/,
          loaders: ['style', 'css', 'sass']
        });

        // CSS modules
        config.loader('cssModules', {
          test: /\.module\.css$/,
          loaders: ['style', cssModulesConfDev, 'postcss']
        });
        config.loader('lessModules', {
          test: /\.module\.less/,
          loaders: ['style', cssModulesConfDev, 'less']
        });
        config.loader('sassModules', {
          test: /\.module\.(sass|scss)/,
          loaders: ['style', cssModulesConfDev, 'sass']
        });

        config.merge({
          postcss: [require('postcss-import')(), require('postcss-cssnext')({ browsers: 'last 2 versions' }), require('postcss-browser-reporter'), require('postcss-reporter')]
        });
        return config;

      case 'build-css':
        config.loader('css', {
          test: /\.css$/,
          loader: _extractTextWebpackPlugin2.default.extract(['css?minimize', 'postcss']),
          exclude: /\.module\.css$/
        });
        config.loader('less', {
          test: /\.less/,
          exclude: /\.module\.less$/,
          loader: _extractTextWebpackPlugin2.default.extract(['css?minimize', 'less'])
        });
        config.loader('sass', {
          test: /\.(sass|scss)/,
          exclude: /\.module\.(sass|scss)$/,
          loader: _extractTextWebpackPlugin2.default.extract(['css?minimize', 'sass'])
        });

        // CSS modules
        config.loader('cssModules', {
          test: /\.module\.css$/,
          loader: _extractTextWebpackPlugin2.default.extract('style', [cssModulesConf, 'postcss'])
        });
        config.loader('lessModules', {
          test: /\.module\.less/,
          loader: _extractTextWebpackPlugin2.default.extract('style', [cssModulesConf, 'less'])
        });
        config.loader('sassModules', {
          test: /\.module\.(sass|scss)/,
          loader: _extractTextWebpackPlugin2.default.extract('style', [cssModulesConf, 'sass'])
        });
        config.merge({
          postcss: [require('postcss-import')(), require('postcss-cssnext')({
            browsers: 'last 2 versions'
          })]
        });
        return config;

      case 'build-html':
        // We don't deal with CSS at all when building the HTML.
        // The 'null' loader is used to prevent 'module not found' errors.
        // On the other hand CSS modules loaders are necessary.

        config.loader('css', {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          loader: 'null'
        });
        config.loader('less', {
          test: /\.less/,
          exclude: /\.module\.less$/,
          loader: 'null'
        });
        config.loader('sass', {
          test: /\.(sass|scss)/,
          exclude: /\.module\.(sass|scss)$/,
          loader: 'null'
        });

        // CSS modules
        config.loader('cssModules', {
          test: /\.module\.css$/,
          loader: _extractTextWebpackPlugin2.default.extract('style', [cssModulesConf, 'postcss'])
        });
        config.loader('lessModules', {
          test: /\.module\.less/,
          loader: _extractTextWebpackPlugin2.default.extract('style', [cssModulesConf, 'less'])
        });
        config.loader('sassModules', {
          test: /\.module\.(sass|scss)/,
          loader: _extractTextWebpackPlugin2.default.extract('style', [cssModulesConf, 'sass'])
        });
        return config;

      case 'build-javascript':
        // We don't deal with CSS at all when building the javascript.
        // The 'null' loader is used to prevent 'module not found' errors.
        // On the other hand CSS modules loaders are necessary.

        config.loader('css', {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          loader: 'null'
        });
        config.loader('less', {
          test: /\.less/,
          exclude: /\.module\.less$/,
          loader: 'null'
        });
        config.loader('sass', {
          test: /\.(sass|scss)/,
          exclude: /\.module\.(sass|scss)$/,
          loader: 'null'
        });

        // CSS modules
        config.loader('cssModules', {
          test: /\.module\.css$/,
          loader: _extractTextWebpackPlugin2.default.extract('style', [cssModulesConf, 'postcss'])
        });
        config.loader('lessModules', {
          test: /\.module\.less/,
          loader: _extractTextWebpackPlugin2.default.extract('style', [cssModulesConf, 'less'])
        });
        config.loader('sassModules', {
          test: /\.module\.(sass|scss)/,
          loader: _extractTextWebpackPlugin2.default.extract('style', [cssModulesConf, 'sass'])
        });
        return config;

      default:
        return config;
    }
  }

  var config = new _webpackConfigurator2.default();

  config.merge({
    context: directory + '/pages',
    node: {
      __filename: true
    },
    entry: entry(),
    debug: true,
    devtool: devtool(),
    output: output(),
    resolveLoader: {
      root: [_path2.default.resolve(directory, 'loaders'), _path2.default.resolve(__dirname, '..', 'loaders')],
      modulesDirectories: ['node_modules']
    },
    plugins: plugins(),
    resolve: resolve()
  });

  debug('do we have webpack config');

  if (modifyWebpackConfig) {
    debug('load webpack config');

    var modifiedWebpackConfig = modifyWebpackConfig(module(config), stage);
    (0, _invariant2.default)((0, _isObject3.default)(modifiedWebpackConfig), '\n              You must return an object when modifying the Webpack config.\n              Returned: ' + modifiedWebpackConfig + '\n              stage: ' + stage + '\n              ');
    return modifiedWebpackConfig;
  } else {
    return module(config);
  }
};