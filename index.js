
//var config = require('./../../config');
var Router = require('koa-router');
var serve = require('koa-static');
var validator = require('validator');

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

lite.get('/', function *(next) {
  var t = new Torrents();
  var torrents = yield t.getByPage(1);
  var uploader_ids = [];
  var team_ids = [];

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

  this.body = yield render('index', {
    scope: this,
    pageTitle: '首页',
    torrents: torrents,
    recentbangumis: rblist
  });
});

lite.get('/bangumi/list', function *(next) {
  var b = new Bangumis();
  var bangumis = yield b.getCurrent();
  var cblist = liteutil.getBangumiList(bangumis);

  this.body = yield render('bangumi-list', {
    scope: this,
    pageTitle: '番组列表',
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

  var pageTitle = torrent.title + ' - 种子';

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

  this.body = yield render('torrent', {
    scope: this,
    pageTitle: pageTitle,
    torrent: torrent
  });
});

lite.get('/search', function *(next) {
  // TODO: search page
  this.body = '';
});

// static files
//lite.use(serve(__dirname + '/public/lite'));

module.exports = lite;
