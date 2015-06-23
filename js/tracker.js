
'use strict';

var tracker = {
  /**
   * Targets that are being tracked.
   * Targets can be assigned custom colors.
   */
  targets: [],
  /**
   * Persons that are currently selected.
   * Selected persons can be added to targets.
   */
  selects: [],
  
  
  /**
   * Prepare the tracker, fetch DOMs, etc.
   */
  context: function(hello) {
    this.jqSelect=  $('#select-list .panel-body');
    this.jqTarget = $('#target-list .panel-body');
  },
  
  /**
   * Set the selects to a given list
   * @param {array<int>} selects List of selected pids
   */
  setSelects: function(selects) {
    this.selects = selects;
    this.showSelects();
  },
  
  /**
   * Set the targets to a given list
   * @param {array<int>} targets List of target pids
   */
  setTargets: function(targets) {
    this.targets = targets;
    this.shotTargets();
  },
  
  /**
   * List the targets in the targetList view
   * Targets are at this.targets.
   */
  showTargets: function() {
  },
  /**
   * List the selects in the selectList view
   * Selected are at this.selects.
   */
  showSelects: function() {
    var list = [];
    for (var i = 0; i < this.selects.length; i++) {
      var id = this.selects[i];
      list.push(meta.mapPid[id]);
    }
    list.sort(function(a, b) { return a - b; });
    for (var i = 0; i < list.length; i++) {
      $('<div></div>')
        .text(list[i])
        .addClass('label label-default label-selected')
        .appendTo(this.jqSelect);
    }
  }
}
