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
	var dataType = req.query.dataType,
	    queryType = req.query.queryType;

  console.log(dataType);
	var data = {};
	if (dataType == "move") {
	  var tmStart = parseInt(req.query.tmStart),
	      tmEnd = parseInt(req.query.tmEnd),
	      day = req.query.day;
	  data = move.queryTimeRange(day, tmStart, tmEnd);
	} else if (dataType == "comm") {
	  // TODO
	} else {
	  console.error("unhandled dataType", dataType);
	}
	console.log(data.length + " items sent");
	res.jsonp(data);
});

move.setup();
comm.setup();
app.listen(3000);
