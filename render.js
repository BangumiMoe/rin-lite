
var path = require('path');

var fs = require('co-fs');
var ejs = require('ejs');

var cache = {};
var settings = {
  root: path.join(__dirname, 'templates/'),
  viewExt: '.html',
  cache: true,
  debug: false,
  open: '<%',
  close: '%>',
};

function *render(view, options) {
  view += settings.viewExt;
  var viewPath = path.join(settings.root, view);
  // get from cache
  if (settings.cache && cache[viewPath]) {
    return cache[viewPath].call(options.scope, options);
  }

  var tpl = yield fs.readFile(viewPath, 'utf8');
  var fn = ejs.compile(tpl, {
    filename: viewPath,
    _with: settings._with,
    compileDebug: settings.debug,
    open: settings.open,
    close: settings.close
  });
  if (settings.cache) {
    cache[viewPath] = fn;
  }

  return fn.call(options.scope, options);
}

module.exports = render;