'use strict';

/*  weak */
var logger = require('tracer').colorConsole();

var initStarter = require('./init-starter');

module.exports = function (rootPath) {
  var starter = arguments.length <= 1 || arguments[1] === undefined ? 'gh:gatsbyjs/gatsby-starter-default' : arguments[1];

  initStarter(starter, {
    rootPath: rootPath,
    logger: logger
  }, function (error) {
    if (error) {
      logger.error(error);
    }
  });
};