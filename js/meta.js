
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
  // GroupInfo
  groupInfo: {},

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
  }

};
