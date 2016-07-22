'use strict';

var _find2 = require('lodash/find');

var _find3 = _interopRequireDefault(_find2);

var _hapi = require('hapi');

var _hapi2 = _interopRequireDefault(_hapi);

var _boom = require('boom');

var _boom2 = _interopRequireDefault(_boom);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _server = require('react-dom/server');

var _server2 = _interopRequireDefault(_server);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _negotiator = require('negotiator');

var _negotiator2 = _interopRequireDefault(_negotiator);

var _parseFilepath = require('parse-filepath');

var _parseFilepath2 = _interopRequireDefault(_parseFilepath);

var _webpackRequire = require('webpack-require');

var _webpackRequire2 = _interopRequireDefault(_webpackRequire);

var _hapiWebpackPlugin = require('hapi-webpack-plugin');

var _hapiWebpackPlugin2 = _interopRequireDefault(_hapiWebpackPlugin);

var _opn = require('opn');

var _opn2 = _interopRequireDefault(_opn);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _globPages = require('./glob-pages');

var _globPages2 = _interopRequireDefault(_globPages);

var _webpack3 = require('./webpack.config');

var _webpack4 = _interopRequireDefault(_webpack3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  weak */
require('node-cjsx').transform();

var debug = require('debug')('gatsby:application');

module.exports = function (program) {
  var directory = program.directory;

  // Load pages for the site.
  return (0, _globPages2.default)(directory, function (err, pages) {
    var compilerConfig = (0, _webpack4.default)(program, directory, 'develop', program.port);

    var compiler = (0, _webpack2.default)(compilerConfig.resolve());

    var HTMLPath = directory + '/html';
    // Check if we can't find an html component in root of site.
    if (_glob2.default.sync(HTMLPath + '.*').length === 0) {
      HTMLPath = '../isomorphic/html';
    }

    var htmlCompilerConfig = (0, _webpack4.default)(program, directory, 'develop-html', program.port);

    (0, _webpackRequire2.default)(htmlCompilerConfig.resolve(), require.resolve(HTMLPath), function (error, factory) {
      if (error) {
        console.log('Failed to require ' + directory + '/html.js');
        error.forEach(function (e) {
          console.log(e);
        });
        process.exit();
      }
      var HTML = factory();
      debug('Configuring develop server');

      // Setup and start Hapi to serve html + static files + webpack-hot-middleware.
      var server = new _hapi2.default.Server();
      server.connection({
        host: program.host,
        port: program.port
      });

      server.route({
        method: 'GET',
        path: '/html/{path*}',
        handler: function handler(request, reply) {
          if (request.path === 'favicon.ico') {
            return reply(_boom2.default.notFound());
          }

          try {
            var htmlElement = _react2.default.createElement(HTML, {
              body: ''
            });
            var html = _server2.default.renderToStaticMarkup(htmlElement);
            html = '<!DOCTYPE html>\n' + html;
            return reply(html);
          } catch (e) {
            console.log(e.stack);
            throw e;
          }
        }
      });

      server.route({
        method: 'GET',
        path: '/{path*}',
        handler: {
          directory: {
            path: directory + '/pages',
            listing: false,
            index: false
          }
        }
      });

      server.ext('onRequest', function (request, reply) {
        var negotiator = new _negotiator2.default(request.raw.req);

        // Try to map the url path to match an actual path of a file on disk.
        var parsed = (0, _parseFilepath2.default)(request.path);
        var page = (0, _find3.default)(pages, function (p) {
          return p.path === parsed.dirname + '/';
        });

        var absolutePath = directory + '/pages';
        var path = void 0;
        if (page) {
          path = '/' + (0, _parseFilepath2.default)(page.requirePath).dirname + '/' + parsed.basename;
          absolutePath += '/' + (0, _parseFilepath2.default)(page.requirePath).dirname + '/' + parsed.basename;
        } else {
          path = request.path;
          absolutePath += request.path;
        }
        var isFile = false;
        try {
          isFile = _fs2.default.lstatSync(absolutePath).isFile();
        } catch (e) {}
        // Ignore.


        // If the path matches a file, return that.
        if (isFile) {
          request.setUrl(path);
          reply.continue();
          // Let people load the bundle.js directly.
        } else if (request.path === '/bundle.js') {
          reply.continue();
        } else if (negotiator.mediaType() === 'text/html') {
          request.setUrl('/html' + request.path);
          reply.continue();
        } else {
          reply.continue();
        }
      });

      var assets = {
        noInfo: true,
        reload: true,
        publicPath: compilerConfig._config.output.publicPath
      };
      var hot = {
        hot: true,
        quiet: true,
        noInfo: true,
        host: program.host,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        stats: {
          colors: true
        }
      };

      server.register({
        register: _hapiWebpackPlugin2.default,
        options: {
          compiler: compiler,
          assets: assets,
          hot: hot
        }
      }, function (er) {
        if (er) {
          console.log(er);
          process.exit();
        }

        server.start(function (e) {
          if (e) {
            if (e.code === 'EADDRINUSE') {
              var finder = require('process-finder');
              finder.find({ elevate: false, port: program.port }, function (startErr, pids) {
                var msg = 'We were unable to start Gatsby on port ' + program.port + ' as there\'s already a process\nlistening on that port (PID: ' + pids[0] + '). You can either use a different port\n(e.g. gatsby develop --port ' + (parseInt(program.port, 10) + 1) + ') or stop the process already listening\non your desired port.';
                console.log(msg);
                process.exit();
              });
            } else {
              console.log(e);
              process.exit();
            }
          } else {
            if (program.open) {
              (0, _opn2.default)(server.info.uri);
            }
            console.log('Listening at:', server.info.uri);
          }
        });
      });
    });
  });
};