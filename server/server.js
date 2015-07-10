/**
*
* Server entry instance
*
**/

'use strict';


var express = require('express');

// include custom data proc components
var move = require('./move.js'),
    comm = require('./comm.js'),
    meta = require('./meta.js'),
    facility = require('./facility.js'),
    group = require('./group.js'),
    utils = require('./utils.js');

var app = express();


app.post('/vastcha15', function(req, res) {
  // get param by req.body.{param}
  var dataType = req.body.dataType,
      queryType = req.body.queryType;
  var data = {};
  if (dataType == 'move') {
  } else if (dataType == 'comm') {
  } else {
    console.error('unhandled dataType', dataType);
  }
  res.json(data);
});


app.get('/vastcha15', function(req, res) {
  // get param by req.query.{param}
  var queryType = req.query.queryType;
  var data = null;

  console.log('Query:', queryType);
  if (queryType == 'timerange_move') {
    var day = req.query.day,
        tmStart = parseInt(req.query.tmStart),
        tmEnd = parseInt(req.query.tmEnd),
        pid = req.query.pid;
    console.log({
      day: day,
      tmRange: [tmStart, tmEnd],
      pid: pid
    });
    data = move.queryPidTimeRange(day, pid, tmStart, tmEnd);
    console.log(utils.size(data) + ' move items sent');
  } else if (queryType == 'timerange_comm') {
    var day = req.query.day,
        tmStart = parseInt(req.query.tmStart),
        tmEnd = parseInt(req.query.tmEnd),
        pid = req.query.pid,
        direction = req.query.direction;
    // logging
    console.log({
      day: day,
      tmRange: [tmStart, tmEnd],
      pid: pid,
      direction: direction
    });
    data = comm.queryPidTimeRange(day, direction, pid, tmStart, tmEnd);
    console.log(utils.size(data) + ' comm items sent');
  } else if (queryType == 'timeexact') {
    var day = req.query.day,
        tmExact = parseInt(req.query.tmExact),
        pid = req.query.pid;
    // logging
    console.log({
      day: day,
      tmExact: tmExact,
      pid: pid
    });
    data = move.queryPidExactTime(day, pid, tmExact);
    console.log(utils.size(data) + ' move items sent');
  } else if (queryType == 'meta') {
    data = meta.allMeta();
  } else if (queryType == 'facility') {
    data = facility.allFacilities();
  } else if (queryType == 'faciseq') {
    var day = req.query.day,
        pid = req.query.pid;
    console.log({ day: day, pid: pid }); // logging
    data = facility.queryPidFaciSequence(day, pid);
  } else if (queryType == 'areaseq' || queryType == 'speedseq' || queryType == 'distseq') {
    var areaData = null;
    var day = req.query.day,
        pid = req.query.pid;
    console.log({ day: day, pid: pid }); // logging
    data = move.queryMoveSequence(day, pid, queryType);
  } else if (queryType == 'rangevol') {
    var day = req.query.day,
        pid = req.query.pid,
        tmStart = parseInt(req.query.tmStart),
        tmEnd = parseInt(req.query.tmEnd),
        numSeg = parseInt(req.query.numSeg),
        direction = req.query.direction;
    console.log({ day: day, pid: pid,
      tmStart: tmStart, tmEnd: tmEnd,
      direction: direction,
      numSeg: numSeg }); // logging
    if (isNaN(numSeg)) numSeg = 1;
    data = comm.queryVolumeSegmented(day, direction, pid, tmStart, tmEnd, numSeg);
  } else if (queryType == 'volseq') {
    var day = req.query.day,
        pid = req.query.pid,
        direction = req.query.direction;
    console.log({ day: day, pid: pid, direction: direction }); // logging
    data = comm.queryVolumeSequence(day, direction, pid);
  } else if (queryType == 'members') {
    var areaData = null;
    var pid = req.query.pid;
    // logging
    console.log({
      day: day,
      pid: pid
    });
    data = group.members(pid);
  } else if (queryType == 'groupinfo') {
    data = group.allGroupInfo();
  } else if (queryType == 'faciperc') {
    var day = req.query.day,
        pid = req.query.pid;
    console.log({ day: day, pid: pid }); // logging
    data = facility.getFaciTable(day, pid);
  } else if (queryType == 'facisimilar') {
    var day = req.query.day,
        pid = req.query.pid,
        cnt = req.query.cnt,
        start = req.query.start;
    console.log({ day: day, pid: pid, cnt: cnt, start: start }); // logging
    data = facility.queryPidSimilarGroups(day, pid, cnt, start);
  } else if (queryType == 'pplflow') {
    var day = req.query.day,
        fid = req.query.fid,
        tmStart = parseInt(req.query.tmStart),
        tmEnd = parseInt(req.query.tmEnd),
        numSeg = req.query.numSeg;
    console.log({ day: day, fid: fid,
      tmStart: tmStart, tmEnd: tmEnd,
      numSeg: numSeg }); // logging
    data = facility.queryPeopleFlow(day, fid, tmStart, tmEnd, numSeg);
  } else if (queryType == 'msgflow') {
    var day = req.query.day,
        fid = req.query.fid,
        tmStart = parseInt(req.query.tmStart),
        tmEnd = parseInt(req.query.tmEnd),
        direction = req.query.direction,
        numSeg = req.query.numSeg;
    console.log({ day: day, fid: fid,
      tmStart: tmStart, tmEnd: tmEnd, direction: direction,
      numSeg: numSeg }); // logging
    data = comm.queryFaciCommFlow(day, fid, direction, tmStart, tmEnd, numSeg);
  } else if (queryType == 'msgperppl') {
    var day = req.query.day,
        fid = req.query.fid,
        tmStart = parseInt(req.query.tmStart),
        tmEnd = parseInt(req.query.tmEnd),
        direction = req.query.direction,
        numSeg = req.query.numSeg;
    console.log({ day: day, fid: fid,
      tmStart: tmStart, tmEnd: tmEnd, direction: direction,
      numSeg: numSeg }); // logging
    var dataP = facility.queryPeopleFlow(day, fid, tmStart, tmEnd, numSeg);
    var dataM = comm.queryFaciCommFlow(day, fid, direction, tmStart, tmEnd, numSeg);
    data = {};
    for (var key in dataP) {
      if (dataM[key] == undefined) continue;

      data[key] = [];
      for (var i in dataP[key]) {
        var t = dataP[key][i][0],
            m = dataM[key][i][1],
            p = dataP[key][i][1];
        if (p == 0)
          data[key].push([t, 0]);
        else data[key].push([t, m / p]);
      }
    }
  } else {
    console.error('unhandled queryType', queryType);
  }
  if (data == null) res.sendStatus(400);
  else res.jsonp(data);
});


meta.setup();
group.setup();
move.setup();
facility.setup();
comm.setup();
console.log('server all setup done');
app.listen(3000);
