
function arrtomap(arr) {
  var m = {};
  arr.forEach(function (a) {
    m[a._id.toString()] = a;
  });
  return m;
}

function torrenticon(torrent) {
  var icon;
  if (torrent.team && torrent.team.icon) {
    icon = '/' + torrent.team.icon;
  } else if (torrent.uploader) {
    icon = '/avatar/' + torrent.uploader.emailHash;
  }
  return icon;
}

function getShowList(rbs) {
  var weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var showList = [];
  var aDays = [];
  var tempList = {};
  var avdays = {};
  var theFirstDay = 0;
  rbs.forEach(function (rb) {
      if (tempList[rb.showOn]) {
          tempList[rb.showOn].push(rb);
      } else {
          tempList[rb.showOn] = [rb];
      }
      avdays[rb.showOn] = true;
  });
  //find the first day
  var maxCount = 0;
  for (var i = 0; i < weekDays.length; i++) {
      var count = 0;
      for (var j = i; j < i + 4; j++) {
          var k = j % weekDays.length;
          if (avdays[k]) {
              count++;
          }
      }
      if (count > maxCount) {
          maxCount = count;
          theFirstDay = i;
      }
  }
  for (var j = theFirstDay; j < theFirstDay + 4; j++) {
      var k = j % weekDays.length;
      aDays.push(weekDays[k]);
      showList.push(tempList[k]);
  }

  return {
    availableDays: aDays,
    showList: showList
  };
}

function getBangumiList(bs) {
  var weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var bangumis = [];
  var tag_ids = [];

  for (var i = 0; i < bs.length; i++) {
      tag_ids.push(bs[i].tag_id);
      if (bangumis[bs[i].showOn]) {
          bangumis[bs[i].showOn].push(bs[i]);
      } else {
          bangumis[bs[i].showOn] = [bs[i]];
      }
  }
  
  return {
    weekDays: weekDays,
    bangumiList: bangumis
  };
}

exports.arrtomap = arrtomap;
exports.torrenticon = torrenticon;

/* Bangumis */
exports.getShowList = getShowList;
exports.getBangumiList = getBangumiList;