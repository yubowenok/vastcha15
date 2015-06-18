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
var origData = {};
var pidData = {};

var tmGeq = function(a, v) {
  return a[0] >= v; // get timestamp, stored as the first element in the array
};

var valid = function(x) {
  return (x != undefined && !isNaN(x));
};

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

       
        if (pidData_day[id]==undefined) {
          pidData_day[id]=[];
        } else {
          pidData_day[id].push ( [tmstamp, event, x, y] );
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
    // Note: the return format are DIFFERENT if pid is not given.
    // If pid is not given, the return format is: [[tmstamp, id, event, x, y]*N]
    // If pid(s) are given, the return format is: {id1:[tmstamp, event, x, y]*N1, id2:[...], ... }
    //
    // Here are some examples of query:
    // ?queryType=timerange&dataType=move&day=Fri&pid[]=12&pid[]=999&tmStart=1402066854&tmEnd=1402096855
    // ?queryType=timerange&dataType=move&day=Fri&pid=2333&tmStart=1402086854
    // ?queryType=timerange&dataType=move&day=Fri&tmEnd=1402067777
    // ?queryType=timerange&dataType=move&day=Fri&pid=1&pid=2&pid=3&pid=4&pid=5&pid=6

    if (pid==undefined){
      var dayData= origData[day],
          l=0, r=dayData.length;
      if (valid(tmStart)) l = utils.lowerBound(dayData, tmStart, tmGeq);
      if (valid(tmEnd)) r = utils.lowerBound(dayData, tmEnd + 1, tmGeq);

      return dayData.slice(l,r);
    }
    else{
      var result = {};

      if (typeof(pid)!='object') pid = [pid];
      for (var i in pid)
      {
        var id = pid[i];
        if (!(id in pidData[day])) { 
          result[id] = [];
          continue;
        }
        var dayData=pidData[day][id],
            l=0, r=dayData.length;

        if (valid(tmStart)) l = utils.lowerBound(dayData, tmStart, tmGeq);
        if (valid(tmEnd)) r = utils.lowerBound(dayData, tmEnd + 1, tmGeq);
        result[id] = dayData.slice(l,r);
      }
      return result;
    }

  },

  queryPidExactTime: function(day, pid, tmExact) {
    // Return the coordinates at an exact time of a given set of person_ids.
    // Interpolation is used when time is not exact as in the input.
    // Return coordinates may be floats.
    //
    // Here are some examples of query:
    // ?queryType=timeexact&dataType=move&day=Fri&pid=1&tmExact=1402067068
    // ?queryType=timeexact&dataType=move&day=Fri&pid=1&pid=2&pid=123&tmExact=1402067068
    
    var result = {};

    if (typeof(pid)!='object') pid = [pid];
    for (var i in pid)
    {
      var id = pid[i],
          dayData=pidData[day][id],
          l=0, r=dayData.length;

      l = utils.lowerBound(dayData, tmExact, tmGeq);

      if (dayData[0][0]>tmExact || dayData[dayData.length-1][0]<tmExact)
      {  
        result[id] = [NaN];
      }
      else if (dayData[0][0] == tmExact)
      {
        result[id] = [dayData[0][2], dayData[0][3]];
      }
      else 
      {
        var tm0 = dayData[l-1][0],
            tm1 = dayData[l][0],
            interp_x =( (tmExact - tm0)*dayData[l][2] + (tm1 - tmExact)*dayData[l-1][2] )/(tm1-tm0),
            interp_y =( (tmExact - tm0)*dayData[l][3] + (tm1 - tmExact)*dayData[l-1][3] )/(tm1-tm0);
        result[id] = [interp_x, interp_y];
      }
    }
    return result;

  }
};
