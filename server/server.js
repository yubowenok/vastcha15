/**
*
* Server entry instance
*
**/

'use strict';


var express = require('express');

// include custom data proc components
var	move = require('./move.js'),
	comm = require('./comm.js');

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
	var queryType = req.query.queryType,
        data = null;

    console.log('Query:', queryType);
	if (queryType == 'timerange') {
	  var moveData = null, commData = null;
	  var dataType = req.query.dataType,
	      day = req.query.day,
	      tmStart = parseInt(req.query.tmStart),
          tmEnd = parseInt(req.query.tmEnd),
          pid = req.query.pid;
          
      console.log(dataType, day, tmStart, tmEnd, tmExact, pid);
      if (dataType == 'move' || dataType == 'both') {
        moveData = move.queryPidTimeRange(day, pid, tmStart, tmEnd);
        console.log(moveData.length + ' move items sent');
      }
      if (dataType == 'comm' || dataType == 'both') {
        commData = comm.queryTimeRange(day, tmStart, tmEnd);
        console.log(commData.length + ' comm items sent');
      }
      data = [];
      if (moveData) data.push(moveData);
      if (commData) data.push(commData);
	} else if (queryType == 'timeexact') {
      var moveData = null, commData = null;
	  var dataType = req.query.dataType,
	      day = req.query.day,
          tmExact = req.query.tmExact,
          pid = req.query.pid;
      console.log(dataType, day, tmExact, pid);
      if (dataType == 'move' || dataType == 'both') {
        moveData = move.queryPidExactTime(day, pid, tmExact); 
      }
      data = [];
      if (moveData) data.push(moveData);
      if (commData) data.push(commData);
    } else {
	  console.error('unhandled queryType', dataType);
	}
	if (data == null) res.sendStatus(400);
	else res.jsonp(data);
});

move.setup();
comm.setup();
app.listen(3000);
