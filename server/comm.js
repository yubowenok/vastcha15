/**
*
* Read and process the communication data
*
**/

'use strict';

var fs = require('fs'),
    utils = require('./utils.js'),
    move = require('./move.js'),
    area = require('./area.js');
var filePrefix = '../data/comm/comm-data-',
    // TODO(bowen): temporarily disable Sat and Sun as they are too slow
    days = {'Fri': 0}; //, 'Sat': 1, 'Sun': 2};

var origData = {};


/** @export */
module.exports = {
  setup: function() {
    var errorcnt = 0;
    for (var day in days) {
      var fileName = filePrefix + day + '.bin';
      console.log('getting', fileName);
      var buf = utils.readFileToBuffer(fileName);

      var offset = 0;
      var n = buf.readInt32LE(offset);
      offset += 4;
      var origData_day = [];
      var pidData_day = {};

      for (var i = 0; i < n; i++) {
        var tmstamp = buf.readInt32LE(offset);
        offset += 4;
        var id_from = buf.readInt16LE(offset);
        offset += 2;
        var id_to = buf.readInt16LE(offset);
        offset += 2;
        var areaCode = buf.readInt8(offset);
        offset++;
        origData_day.push([tmstamp, id_from, id_to, areaCode]);

        /* //Used for checking areacode classifier
        var moveData = move.queryPidExactTime(day, id_from.toString(), tmstamp);
        for(var key in moveData) {
          var x=moveData[key][0],
              y=moveData[key][1];
          var guess = area.areaOf(x,y);
          if (guess!=areaCode){
            errorcnt++;
            //console.log('',x,',',y,',',areaCode,'not', guess);
          }
        }*/

        if (i % 200000 == 0) {
          console.log((i / n * 100).toFixed(1) + '%...');
        }
      }

      origData[day] = origData_day;
    }
    //console.log('mis-classified area #',errorcnt);
    console.log('comm data ready');
  }
};
