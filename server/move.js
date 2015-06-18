/**
*
* Read and process the movement data
*
**/

'use strict';

var fs = require('fs'),
    utils = require('./utils.js');
var filePrefix = '../data/move/park-movement-',
    days = {'Fri': 0, 'Sat': 1, 'Sun': 2};
var data = {};

module.exports = {

  setup: function() {
    for (var day in days) {
      var fileName = filePrefix + day + '.bin';
      console.log('getting', fileName);
      var buf = utils.readFileToBuffer(fileName);

      var offset = 0;
      var n = buf.readInt32LE(offset);
      offset += 4;

      var dayData = [];
      for (var i = 0; i < n; i++) {
        var tmstamp = buf.readInt32LE(offset);
        offset += 4;
        var id = buf.readInt16LE(offset);
        offset += 2;
        var event = buf.readInt8(offset);
        offset++;
        var x = buf.readInt8(offset),
            y = buf.readInt8(offset + 1);
        offset += 2;
        dayData.push([tmstamp, id, event, x, y]);
        if (i % 1000000 == 0) console.log(i);
      }
      data[day] = dayData;
      console.log(dayData[0][0], dayData[dayData.length - 1][0]);
    }
    console.log('move data ready');
  },

  queryTimeRange: function(day, tmStart, tmEnd) {
    var tmGeq = function(a, v) {
      return a[0] >= v; // get timestamp, stored as the first element in the array
    };
    var dayData = data[day];
    var l = utils.lowerBound(dayData, tmStart, tmGeq),
        r = utils.lowerBound(dayData, tmEnd + 1, tmGeq);
    var result = [];
    for (var i = l; i < r; i++) {
      result.push(dayData[i]);
    }
    return result;
  }

};
