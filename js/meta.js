
'use strict';

var meta = {
  // Map index of people to raw data ID
  mapPid: [],
  // Map index of move event to its name
  mapMove: [],
  // Map index of comm area to its name
  mapArea: [],
  // Facilities
  facilities: {},
  facilitiesList: [],
  // GroupInfo
  groupInfo: {},

  /** @const */
  GID_OFFSET: 20000,
  AREA_OFFSET: 10,

  /** Get everything needed */
  getData: function() {
    this.getMeta();
    this.getFacilities();
    this.getGroupInfo();
  },

  /**
   * Get all meta data
   */
  getMeta: function() {
    var meta = this;
    $.get(vastcha15.serverAddr, {
      queryType: 'meta'
    }, function(data) {
      meta.mapPid = data.peopleId;
      meta.mapMove = data.moveEvent;
      meta.mapArea = data.commArea;
    }, 'jsonp')
      .fail(function() {
          vastcha15.error('getMeta failed');
        });
  },

  /**
   * Get all facilities data
   */
  getFacilities: function() {
    var meta = this;
    $.get(vastcha15.serverAddr, {
      queryType: 'facility'
    }, function(data) {
      meta.facilities = data;
      meta.facilitiesList[0] = {
        type: 'None'
      }; // None
      $.each(data, function(key, faci) {
        meta.facilitiesList[faci.id] = faci;
      });
    }, 'jsonp')
      .fail(function() {
          vastcha15.error('getFacilities failed');
        });
  },

  /**
   * Get all facilities data
   */
  getGroupInfo: function() {
    var meta = this;
    $.get(vastcha15.serverAddr, {
      queryType: 'groupinfo'
    }, function(data) {
      meta.groupInfo = data;
      meta.sanitizeGroupInfo_();
    }, 'jsonp')
      .fail(function() {
          vastcha15.error('getGroupInfo failed');
        });
  },

  /**
   * Remove groups that contains only 1 person in the references.
   * @private
   */
  sanitizeGroupInfo_: function() {
    for (var day in this.groupInfo.in_group) {
      var in_group = this.groupInfo.in_group[day];
      for (var pid in in_group) {
        var gid = in_group[pid];
        if (gid == null) continue;
        if (this.groupInfo.groups[gid].length == 1) {
          in_group[pid] = null;
        }
      }
    }
  },

  /**
   * Check if a pid is a valid pid / gid
   * @param {number} pid
   */
  isValidPid: function(pid) {
    if (pid >= 0 && pid < this.mapPid.length) return true;
    return this.isGroup(pid);
  },

  /**
   * Check if a given gid is a group.
   * @param {number} gid
   * @return {boolean}
   */
  isGroup: function(gid) {
    if (gid < this.GID_OFFSET) return false;
    gid -= this.GID_OFFSET;
    if (gid >= 0 && gid < this.groupInfo.groups.length) {
      if (this.groupInfo.groups[gid].length > 1)
        return true;
    }
    return false;
  },

  /**
   * Get the group of a pid.
   * If the pid is not in any group on the given day, return null.
   * @param {string} day
   * @param {number} pid Cannot be a group
   * @return {number|null}
   */
  getGroup: function(day, pid) {
    if(this.isGroup(pid))
      return vastcha15.error('getGroup receives a group', pid);
    var gid = this.groupInfo.in_group[day][pid];
    if (gid == undefined) return null;
    return gid + this.GID_OFFSET;
  },

  /**
   * Return the members of a group.
   * @param {number} gid
   * @return {Array<number>}
   */
  groupMembers: function(gid) {
    return this.groupInfo.groups[gid - this.GID_OFFSET];
  },

  /**
   * Return the number of members in a group.
   * If the input is not a group (i.e. a pid), return 1.
   * @param {number} gid
   * @return {number}
   */
  sizeGroup: function(gid) {
    if (!this.isGroup(gid)) return 1;
    return this.groupInfo.groups[gid - this.GID_OFFSET].length;
  }
};
