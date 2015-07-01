/**
*
* Read and process the meta data
*
**/

'use strict';

var fs = require('fs'),
    utils = require('./utils.js'),
    area = require('./area.js');
var filePrefix = '../data/groups-',
    days = {'Fri': 0 , 'Sat': 1, 'Sun': 2};
var lines, lineIndex = 0;

var getLine = function() {
  var line = lines[lineIndex++];
  return line;
};

var data;
var curgid = 0;
var gidrange = {};
var groups = [];
var in_group = {};


/** @export */
module.exports = {

  setup: function() {
    for (var day in days) {
      var fileName = filePrefix + day + '.dat';
      var contents = fs.readFileSync(fileName, 'utf8');
      lines = contents.match(/[^(\r\n|\r|\n)]+/g);
      lineIndex = 0;
      in_group[day] = [];
      gidrange[day] = [curgid, curgid];

      var numGroups = parseInt(getLine());
      for (var i = 0; i < numGroups; i++) {
        var g = getLine().split(' ');
        for (var j = 0; j < g.length; j++) {
          g[j] = +g[j];
          in_group[day][g[j]] = curgid;
        }
        groups.push(g);
        gidrange[day][1] = curgid;
        curgid++;
      }
    }

    data = {
      groups: groups,
      in_group: in_group,
      gidrange: gidrange
    };

    console.log(gidrange);
    console.log('groups data ready');
  },

  allGroupInfo: function() {
    return data;
  },

  members: function(pid) {
    // Return the members' person ids given query group id
    //
    // Here are some examples of query:
    // queryType=members&day=Fri&pid=2,20009,20312,33333

    var result = {};

    if (pid == undefined || pid == '') return {};
    else pid = pid.split(',');

    for (var i in pid) {
      var id = pid[i],
          members;

      if (id >= 20000) {
        members = groups[id - 20000];
      }
      if (members == undefined) continue;
      result[id] = members;
    }
    return result;
  },

  belongs: function(day, pid) {
    // return the person's belonging group id given query pid
    if (pid == undefined || pid == '' || pid >= 20000) return undefined;
    return in_group[day][pid];
  }
};
