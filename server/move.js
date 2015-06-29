/**
*
* Read and process the movement data
*
**/

'use strict';

var fs = require('fs'),
    utils = require('./utils.js');
var filePrefix = ['../data/move/grouped-move-sample-',
                  '../data/move/grouped-area-sequence-'],
    // TODO(bowen): temporarily disable Sat and Sun as they are too slow
    days = {'Fri': 0, 'Sat': 1, 'Sun': 2};
var pids = {};
var pidData = {};
var areaSeqData = {};

var tmGeq = function(a, v) {
  return a[0] >= v; // get timestamp, stored as the first element in the array
};

var valid = function(x) {
  return (x != undefined && !isNaN(x));
};


/** @export */
module.exports = {

  setup: function() {
    console.time('loadMoveTime');
    for (var day in days) {
      var fileName = filePrefix[0] + day + '.bin';
      console.log('getting', fileName);
      var buf = utils.readFileToBuffer(fileName);

      var offset = 0;
      var n = buf.readInt16LE(offset);
      offset += 2;
      pids[day] = [];
      pidData[day] = [];

      for (var i = 0; i < n; i++) {
        var id = buf.readInt16LE(offset);
        offset += 2;
        var num_act = buf.readInt16LE(offset);
        offset += 2;
        pids[day].push(id);
        pidData[day][id] = [];
        for (var j = 0; j < num_act; j++) {
          var tmstamp = buf.readInt32LE(offset);
          offset += 4;
          var event = buf.readInt8(offset);
          offset++;
          var x = buf.readInt8(offset),
              y = buf.readInt8(offset + 1);
          offset += 2;
          pidData[day][id].push([tmstamp, event, x, y]);
        }

        if (i % 1000 == 0) {
          console.log((i / n * 100).toFixed(1) + '%...');
        }
      }

      // read area sequence data
      fileName = filePrefix[1] + day + '.bin';
      console.log('getting', fileName);
      offset = 0;
      buf = utils.readFileToBuffer(fileName);
      n = buf.readInt32LE(offset);
      offset += 4;
      areaSeqData[day] = [];
      for (var i = 0; i < n; i++) {
        var id = buf.readInt16LE(offset);
        offset += 2;
        var numArea = buf.readInt16LE(offset);
        offset += 2;
        areaSeqData[day][id] = new Array(numArea);
        for (var j = 0; j < numArea; j++) {
          var tmstamp = buf.readInt32LE(offset);
          offset += 4;
          var areaCode = buf.readInt8(offset);
          offset++;
          areaSeqData[day][id][j] = [tmstamp, areaCode];
        }
      }

    }
    console.timeEnd('loadMoveTime');
    console.log('move data ready');
  },


  queryPidTimeRange: function(day, pid, tmStart, tmEnd) {
    // Return the movement activities given a set of person_ids and time range.
    // If not given pid, return the activities of everyone.
    // The return format is (either given/not given pid):
    //    {id0:[[tmstamp, event, x, y]*n0], id1:[...], ... }
    //
    // Here are some examples of query:
    // ?queryType=timerange&dataType=move&day=Fri&pid=12,999
    //           &tmStart=1402066854&tmEnd=1402096855
    // ?queryType=timerange&dataType=move&day=Fri&pid=2333&tmStart=1402086854
    // ?queryType=timerange&dataType=move&day=Fri&tmEnd=1402067777
    // ?queryType=timerange&dataType=move&day=Fri&pid=1,2,3,4,5,6

    if (pid == undefined) {
      pid = pids[day];
    } else {
      pid = pid.split(',');
    }
    console.log('Total # of pid:', pid.length);

    var result = {};
    for (var i = 0; i < pid.length; i++) {
      var id = pid[i],
          dayData = pidData[day][id],
          l = 0, r = dayData.length;
      if (r == 0) continue;

      if (valid(tmStart)) l = utils.lowerBound(dayData, tmStart, tmGeq);
      if (valid(tmEnd)) r = utils.lowerBound(dayData, tmEnd + 1, tmGeq);
      if (l >= r) continue;
      result[id] = [];

      // use queryPidExactTime to interpolate the position for tmStart
      if (valid(tmStart) && dayData[l][0] != tmStart) {
        var getExact = this.queryPidExactTime(day, toString(id), tmStart);
        if ((id in getExact) && getExact[id] != undefined && getExact[id].length != 0) {
          result[id].push = [tmStart, getExact[id][0], getExact[id][1], getExact[id][2]];
        }
      }

      for (var j = l; j < r; j++)
        result[id].push(dayData[j]);

      // use queryPidExactTime to interpolate the position for tmEnd
      if (valid(tmEnd) && dayData[r - 1][0] != tmEnd) {
        var getExact = this.queryPidExactTime(day, toString(id), tmEnd);
        if ((id in getExact) && getExact[id] != undefined && getExact[id].length != 0) {
          result[id].push = [tmEnd, getExact[id][0], getExact[id][1], getExact[id][2]];
        }
      }
    }
    return result;
  },

  queryPidExactTime: function(day, pid, tmExact) {
    // Return the coordinates at an exact time of a given set of person_ids.
    // If not given pid, return the activities of everyone.
    // Interpolation is used when time is not exact as in the input.
    // Return coordinates may be floats.
    // The return format is (either given/not given pid):
    //    {id0:[event, x, y], id1:[...], ... }
    //
    // Here are some examples of query:
    // ?queryType=timeexact&dataType=move&day=Fri&tmExact=1402067068
    // ?queryType=timeexact&dataType=move&day=Fri&pid=1,2,123&tmExact=1402067068

    var result = {};
    if (pid == undefined) {
      pid = pids[day];
    } else {
      pid = pid.split(',');
    }
    for (var i in pid) {
      var id = pid[i],
          dayData = pidData[day][id];
      if (dayData == undefined) {
        //console.log('No pid =', id,'in movement data.');
        continue;
      }
      var l = 0, r = dayData.length;
      if (r == 0) continue;
      l = utils.lowerBound(dayData, tmExact, tmGeq);

      if (dayData[0][0] > tmExact ||
          dayData[r - 1][0] < tmExact) {
        //result[id] = [NaN]; // If not found, time do not return id
      }
      else if (dayData[0][0] == tmExact) {
        result[id] = [dayData[0][1], dayData[0][2], dayData[0][3]];
      } else {
        var tm0 = dayData[l - 1][0], tm1 = dayData[l][0],
            x0 = dayData[l - 1][2], x1 = dayData[l][2],
            y0 = dayData[l - 1][3], y1 = dayData[l][3],
            interp_x = ((tmExact - tm0) * x1 + (tm1 - tmExact) * x0) / (tm1 - tm0),
            interp_y = ((tmExact - tm0) * y1 + (tm1 - tmExact) * y0) / (tm1 - tm0);
        result[id] = [dayData[l][1], interp_x, interp_y];
      }
    }
    /*console.log('Found:', Object.keys(result).length,
        '/', pid.length, 'at', tmExact);
    */
    return result;
  },

  queryPidAreaSequence: function(day, pid) {
    // Return the area sequence of the query pid.
    // If not given pid, return the activities of everyone.
    // Only record when the area changes.
    // They are returned in this format:
    //    {id0:[[tmstamp, areaCode]*n0], id1:[...], ... }
    //
    // Here are some examples of query:
    // ?queryType=areaseq&day=Fri&pid=1,2,3,4

    var result = {};
    if (pid == undefined) {
      pid = Object.keys(pidData[day]);
    } else {
      pid = pid.split(',');
    }
    for (var i in pid) {
      var id = pid[i];
      result[id] = areaSeqData[day][id];
    }
    return result;
  }
};
