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
var groups = {};
var in_group = {};


/** @export */
module.exports = {

  setup: function() {
    for (var day in days) {
      var fileName = filePrefix + day + '.dat';
      var contents = fs.readFileSync(fileName, 'utf8');
      lines = contents.match(/[^(\r\n|\r|\n)]+/g);
      lineIndex = 0;
      groups[day] = [];
      in_group[day] = [];

      var numGroups = parseInt(getLine());
      for (var i = 0; i < numGroups; i++) {
        var g = getLine().split(' ');
        for (var j = 0; j < g.length; j++) {
          g[j] = +g[j];
          in_group[day][g[j]] = i;
        }
        groups[day].push(g);
      }
    }

    data = {
      groups: groups,
      in_group: in_group
    };

    console.log('groups data ready');
  },

  allGroupInfo: function() {
    return data;
  }

};
