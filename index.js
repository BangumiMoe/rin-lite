
var config = require('./../../config');
var Router = require('koa-router');
var serve = require('koa-static');
var validator = require('validator');
var _ = require('underscore');

var ejs = require('ejs');
var render = require('./render');
var liteutil = require('./util');

var Models = require('./../../models'),
  Teams = Models.Teams,
  Users = Models.Users,
  Tags = Models.Tags,
  RssCollections = Models.RssCollections,
  Torrents = Models.Torrents,
  Bangumis = Models.Bangumis;

var lite = new Router();
var i18n_data = {};

//pre load langs
function preload_langs() {
  var langs = config['app'].langs;
  //var def_lang = config['app'].def_lang;

  for (var i = 0; i < langs.length; i++) {
    i18n_data[langs[i]] = require('./../../public/i18n/' + langs[i] + '.json');
  }

  ejs.filters.tagname = function (tag, lang) {
    if (!tag) {
      return '';
    }
    if (tag.locale && tag.locale[lang]) {
      return tag.locale[lang];
    } else {
      return tag.name;
    }
  };

  ejs.filters.translate = function (str, locale) {
    var d = i18n_data[locale];
    if (d) {
      var s = i18n_data[locale];
      if (s && s[str]) {
        return s[str];
      }
    }
    return str;
  };
}

preload_langs();

lite.use(function *(next) {
  var that = this;
  var locale = this.locale;
  var i18n = i18n_data[locale];

  this.___ = function (str) {
    var s = i18n[str];
    return s ? s : str;
  };

  this.render = function *(view, opts) {
    opts = _.extend(opts, {
      scope: that,
      locale: locale
    });

    return yield render(view, opts);
  };

  yield next;

});

lite.get('/', function *(next) {
  var t = new Torrents();
  var uploader_ids = [];
  var team_ids = [];
  var p = 1;
  if (this.query && this.query.p) {
    p = parseInt(this.query.p);
    if (!p || p <= 0) p = 1;
  }
  var torrents = yield t.getByPage(p);

  torrents.forEach(function (torrent) {
    if (torrent.uploader_id && uploader_ids.indexOf(torrent.uploader_id.toString()) < 0) {
      uploader_ids.push(torrent.uploader_id.toString());
    }
    if (torrent.team_id && team_ids.indexOf(torrent.team_id.toString()) < 0) {
      team_ids.push(torrent.team_id.toString());
    }
  });

  var uploaders = yield new Users().find(uploader_ids);
  uploaders = Users.filter(uploaders);
  var teams = yield new Teams().find(team_ids);

  var muploaders = liteutil.arrtomap(uploaders);
  var mteams = liteutil.arrtomap(teams);

  torrents.forEach(function (torrent) {
    if (torrent.uploader_id) {
      var suid = torrent.uploader_id.toString();
      if (muploaders[suid]) {
        torrent.uploader = muploaders[suid];
      }
    }
    if (torrent.team_id) {
      var stid = torrent.team_id.toString();
      if (mteams[stid]) {
        torrent.team = mteams[stid];
      }
    }

    torrent.icon = liteutil.torrenticon(torrent);
  });


  /* Bangumis */
  var b = new Bangumis();
  var bangumis = yield b.getRecent();
  var rblist = liteutil.getShowList(bangumis);

  this.body = yield this.render('index', {
    pageTitle: this.___('Index'),
    torrents: torrents,
    p: p,
    recentbangumis: rblist
  });
});

lite.get('/bangumi/list', function *(next) {
  var b = new Bangumis();
  var bangumis = yield b.getCurrent();
  var cblist = liteutil.getBangumiList(bangumis);

  this.body = yield this.render('bangumi-list', {
    pageTitle: this.___('Bangumi List'),
    currentbangumis: cblist
  });
});

lite.get('/torrent/:_id', function *(next) {
  var torrent_id = this.params._id;
  if (!torrent_id || !validator.isMongoId(torrent_id)) {
    this.status = 404;
    return;
  }

  var torrent = yield new Torrents().find(torrent_id);
  if (!torrent || !torrent._id) {
    this.status = 404;
    return;
  }

  var pageTitle = torrent.title + ' - ' + this.___('Torrent');

  if (torrent.uploader_id) {
    var user = new Users();
    yield user.find(torrent.uploader_id);
    torrent.uploader = user.expose();
  }

  if (torrent.team_id) {
    var team = new Teams();
    torrent.team = yield team.find(torrent.team_id);
  }

  torrent.icon = liteutil.torrenticon(torrent);

  //tags
  if (torrent.tag_ids) {
    var tag_ids = [];
    torrent.tag_ids.forEach(function (tag_id) {
      tag_ids.push(tag_id.toString());
    });
    var tags = yield new Tags().find(tag_ids);
    //var mtags = liteutil.arrtomap(tags);
    torrent.tags = tags;
  }

  this.body = yield this.render('torrent', {
    pageTitle: pageTitle,
    torrent: torrent
  });
});

lite.get('/search', function *(next) {
  // TODO: search page
  this.body = yield this.render('search', {
    pageTitle: this.___('Search'),
  });
});

// static files
//lite.use(serve(__dirname + '/public/lite'));

module.exports = lite;
