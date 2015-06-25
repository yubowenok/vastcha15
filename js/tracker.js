'use strict';

var tracker = {
  /**
   * Targets that are being tracked.
   * Targets can be assigned custom colors.
   */
  targeted: {},
  /**
   * Persons that are currently selected.
   * Selected persons can be added to targets.
   * selectedP stores the highlights from the selects (to be added to targets)
   */
  selected: {},
  selectedP: {},

  /**
   * May be set to temporarily not send changes event.
   * This is particularly useful when we modify a lot of selects / targets at once,
   * in which case we can only re-render in the end once.
   * @private {boolean}
   */
  blockChanges_: false,
  /**
   * Set or get the block changes tate
   * @param   {boolean|undefined} state
   *   State to be set. If not given, returns the current state
   * @returns {boolean}
   *   Current state
   */
  blockChanges: function(state) {
    if (state == undefined) return this.blockChanges_;
    this.blockChanges_ = state;
    return state;
  },


  /**
   * Prepare the tracker, fetch DOMs, etc.
   */
  context: function (hello) {
    var tracker = this;
    this.jqSelect = $('#select-list .panel-body');
    this.jqTarget = $('#target-list .panel-body');

    this.jqTarget.droppable({
      accept: '.tracker-select',
      drop: function (event, ui) {
        // Get the id of the label, note that this is new index
        var id = ui.draggable.attr('data-value');
        tracker.addSelectToTarget(id);
      }
    });

    $('#select-list button[value=add]')
      .click(function () {
        tracker.addSelectsPToTargets();
      });
    $('#select-list button[value=remove]')
      .click(function () {
        tracker.removeSelectsPFromSelects();
      });
    $('#target-list button[value=add]')
      .click(function() {
        tracker.addInputsToTargets();
      });
  },

  /**
   * Event like function. Fired when tracker state changes.
   */
  changed: function() {
    if (!this.blockChanges()) {
      mapvis.renderPositions();
    }
  },

  /**
   * Set the selects / targets to a given list, and discard the previous list.
   * Sort the list by their raw ids first
   * @param {Array<int>} list List of pids
   */
  setSelects: function (list) {
    this.blockChanges(true);
    this.clearSelects();
    var slist = [];
    for (var i = 0; i < list.length; i++) {
      slist.push([meta.mapPid[list[i]], list[i]]);
    }
    slist.sort(function (a, b) {
      return a[0] - b[0];
    });
    this.selected = {};
    for (var i = 0; i < slist.length; i++) {
      var pid = slist[i][1];
      this.addSelect(pid);
    }
    this.blockChanges(false);
    this.changed();

    // additional stuffs
    vastcha15.queryAreaSequences({
      day: vastcha15.day,
      pid: list.join(',')
    }, function(data) {
      areavis.setSequenceData(data);
      areavis.renderSequences();
    });
  },
  setTargets: function (targets) {
    this.blockChanges(true);
    this.clearTargets();
    // TODO(bowen): implement setTargets()
    this.blockChanges(false);
    this.changed();
  },

  /**
   * Clear the selects / targets
   */
  clearSelects: function () {
    for (var pid in this.selected) {
      this.removeSelect(pid);
    }
  },
  clearTargets: function () {
    // TODO(bowen): implement clearTargets()
  },

  /**
   * Add input rawIds to targets
   */
  addInputsToTargets: function() {
    this.blockChanges(true);
    var input = $('#target-list input');
    var tokens = input.val().split(',');
    input.val("");
    for (var i = 0; i < tokens.length; i++) {
      var rawId = parseInt(tokens[i]);
      var pid = meta.mapPid.indexOf(rawId);
      if (pid == -1) {
        vastcha15.warning('Unknown ID', rawId);
        continue;
      }
      this.addTarget(pid);
    }
    this.blockChanges(false);
  },

  /**
   * Add all in selectsP to targets
   */
  addSelectsPToTargets: function () {
    for (var pid in this.selectedP)
      this.addTarget(pid);
    this.selectedP = {};
  },

  /**
   * Remove all in selectsP from selects
   */
  removeSelectsPFromSelects: function () {
    for (var pid in this.selectedP) {
      this.removeSelect(pid);
    }
  },

  /**
   * Transfer a person from selects to targets
   * @param {int} pid
   */
  addSelectToTarget: function (pid) {
    this.removeSelect(pid);
    this.addTarget(pid);
  },

  /**
   * Add a pid to selects / selectsP / targets
   * @param {int} pid
   */
  addSelect: function (pid) {
    if (this.targeted[pid]) return;
    this.selected[pid] = true;
    this.addSelectLabel(pid);
    this.changed();
  },
  addSelectP: function (pid) {
    tracker.selectedP[pid] = true;
    this.getLabel(this.jqSelect, pid)
      .addClass('label-info')
      .removeClass('label-default');
    this.changed();
  },
  addTarget: function (pid) {
    if (this.selected[pid])
      this.removeSelect(pid);
    if (this.targeted[pid])
      return vastcha15.error(pid, 'already exists in targets');
    this.targeted[pid] = true;
    this.addTargetLabel(pid);
    this.changed();
  },

  /**
   * Remove a pid from selects / selectsP / targets
   * @param {int} pid
   */
  removeSelect: function(pid) {
    delete tracker.selected[pid];
    if (this.selectedP[pid])
      this.removeSelectP(pid);
    this.removeSelectLabel(pid);
    this.changed();
  },
  removeSelectP: function(pid) {
    delete tracker.selectedP[pid];
    this.getLabel(this.jqSelect, pid)
      .removeClass('label-info')
      .addClass('label-default');
    this.changed();
  },
  removeTarget: function(pid) {
    delete tracker.targeted[pid];
    this.removeTargetLabel(pid);
    this.changed();
    // TODO(bowen): clean up target custom color?
  },

  /**
   * Add a label to the selects / targets
   * @param {int} pid
   */
  addSelectLabel: function (pid) {
    var tracker = this;
    var label = $('<div><span></span><span class="glyphicon glyphicon-remove btn-label-close"><span></div>')
      .attr('data-value', pid)
      .addClass('label label-default label-select tracker-select')
      .appendTo(this.jqSelect);
    label.find('span:first').text(meta.mapPid[pid]);
    label.find('.btn-label-close')
      .click(function() {
        tracker.removeSelect(pid);
      });
    label.click(function () {
      if (!tracker.selectedP[pid])
        tracker.addSelectP(pid);
      else
        tracker.removeSelectP(pid);
    }).draggable({
      helper: 'clone'
    });
  },
  addTargetLabel: function (pid) {
    var tracker = this;
    var label = $('<div><span></span><span class="glyphicon glyphicon-remove btn-label-close"><span></div>')
      .attr('data-value', pid)
      .addClass('label label-default label-target tracker-target')
      .appendTo(this.jqTarget);
    label.find('span:first').text(meta.mapPid[pid]);
    label.find('.btn-label-close')
      .click(function() {
        tracker.removeTarget(pid);
      });
    label.click(function () {
      // TODO(bowen): show colorpicker
    });
  },

  /**
   * Find and remove labels in selects / targets
   * @param {int} pid
   */
  removeSelectLabel: function(pid) {
    this.getLabel(this.jqSelect, pid).remove();
  },
  removeTargetLabel: function(pid) {
    this.getLabel(this.jqTarget, pid).remove();
  },

  /**
   * Fetch the label jQuery node within the container
   * @param {jQuery.selection} container jQuery container of the node
   * @param {int}              pid
   */
  getLabel: function (container, pid) {
    var label = container.find('.label[data-value=' + pid + ']');
    if (label.length == 0)
      vastcha15.error('getLabel failed', pid);
    return label
  }
}
