'use strict';

var _hapi = require('hapi');

var _hapi2 = _interopRequireDefault(_hapi);

var _opn = require('opn');

var _opn2 = _interopRequireDefault(_opn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  weak */
var debug = require('debug')('gatsby:application');

module.exports = function (program) {
  var directory = program.directory;

  debug('Serving /public');

  // Setup and start Hapi to static files.

  var server = new _hapi2.default.Server();

  server.connection({
    host: program.host,
    port: program.port
  });

  server.route({
    method: 'GET',
    path: '/{path*}',
    handler: {
      directory: {
        path: directory + '/public',
        listing: false,
        index: true
      }
    }
  });

  server.start(function (e) {
    if (e) {
      if (e.code === 'EADDRINUSE') {
        var finder = require('process-finder');
        finder.find({ elevate: false, port: program.port }, function (startErr, pids) {
          var msg = 'We were unable to start Gatsby on port ' + program.port + ' as there\'s already a process\nlistening on that port (PID: ' + pids[0] + '). You can either use a different port\n(e.g. gatsby serve-build --port ' + (parseInt(program.port, 10) + 1) + ') or stop the process\nalready listening on your desired port.';
          console.log(msg);
          process.exit();
        });
      } else {
        console.log(e);
      }
    } else {
      if (program.open) {
        (0, _opn2.default)(server.info.uri);
      }
      console.log('Listening at:', server.info.uri);
    }
  });
};