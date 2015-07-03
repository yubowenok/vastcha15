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
  if (queryType == 'timerange') {
    var moveData = null, commData = null;
    var dataType = req.query.dataType,
        day = req.query.day,
        tmStart = parseInt(req.query.tmStart),
        tmEnd = parseInt(req.query.tmEnd),
        pid = req.query.pid,
        direction;

    if (dataType == 'comm') {
      direction = req.query.direction;
      if (direction == undefined) {
        console.error('direction unspecified');
      }
    }

    // logging
    console.log({
      dataType: dataType,
      day: day,
      tmRange: [tmStart, tmEnd],
      pid: pid,
      direction: direction
    });

    if (dataType == 'move') {
      data = move.queryPidTimeRange(day, pid, tmStart, tmEnd);
      console.log(utils.size(data) + ' move items sent');
    } else if (dataType == 'comm') {
      data = comm.queryPidTimeRange(day, direction, pid, tmStart, tmEnd);
      console.log(utils.size(data) + ' comm items sent');
    } else {
      console.error('unknown dataType', dataType);
    }
  } else if (queryType == 'timeexact') {
    var moveData = null, commData = null;
    var dataType = req.query.dataType,
        day = req.query.day,
        tmExact = parseInt(req.query.tmExact),
        pid = req.query.pid;

    // logging
    console.log({
      dataType: dataType,
      day: day,
      tmExact: tmExact,
      pid: pid
    });

    if (dataType == 'move') {
      data = move.queryPidExactTime(day, pid, tmExact);
      console.log(utils.size(data) + ' move items sent');
    } else if (dataType == 'comm') {
      data = comm.queryPidExactTime(day, pid, tmExact);
      console.log(utils.size(data) + ' comm items sent');
    } else {
      console.error('unknown dataType', dataType);
    }
  } else if (queryType == 'meta') {
    data = meta.allMeta();
  } else if (queryType == 'facility') {
    data = facility.allFacilities();
  } else if (queryType == 'areaseq') {
    var areaData = null;
    var day = req.query.day,
        pid = req.query.pid;
    console.log({ day: day, pid: pid }); // logging

    data = move.queryPidAreaSequence(day, pid);
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
  } else {
    console.error('unhandled queryType', queryType);
  }
  if (data == null) res.sendStatus(400);
  else res.jsonp(data);
});


meta.setup();
group.setup();
move.setup();
comm.setup();
app.listen(3000);
