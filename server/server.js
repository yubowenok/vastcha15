/**
*
* Server entry instance
*
**/

"use strict";


var express = require("express");

// include custom data proc components
var	move = require("./move.js"),
	comm = require("./comm.js");

var app = express();

app.post('/vastcha15', function(req, res){
  // get param by req.body.{param}
	var dataType = req.body.dataType,
	    queryType = req.body.queryType;
	var data = {};
	if (dataType == "move") {
	} else if (dataType == "comm") {
	} else {
	  console.error("unhandled dataType", dataType);
	}
	res.json(data);
});

app.get('/vastcha15', function(req, res) {
  // get param by req.query.{param}
	var queryType = req.query.queryType;
	var data = null;

  console.log("Query:", queryType);
	if (queryType == "timerange") {
	  var moveData = null, commData = null;
	  var dataType = req.query.dataType,
	      day = req.query.day,
	      tmStart = parseInt(req.query.tmStart),
        tmEnd = parseInt(req.query.tmEnd);
    console.log(dataType, day, tmStart, tmEnd);
    if (dataType == "move" || dataType == "both") {
      moveData = move.queryTimeRange(day, tmStart, tmEnd);
      console.log(moveData.length + " move items sent");
    }
    if (dataType == "comm" || dataType == "both") {
      commData = comm.queryTimeRange(day, tmStart, tmEnd);
      console.log(commData.length + " comm items sent");
    }
    data = [];
    if (moveData) data.push(moveData);
    if (commData) data.push(commData);
	} else {
	  console.error("unhandled queryType", dataType);
	}
	if (data == null) res.sendStatus(400);
	else res.jsonp(data);
});

move.setup();
comm.setup();
app.listen(3000);
