
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
        name: 'None',
        type: 'None'
      };
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
    }, 'jsonp')
      .fail(function() {
          vastcha15.error('getGroupInfo failed');
        });
  },

  /**
   * Check if a pid is a valid pid / gid
   * @param {number} pid
   */
  isValidPid: function(pid) {
    if (pid >= 0 && pid < this.mapPid.length) return true;
    pid -= this.GID_OFFSET;
    if (pid >= 0 && pid < this.groupInfo.groups.length) {
      if (this.groupInfo.groups[pid].length > 1)
        return true;
    }
    return false;
  }

};
