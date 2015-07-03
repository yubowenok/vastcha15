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

  GID_OFFSET: 20000,

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

    //console.log(gidrange);
    console.log('groups data ready');
  },

  allGroupInfo: function() {
    return data;
  },

  /**
   * Return the leader of a group.
   * If the given gid is a pid, return itself.
   * If the given gid is not a group on the given day,
   * return null.
   * @param {number|null} id
   */
  getLeader: function(day, id) {
    if (id < this.GID_OFFSET) return id;
    id -= this.GID_OFFSET;
    if (id < gidrange[day][0] ||
        id > gidrange[day][1])
      return null; // Is a group but not on this day, thus no leader
    var members = groups[id],
        leader = members[0];
    return leader;
  },

  /**
   * Return all the gids on a single day.
   * Note that if a group has only one member, that member's
   * pid is returned
   * @param   {string}        day
   * @return  {Array<number>}
   */
  getAllGids: function(day) {
    var pid = [];
    for (var i = gidrange[day][0]; i < gidrange[day][1]; i++) {
      var gid = i + this.GID_OFFSET;
      if (this.isSingleGroup(gid)) {
        pid.push(this.getLeader(day, gid));
      } else {
        pid.push(gid);
      }
    }
    return pid;
  },

  /**
   * Check if a group has only 1 member.
   * @param {number} gid Gid must be a valid
   * @return {boolean}
   */
  isSingleGroup: function(gid) {
    gid -= this.GID_OFFSET;
    if (!(gid >= 0 && gid < groups.length)) {
      console.error('invalid gid for isSingleGroup');
    }
    return groups[gid].length == 1;
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
      if (id >= this.GID_OFFSET) {
        members = groups[id - this.GID_OFFSET];
      }
      if (members == undefined) continue;
      result[id] = members;
    }
    return result;
  },

  belongs: function(day, pid) {
    // return the person's belonging group id given query pid
    if (pid == undefined || pid == '' || pid >= this.GID_OFFSET) return undefined;
    return in_group[day][pid];
  }
};
