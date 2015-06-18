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

app.post('/vastcha15/', function(req, res){
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

app.get('/vastcha15/', function(req, res) {
  // get param by req.query.{param}
	var dataType = req.query.dataType,
	    queryType = req.query.queryType;
        
    console.log(req.query);
	var data = {};
	if (dataType == "move") {
	  var tmStart = parseInt(req.query.tmStart),
	      tmEnd = parseInt(req.query.tmEnd),
	      tmExact = req.query.tmExact,
          day = req.query.day,
          pid = req.query.pid;
      
      if (tmExact != undefined) {
        data = move.queryPidExactTime(day, pid, tmExact);  
      }
      else { 
        data = move.queryPidTimeRange(day, pid, tmStart, tmEnd);
      }
	} else if (dataType == "comm") {
	  // TODO
	} else {
	  console.error("unhandled dataType", dataType);
	}
	res.json(data);
});

move.setup();
comm.setup();
app.listen(3000,function(){console.log("listening on 3000")});
