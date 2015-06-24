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
    meta = require('./meta.js');

var utils = require('./utils.js');

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
        pid = req.query.pid;

    // logging
    console.log({
      dataType: dataType,
      day: day,
      tmRange: [tmStart, tmEnd],
      pid: pid
    });

    if (dataType == 'move' || dataType == 'both') {
      moveData = move.queryPidTimeRange(day, pid, tmStart, tmEnd);
      console.log(utils.size(moveData) + ' move items sent');
    }
    if (dataType == 'comm' || dataType == 'both') {
      commData = comm.queryTimeRange(day, tmStart, tmEnd);
      console.log(utils.size(commData) + ' comm items sent');
    }
    data = [];
    if (moveData) data.push(moveData);
    if (commData) data.push(commData);
    if (data.length == 1) data = data[0];
  } else if (queryType == 'timeexact') {
    var moveData = null, commData = null;
    var dataType = req.query.dataType,
        day = req.query.day,
        tmExact = req.query.tmExact,
        pid = req.query.pid;

    // logging
    console.log({
      dataType: dataType,
      day: day,
      tmExact: tmExact,
      pid: pid
    });

    if (dataType == 'move' || dataType == 'both') {
      moveData = move.queryPidExactTime(day, pid, tmExact);
    }
    data = [];
    if (moveData) data.push(moveData);
    if (commData) data.push(commData);
    if (data.length == 1) data = data[0];
  } else if (queryType == 'meta') {
    data = meta.query();
  } else if (queryType == 'areaseq') {
    var areaData = null;
    var day = req.query.day,
        pid = req.query.pid;
    
    // logging
    console.log({
      day: day,
      pid: pid
    });
    areaData = move.queryPidAreaSequence(day,pid);
    data = move.queryPidAreaSequence(day,pid);
  } else {
    console.error('unhandled queryType', dataType);
  }
  if (data == null) res.sendStatus(400);
  else res.jsonp(data);
});


meta.setup();
move.setup();
comm.setup();
app.listen(3000);
