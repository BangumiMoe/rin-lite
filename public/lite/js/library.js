/*Next two library require Global Var cache = {tag: new Cache('tag'), team: new Cache('team'), user: new Cache('user')}*/
var Cache = function(_type){
	var store = [], type = _type, buffer = [], hash = {};
	this.get = function(id){
		return store[id];
	};
	this.set = function(object){
		store[object.id] = object;
	};
	this.ready = function(ids){
		if(ids == null)
			return;
		if(typeof ids == 'string')
			ids = [ids];
		for(var i = 0; i < ids.length; ++i)
			if(typeof store[ids[i]] != 'undefined' || typeof hash[ids[i]] != 'undefined')
				ids.splice(i--, 1);
			else
				hash[ids[i]] = true;
		buffer = buffer.concat(ids);
	};
	this.flush = function(callback){
		if(buffer.length == 0)
			return callback();
		$.post('https://bangumi.moe/api/' + type + '/fetch', JSON.stringify({_ids: buffer}), (function(type, callback){
			return function(result){
				if(typeof result != 'undefined'){
					for(var i = 0; i < result.length; ++i){
						var object;
						switch(type){
							case 'team':
								object = new Team(result[i]);
								break;
							case 'tag':
								object = new Tag(result[i]);
								break;
							case 'user':
								object = new User(result[i]);
								break;

							default:
								object = result[i];
						}
						cache[type].set(object);
					}
				}
				return (typeof callback == 'undefined' ? undefined : callback());
			};
		})(type, callback));
		buffer = [];
		hash = {};
	};
};
var Search = function(){
	var enable = true;
	this.disable = function(){
		enable = false;
	};
	this.search = function(){
		$(torrents_container).empty();

		var tag_dom = $(tags_container + ' span');
		if(tag_dom.length == 0)
			return;

		var tag_id = [];
		for(var i = 0; i < tag_dom.length; ++i)
			tag_id.push(tag_dom[i].value);

		$.post('https://bangumi.moe/api/torrent/search', JSON.stringify({
			tag_id: tag_id
		}), function(result){
			if(enable == false || typeof result.torrents == 'undefined')
				return;

			var torrents = [];
			for(var i = 0; i < result.torrents.length; ++i)
				torrents.push(new Torrent(result.torrents[i]));
			cache.team.flush(function(){
				cache.user.flush(function(){
					for(var i = 0; i < torrents.length; ++i)
						$(torrents_container).append(torrents[i].html());
				});
			});
		});
	};
};

var User = function(object){
	this.id = object._id;
	this.name = object.username;
	this.emailHash = object.emailHash;
};
var Team = function(object){
	this.id = object._id;
	this.name = object.name;
	this.icon = object.icon;
};
/*Next library require Global Var tags_container, torrents_container, search = new Search()*/
var Tag = function(object){
	this.id = object._id;
	this.name = object.name;
	this.type = object.type;

	this.html = function(){
		return $('<span></span>').addClass('tag').attr({
			value: this.id
		}).text(this.name);
	};

	this.addKeywords = function(dom){
		return (function(dom, object){
			return function(){
				search.disable();
				if($(dom + ' span[value=' + object.id + ']').length == 0)
					$(dom).append(object.html().click(object.removeKeywords(dom)));
				var urlTags = '';
				$(dom + ' span').each(function(index){
					urlTags += (index == 0 ? '' : '+') + this.value;
				});
				history.replaceState(undefined, undefined, location.href.replace(/(.*)\/[^\/]*/, '$1/') + urlTags);
				(search = new Search()).search();
			};
		})(dom, this);
	};
	this.removeKeywords = function(dom){
		return (function(dom, object){
			return function(){
				search.disable();
				$(dom + ' span').remove('[value=' + object.id + ']');
				var urlTags = '';
				$(dom + ' span').each(function(index){
					urlTags += (index == 0 ? '' : '+') + this.value;
				});
				history.replaceState(undefined, undefined, location.href.replace(/(.*)\/[^\/]*/, '$1/') + urlTags);
				(search = new Search()).search();
			};
		})(dom, this);
	};
};
var Torrent = function(object){
	this.id = object._id;
	this.title = object.title;
	this.stat = {
		downloads: object.downloads,
		leechers: object.leechers,
		seeders: object.seeders,
		finished: object.finished
	};
	this.torrent = 'https://bangumi.moe/download/torrent/' + this.id + '/' + this.title + '.torrent';
	this.magnet = object.magnet;
	this.date = new Date(object.publish_time);
	this.team = object.team_id;
	this.tags = object.tag_ids;
	this.uploader = object.uploader_id;

	cache.team.ready(this.team);
	cache.tag.ready(this.tags);
	cache.user.ready(this.uploader);

	this.html = function(){
		return $('<li></li>').addClass('torrent-li').append($('<div></div>').addClass('torrent-left').append(
			$('<span></span>').addClass('torrent-subs').append($('<img>').attr({
				src: 'https://bangumi.moe/' + (this.team == null || cache.team.get(this.team).icon == null ? 'avatar/' + cache.user.get(this.uploader).emailHash : cache.team.get(this.team).icon)
		}))).append(
			$('<span></span>').addClass('torrent-download-link').append($('<a></a>').attr({
				href: this.torrent
			}).append($('<img>').attr({
				src: './img/download.gif'
		}))))).append($('<div></div>').addClass('torrent-right').append(
			$('<h3></h3>').addClass('torrent-title').text(this.title)).append(
			$('<span></span>').addClass('torrent-publisher').text('發佈者:').append($('<span></span>').addClass('sub-group-name').text(cache.user.get(this.uploader).name))).append(
			$('<span></span>').addClass('published').text('發佈於').append($('<span></span>').addClass('post-time').text(this.date.toString())))).hover(function(){
			$(this).addClass('hover');
		}, function(){
			$(this).removeClass('hover');
		});
	};
};
