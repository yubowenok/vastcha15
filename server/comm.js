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
    days = {'Fri': 0, 'Sat': 1, 'Sun': 2};

var origData = {};
var pidData = {};
var pids = {};

// Timestamp is stored as the first element in the array
var tmGeq = function(a, v) {
  return a[0] >= v;
};

var valid = function(x) {
  return (x != undefined && !isNaN(x));
};


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

        if (pidData_day[id_from] == undefined)
          pidData_day[id_from] = [];
        pidData_day[id_from].push([tmstamp, id_to, areaCode]);

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

      pids[day] = [];
      for (var pid in pidData_day) {
        pids[day].push(pid);
      }
      pidData[day] = pidData_day;
      origData[day] = origData_day;
    }
    //console.log('mis-classified area #',errorcnt);
    console.log('comm data ready');
  },

  /**
   * Return the communication activities given a set of pids and time range.
   * @param   {string} day     'Fri' / 'Sat' / 'Sun'
   * @param   {string} pid     Comma separated pids
   * @param   {number} tmStart Start time
   * @param   {number} tmEnd   End time
   * @return {Object}
   *   Weighted directed graph of the communication volume between the time range
   *   The graph is described using adjacent list.
   *   For each pid, its adjacency list is in the form
   *   { id_to1: volume1, id_to2: volume2, ... }
   */
  queryPidTimeRange: function(day, pid, tmStart, tmEnd) {
    if (pid == undefined) {
      pid = pids[day];
    } else {
      if (pid == "") return {};
      pid = pid.split(',');
    }

    var result = {};
    for (var i = 0; i < pid.length; i++) {
      var id = pid[i],
          dayData = pidData[day][id]; // [tmstamp, id_to, areaCode]
      if (dayData == undefined) continue;
      var l = 0, r = dayData.length;
      if (r == 0) continue;

      if (valid(tmStart)) l = utils.lowerBound(dayData, tmStart, tmGeq);
      if (valid(tmEnd)) r = utils.lowerBound(dayData, tmEnd + 1, tmGeq);
      if (l >= r) continue;

      result[id] = {};

      for (var j = l; j < r; j++) {
        //if (dayData[j][0] < tmStart || dayData[j][0] > tmEnd) console.log('b');
        var id_to = dayData[j][1];
        if (result[id][id_to] == undefined) result[id][id_to] = 0;
        result[id][id_to]++;
      }
    }
    var num = 0;
    for (var pid in result) {
      num += utils.size(result[pid]);
    }
    console.log(num, 'edges');
    return result;
  },

  /**
   * Same as queryPidTimerange with tmStart = tmEnd = tmExact
   * @param {string} day
   * @param {string} pid     Comma separated pids
   * @param {number} tmExact
   * @return {Object} Same as queryPidTimeRange
   */
  queryPidExactTime: function(day, pid, tmExact) {
    return this.queryPidTimeRange(day, pid, tmExact, tmExact);
  },

  /**
   * Volume sequence for each pid
   * @param {string} day
   * @param {string} pid Comma separated pids
   */
  queryVolumeSequence: function(day, pid) {
    if (pid == undefined) {
      pid = pids[day];
    } else {
      if (pid == "") return {};
      pid = pid.split(',');
    }
    var result = {};
    var count = 0;
    for (var i = 0; i < pid.length; i++) {
      var id = pid[i],
          dayData = pidData[day][id];
      if (dayData == undefined) continue;
      var seq = [], lastt = -1;
      for (var j = 0; j < dayData.length; j++) {
        var t = parseInt(dayData[j][0]);
        if (t != lastt) {
          seq.push([t, 0]);
          lastt = t;
        }
        seq[seq.length - 1][1] ++;
      }
      result[id] = seq;
      count += seq.length;
    }
    console.log(count, 'elements returned');
    return result;
  }
};
