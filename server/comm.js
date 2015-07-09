/**
*
* Read and process the communication data
*
**/

'use strict';

var fs = require('fs'),
    utils = require('./utils.js'),
    move = require('./move.js'),
    group = require('./group.js'),
    facility = require('./facility.js'),
    area = require('./area.js');
var filePrefix = '../data/comm/comm-data-',
    days = {'Fri': 0, 'Sat': 1, 'Sun': 2};

var groupInfo,
    origData = {};


/**
 * Data are in the form of
 * {
 *   day: {
 *     send: {
 *       pid: [ [time, pid], ..., ],
 *       ...
 *     },
 *     receive: {
 *       pid: [ [time, pid], ..., ],
 *       ...
 *     }
 *   },
 *   ...
 * }
 */
var pidData = {};


/**
 * Pids are in the form of
 * {
 *   day: {
 *     send: [ pid, pid, ... ],
 *     receive: ...,
 *   },
 *   ...
 * }
 */
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
    groupInfo = group.allGroupInfo();
    for (var day in days) {
      var fileName = filePrefix + day + '.bin';
      console.log('getting', fileName);
      var buf = utils.readFileToBuffer(fileName);

      var offset = 0;
      var n = buf.readInt32LE(offset);
      offset += 4;
      var origData_day = [];

      var daySend = {},
          dayReceive = {};

      for (var i = 0; i < n; i++) {
        var tmstamp = buf.readInt32LE(offset);
        offset += 4;
        var id_from = buf.readInt16LE(offset);
        offset += 2;
        var id_to = buf.readInt16LE(offset);
        offset += 2;
        var areaCode = buf.readInt8(offset);
        offset++;

        /*
          TODO(bowen):
          origData is disabled to save memory
          as it has no use for the moment
        */
        //origData_day.push([tmstamp, id_from, id_to, areaCode]);

        // Generate two way records
        // areaCode not used
        if (daySend[id_from] == undefined) daySend[id_from] = [];
        daySend[id_from].push([tmstamp, id_to]);
        if (dayReceive[id_to] == undefined) dayReceive[id_to] = [];
        dayReceive[id_to].push([tmstamp, id_from]);

        var gid_from = group.GID_OFFSET + groupInfo.in_group[day][id_from];
        var gid_to = group.GID_OFFSET + groupInfo.in_group[day][id_to];

        if (daySend[gid_from] == undefined) daySend[gid_from] = [];
        daySend[gid_from].push([tmstamp, id_to]);
        if (dayReceive[gid_to] == undefined) dayReceive[gid_to] = [];
        dayReceive[gid_to].push([tmstamp, id_from]);


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

      pidData[day] = {
        send: daySend,
        receive: dayReceive
      };

      pids[day] = {
        send: Object.keys(daySend),
        receive: Object.keys(dayReceive)
      };

      origData[day] = origData_day;
    }
    //console.log('mis-classified area #',errorcnt);
    console.log('comm data ready');
  },

  /**
   * Return the communication activities given a set of pids and time range.
   * @param   {string} day     'Fri' / 'Sat' / 'Sun'
   * @param   {string} direction 'send' / 'receive' / 'both'
   * @param   {string} pid     Comma separated pids
   * @param   {number} tmStart Start time
   * @param   {number} tmEnd   End time
   * @return {Object}
   *   Weighted directed graph of the communication volume between the time range
   *   The graph is described using adjacent list.
   *   For each pid, its adjacency list is in the form
   *   { id_to1: volume1, id_to2: volume2, ... }
   */
  queryPidTimeRange: function(day, direction, pid, tmStart, tmEnd) {
    if (direction == 'both') {
      var result = this.queryPidTimeRange(day, 'send', pid, tmStart, tmEnd);
      var result_r = this.queryPidTimeRange(day, 'receive', pid, tmStart, tmEnd);
      for (var id in result_r) {
        if (result[id] == undefined) result[id] = {};
        for (var id2 in result_r[id]) {
          if (result[id][id2] == undefined) result[id][id2] = 0;
          result[id][id2] += result_r[id][id2];
        }
      }
      return result;
    }

    if (pid == undefined) {
      pid = pids[day][direction];
      var gcnt = 0;
      for (var i = pid.length - 1; i >= 0 && pid[i] >= group.GID_OFFSET; i--, gcnt++);
      pid = pid.slice(-gcnt);
    } else {
      if (pid == '') return {};
      pid = pid.split(',');
    }

    var expanded = new Set();

    for (var i = 0; i < pid.length; i++) {
      var id = pid[i],
          gid = group.GID_OFFSET + groupInfo.in_group[day][id];
      if (id < group.GID_OFFSET) expanded.add(gid);
    }

    var result = {};
    for (var i = 0; i < pid.length; i++) {
      var id = pid[i],
          dayData = pidData[day][direction][id]; // [tmstamp, id2]
      if (dayData == undefined) continue;
      var l = 0, r = dayData.length;
      if (r == 0) continue;

      if (valid(tmStart)) l = utils.lowerBound(dayData, tmStart, tmGeq);
      if (valid(tmEnd)) r = utils.lowerBound(dayData, tmEnd + 1, tmGeq);
      if (l >= r) continue;

      result[id] = {};

      for (var j = l; j < r; j++) {
        //if (dayData[j][0] < tmStart || dayData[j][0] > tmEnd) console.log('b');
        var id2 = dayData[j][1];
        var gid2 = group.GID_OFFSET + groupInfo.in_group[day][id2];
        if (valid(gid2) && !group.isSingleGroup(gid2) && !expanded.has(gid2)) {
          if (result[id][gid2] == undefined) result[id][gid2] = 0;
          result[id][gid2]++;
        }
        else {
          if (result[id][id2] == undefined) result[id][id2] = 0;
          result[id][id2]++;
        }
      }
    }
    var num = 0;
    for (var pid in result)
      num += utils.size(result[pid]);
    console.log(num, 'edges');
    return result;
  },

  /**
   * Return the message send volume within a single time range.
   * Segmented queries call this repeatedly.
   * @private
   * @param     {string}  day
   * @direction {string}  direction
   * @param     {pid}     pid
   *   Single pid, pidData[day][direction][id] must exist!
   * @param     {number}  tmStart
   * @param     {number}  tmEnd
   * @return    {number}  Numeric volume
   */
  queryVolume_: function(day, direction, pid, tmStart, tmEnd) {
    if (direction == 'both') {
      var v0 = this.queryVolume_(day, 'send', pid, tmStart, tmEnd);
      var v1 = this.queryVolume_(day, 'receive', pid, tmStart, tmEnd);
      return v0 + v1;
    }
    var dayData = pidData[day][direction][pid]; // [tmstamp, id_to, areaCode]
    if (dayData == undefined)
      return 0;
    var l = 0, r = dayData.length;
    if (r == 0) return 0;
    if (valid(tmStart)) l = utils.lowerBound(dayData, tmStart, tmGeq);
    if (valid(tmEnd)) r = utils.lowerBound(dayData, tmEnd + 1, tmGeq);
    if (l >= r) return 0;
    return r - l;
  },

  /**
   * Return the message send volume for evenly segmented ranges.
   * @param {string} day
   * @param {string} direction
   * @param {pid} pid
   * @param {number} tmStart
   * @param {number} tmEnd
   * @param {number} numSeg
   */
  queryVolumeSegmented: function(day, direction, pid, tmStart, tmEnd, numSeg) {
    if (pid == undefined) {
      if (direction == 'both') {
        pid = pids[day]['send'];
        var pid_r = pids[day]['receive'];
        pid = utils.unique(pid.concat(pid_r));
      }
      else
        pid = pids[day][direction];
      var gcnt = 0;
      for (var i = pid.length - 1; i >= 0 && pid[i] >= group.GID_OFFSET; i--, gcnt++);
      pid = pid.slice(-gcnt);
    } else {
      if (pid == '') return {};
      pid = pid.split(',');
    }

    var result = {};
    var tmStep = parseInt((tmEnd - tmStart + 1) / numSeg);
    if (tmStep == 0) tmStep = 1;
    for (var i = 0; i < pid.length; i++) {
      var id = pid[i];
      result[id] = [];
      for (var s = tmStart; s <= tmEnd; s += tmStep) {
        var t = Math.min(s + tmStep, tmEnd);
        var vol = this.queryVolume_(day, direction, id, s, t);
        var len = result[id].length;
        //if (len >= 2 && result[id][len - 1] == vol && result[id][len - 2] == vol)
        //  result[id][len - 1][0] = s;
        //else result[id].push([s, vol]);
        result[id].push([s, vol]);
      }
    }

    return result;
  },

  /**
   * Same as queryPidTimerange with tmStart = tmEnd = tmExact
   * @param {string} day
   * @param {string} pid     Comma separated pids
   * @param {number} tmExact
   * @return {Object} Same as queryPidTimeRange
   * @deprecate
   */
  /*
  queryPidExactTime: function(day, pid, tmExact) {
    return this.queryPidTimeRange(day, pid, tmExact, tmExact);
  },
  */

  /**
   * Volume sequence for each pid
   * @param {string} day
   * @param {string} direction
   * @param {string} pid Comma separated pids
   */
  queryVolumeSequence: function(day, direction, pid) {
    if (pid == undefined) {
      if (direction == 'both') {
        pid = pids[day]['send'];
        var pid_r = pids[day]['receive'];
        pid = utils.unique(pid.concat(pid_r));
      }
      else
        pid = pids[day][direction];
      var gcnt = 0;
      for (var i = pid.length - 1; i >= 0 && pid[i] >= group.GID_OFFSET; i--, gcnt++);
      pid = pid.slice(-gcnt);
    } else {
      if (pid == '') return {};
      pid = pid.split(',');
    }
    var result = {};
    var count = 0;
    for (var i = 0; i < pid.length; i++) {
      var id = pid[i],
          dayData;

      if (direction == 'both') {
        var send_data = pidData[day]['send'][id];
        var recv_data = pidData[day]['receive'][id];
        dayData = utils.merge_2(send_data, recv_data);
      }
      else
        dayData = pidData[day][direction][id];
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
      for (var j = 1; j < seq.length; j++) {
        seq[j][1] += seq[j - 1][1];
      }
      result[id] = seq;
      count += seq.length;
    }
    console.log(count, 'elements returned');
    return result;
  }

};
