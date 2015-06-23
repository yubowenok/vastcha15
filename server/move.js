/**
*
* Read and process the movement data
*
**/

'use strict';

var fs = require('fs'),
    utils = require('./utils.js');
var filePrefix = '../data/move/park-movement-',
    // TODO(bowen): temporarily disable Sat and Sun as they are too slow
    days = {'Fri': 0}; //, 'Sat': 1, 'Sun': 2};
var origData = {};
var pidData = {};

var tmGeq = function(a, v) {
  return a[0] >= v; // get timestamp, stored as the first element in the array
};

var valid = function(x) {
  return (x != undefined && !isNaN(x));
};


/** @export */
module.exports = {

  setup: function() {
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
        var id = buf.readInt16LE(offset);
        offset += 2;
        var event = buf.readInt8(offset);
        offset++;
        var x = buf.readInt8(offset),
            y = buf.readInt8(offset + 1);
        offset += 2;

        origData_day.push([tmstamp, id, event, x, y]);


        if (pidData_day[id] == undefined) {
          pidData_day[id] = [];
        } else {
          pidData_day[id].push(i);
        }

        if (i % 1000000 == 0) {
          console.log((i / n * 100).toFixed(1) + '%...');
        }
      }

      origData[day] = origData_day;
      pidData[day] = pidData_day;
    }
    console.log('move data ready');
  },


  queryPidTimeRange: function(day, pid, tmStart, tmEnd) {
    // Return the movement activities given a set of person_ids and time range.
    // If not given pid, return the activities of everyone.
    // The return format is (either given/not given pid):
    //    {id1:[tmstamp, event, x, y]*N1, id2:[...], ... }
    //
    // Here are some examples of query:
    // ?queryType=timerange&dataType=move&day=Fri&pid=12,999
    //           &tmStart=1402066854&tmEnd=1402096855
    // ?queryType=timerange&dataType=move&day=Fri&pid=2333&tmStart=1402086854
    // ?queryType=timerange&dataType=move&day=Fri&tmEnd=1402067777
    // ?queryType=timerange&dataType=move&day=Fri&pid=1,2,3,4,5,6

    if (pid == undefined) {
      pid = Object.keys(pidData[day]);
    } else {
      pid = pid.split(',');
    }
    console.log('Total # of pid:', pid.length);
    var dayData = origData[day];

    var result = {};
    for (var i in pid)
    {
      var id = pid[i];
      if (!(id in pidData[day])) continue;
      var idx = pidData[day][id],
          l = 0, r = idx.length;

      if (valid(tmStart)) l = utils.lowerBound2(dayData, idx, tmStart, tmGeq);
      if (valid(tmEnd)) r = utils.lowerBound2(dayData, idx, tmEnd + 1, tmGeq);
      if (l >= r) continue;
      result[id] = [];
      for (var j = l; j < r; j++)
        result[id].push([dayData[idx[j]][0], dayData[idx[j]][2],
                         dayData[idx[j]][3], dayData[idx[j]][4]]);
    }
    return result;
  },

  queryPidExactTime: function(day, pid, tmExact) {
    // Return the coordinates at an exact time of a given set of person_ids.
    // If not given pid, return the activities of everyone.
    // Interpolation is used when time is not exact as in the input.
    // Return coordinates may be floats.
    //
    // Here are some examples of query:
    // ?queryType=timeexact&dataType=move&day=Fri&tmExact=1402067068
    // ?queryType=timeexact&dataType=move&day=Fri&pid=1,2,123&tmExact=1402067068

    var result = {};
    if (pid == undefined) {
      pid = Object.keys(pidData[day]);
    } else {
      pid = pid.split(',');
    }
    for (var i in pid)
    {
      var id = pid[i],
          dayData = origData[day],
          idx = pidData[day][id];
      if (idx == undefined) {
        //console.log('No pid =', id,'in movement data.');
        continue;
      }
      var l = 0, r = idx.length;
      l = utils.lowerBound2(dayData, idx, tmExact, tmGeq);

      if (dayData[idx[0]][0] > tmExact ||
          dayData[idx[idx.length - 1]][0] < tmExact) {
        //result[id] = [NaN]; // If not found, time do not return id
      }
      else if (dayData[idx[0]][0] == tmExact) {
        result[id] = [dayData[idx[0]][3], dayData[idx[0]][4]];
      } else {
        var tm0 = dayData[idx[l - 1]][0],
            tm1 = dayData[idx[l]][0],
            interp_x = ((tmExact - tm0) * dayData[idx[l]][3] +
                        (tm1 - tmExact) * dayData[idx[l - 1]][3]) / (tm1 - tm0),
            interp_y = ((tmExact - tm0) * dayData[idx[l]][4] +
                        (tm1 - tmExact) * dayData[idx[l - 1]][4]) / (tm1 - tm0);
        result[id] = [interp_x, interp_y];
      }
    }
    /*console.log('Found:', Object.keys(result).length,
        '/', pid.length, 'at', tmExact);
    */
    return result;

  }
};
