'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _startsWith2 = require('lodash/startsWith');

var _startsWith3 = _interopRequireDefault(_startsWith2);

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

exports.default = pathResolver;

var _path = require('path');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  weak */
var rewritePath = void 0;
try {
  var gatsbyNodeConfig = _path.posix.resolve(process.cwd(), './gatsby-node');
  // $FlowIssue - https://github.com/facebook/flow/issues/1975
  var nodeConfig = require(gatsbyNodeConfig);
  rewritePath = nodeConfig.rewritePath;
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND' && !(0, _includes3.default)(e.Error, 'gatsby-node')) {
    console.log(e);
  }
}

function pathResolver(pageData, parsedPath) {
  /**
   * Determines if a hardcoded path was given in the frontmatter of a page.
   */
  function hardcodedPath() {
    if (pageData.path) {
      var pathInvariantMessage = '\n      Hardcoded paths are relative to the website root so must be prepended with a\n      forward slash. You set the path to "' + pageData.path + '" in "' + parsedPath.path + '"\n      but it should be "/' + pageData.path + '"\n\n      See http://bit.ly/1qeNpdy for more.\n      ';
      (0, _invariant2.default)(pageData.path.charAt(0) === '/', pathInvariantMessage);
    }

    return pageData.path;
  }

  /**
   * Determines if the path should be rewritten using rules provided by the
   * user in the gatsby-node.js config file in the root of the project.
   */
  function rewrittenPath() {
    if (rewritePath) {
      return rewritePath(parsedPath, pageData);
    } else {
      return undefined;
    }
  }

  /**
   * Determines the path of the page using the default of its location on the
   * filesystem.
   */
  function defaultPath() {
    var dirname = parsedPath.dirname;
    var name = parsedPath.name;

    if (name === 'template' || name === 'index') {
      name = '';
    }
    return _path.posix.join('/', dirname, name, '/');
  }

  /**
   * Returns a path for a page. If the page name starts with an underscore,
   * undefined is returned as it does not become a page.
   */
  if (!(0, _startsWith3.default)(parsedPath.name, '_')) {
    return hardcodedPath() || rewrittenPath() || defaultPath();
  } else {
    return undefined;
  }
}