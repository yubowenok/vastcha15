
'use strict';

var meta = {
  // Map index of people to raw data ID
  mapPid: [],
  // Map index of move event to its name
  mapMove: [],
  // Map index of comm area to its name
  mapArea: [],
  
  /**
   * Get all meta data
   */
  getData: function() {
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
  }
}