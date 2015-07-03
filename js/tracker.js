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

  /** Person that is currently hovered */
  hoverPid: null,

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
   * Set the hover pid and trigger update correspondingly
   * @param {number} pid
   */
  setHoverPid: function(pid) {
    if (pid != undefined) {
      this.hoverPid = pid;
      vastcha15.updateHover(pid);
    } else {
      var lastPid = tracker.hoverPid;
      this.hoverPid = null;
      vastcha15.clearHover(lastPid);
    }
  },

  /**
   * Return all pids selected / targeted
   * @return {Array<number>}
   */
  getSelects: function() {
    return Object.keys(this.selected);
  },
  getTargets: function() {
    return Object.keys(this.targeted);
  },
  getSelectsAndTargets: function() {
    return Object.keys(this.selected).concat(Object.keys(this.targeted));
  },

  /**
   * Prepare the tracker, fetch DOMs, etc.
   */
  context: function (hello) {
    var tracker = this;
    this.jqSelect = $('#select-list .panel-body');
    this.jqTarget = $('#target-list .panel-body');
    this.jqPrompt = $('#prompt')
      .click(function() {
        $(this).hide();
      });
    this.jqPromptHeader = this.jqPrompt.find('.panel-heading');
    this.jqPromptBody = this.jqPrompt.find('.panel-body');

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
    $('#select-list button[value=clear]')
      .click(function () {
        tracker.clearSelects();
      });
    $('#target-list button[value=add]')
      .click(function() {
        tracker.addInputsToTargets();
      });
    $('#target-list button[value=clear]')
      .click(function() {
        tracker.clearTargets();
      });

    $('#target-list .panel-body').sortable();

    $('body')
      .keydown(function(event) {
        if (event.which == utils.KeyCodes.ENTER &&
            event.target.id == "input-targets") {
          tracker.addInputsToTargets();
        }
      });
  },

  /** Highlight / unhighlight hovered labels */
  updateHover: function(pid) {
    if (this.selected[pid])
      $('#select-list .label[data-value=' + pid + ']')
        .addClass('label-warning');
    else if (this.targeted[pid])
      $('#target-list .label[data-value=' + pid + ']')
        .addClass('label-warning label-target-hover');
  },
  clearHover: function(pid) {
    if (this.selectedP[pid]) return;
    if (this.selected[pid])
      $('#select-list .label[data-value=' + pid + ']')
        .removeClass('label-warning');
    else if (this.targeted[pid])
      $('#target-list .label[data-value=' + pid + ']')
        .removeClass('label-warning label-target-hover');
  },

  /**
   * Show the pid info (i.e. group members)
   * for a given pid / gid.
   */
  showPidInfo: function(pid) {
    this.jqPromptBody.children().remove();
    this.jqPrompt.show()
      .css({
        left: this.jqTarget.offset().left - this.jqPrompt.width(),
        top: this.jqTarget.offset().top
      });
    if (meta.isGroup(pid)) {
      // This is a group
      this.jqPromptHeader.text('Group ' + pid);
      $('<b>Group Members:</b>')
          .appendTo(this.jqPromptBody);
      $('<p></p>')
        .text(meta.groupMembers(pid).join(', '))
        .appendTo(this.jqPromptBody);
      $('<button></button>')
        .addClass('btn btn-default btn-xs')
        .text('Expand Group')
        .appendTo(this.jqPromptBody)
        .click(function() {
          tracker.expandGroup(pid);
        });
    } else {
      this.jqPromptHeader.text('Individual ' + pid);
      var gid = meta.getGroup(vastcha15.day, pid);
      if (gid == null) {
        $('<p></p>')
          .text(pid + ' is not in any group on ' + vastcha15.day)
          .appendTo(this.jqPromptBody);
      } else {
        $('<p></p>')
          .text(pid + ' is in group ' + gid +
                ' on ' + vastcha15.day)
          .appendTo(this.jqPromptBody);
        $('<b>Group Members:</b>')
          .appendTo(this.jqPromptBody);
        $('<p></p>')
          .text(meta.groupMembers(gid).join(', '))
          .appendTo(this.jqPromptBody);
        $('<button></button>')
          .addClass('btn btn-default btn-xs')
          .text('Switch to Group')
          .appendTo(this.jqPromptBody)
          .click(function() {
            tracker.switchGroup(pid);
          });
      }
    }
  },

  /**
   * Event like function. Fired when tracker state changes.
   */
  changed: function() {
    if (!this.blockChanges()) {
      vastcha15.update();
    }
  },

  /**
   * Replace a group by its members
   * @param {number} gid Gid >= meta.GID_OFFSET
   */
  expandGroup: function(gid) {
    this.blockChanges(true);
    var members = meta.groupMembers(gid);
    for (var i = 0; i < members.length; i++) {
      var pid = members[i];
      if (!this.targeted[pid]) {
        this.addTarget(pid);
      }
    }
    this.removeTarget(gid);
    this.blockChanges(false);
    this.changed();
  },
  /**
   * Replace individuals by their group
   * @param {number} pid
   */
  switchGroup: function(pid) {
    this.blockChanges(true);
    var gid = meta.getGroup(vastcha15.day, pid);
    var members = meta.groupMembers(gid);
    for (var i = 0; i < members.length; i++) {
      var pid = members[i];
      if (this.targeted[pid]) {
        this.removeTarget(pid);
      }
    }
    this.addTarget(gid);
    this.blockChanges(false);
    this.changed();
  },

  /**
   * Set the selects / targets to a given list,
   * and discard the previous list.
   * Sort the list by their raw ids first
   * @param {Array<int>} list List of pids
   */
  setSelects: function (list) {
    this.blockChanges(true);
    if (!vastcha15.keys.shift) {
      for (var pid in this.selected) this.removeSelect(pid);
    }
    list.sort(function (a, b) { return a - b; });
    for (var i = 0; i < list.length; i++) {
      var pid = list[i];
      this.addSelect(pid);
    }
    this.blockChanges(false);
    this.changed();
  },
  setTargets: function (list) {
    this.blockChanges(true);
    for (var pid in this.targeted) this.removeTarget(pid);
    for (var i = 0; i < list.length; i++) {
      var pid = list[i];
      this.addTarget(pid);
    }
    this.blockChanges(false);
    this.changed();
  },

  /**
   * Clear the selects / targets
   */
  clearSelects: function () {
    this.blockChanges(true);
    for (var pid in this.selected) {
      this.removeSelect(pid);
    }
    this.blockChanges(false);
    this.changed();
  },
  clearTargets: function () {
    this.blockChanges(true);
    for (var pid in this.targeted) {
      this.removeTarget(pid);
    }
    this.blockChanges(false);
    this.changed();
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
      var pid = parseInt(tokens[i]);
      if (meta.isValidPid(pid)) {
        this.addTarget(pid);
      } else {
        vastcha15.warning(pid, 'is not a valid pid');
      }
    }
    this.blockChanges(false);
    this.changed();
  },

  /**
   * Add all in selectsP to targets
   */
  addSelectsPToTargets: function () {
    this.blockChanges(true);
    var targets = utils.size(this.selectedP) == 0 ?
        this.selected : this.selectedP;
    for (var pid in targets)
      this.addTarget(pid);
    this.selectedP = {};
    this.blockChanges(false);
    this.changed();
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
   * @param {number} pid
   */
  addSelect: function (pid) {
    if (this.targeted[pid] || this.selected[pid]) return;
    this.selected[pid] = true;
    this.addSelectLabel(pid);
    this.changed();
  },
  addSelectP: function (pid) {
    tracker.selectedP[pid] = true;
    this.getLabel(this.jqSelect, pid)
      .addClass('label-warning')
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
   * @param {number} pid
   */
  removeSelect: function(pid) {
    delete tracker.selected[pid];
    if (pid == this.hoverPid)
      this.setHoverPid(null);
    if (this.selectedP[pid])
      this.removeSelectP(pid);
    this.removeSelectLabel(pid);
    this.changed();
  },
  removeSelectP: function(pid) {
    delete tracker.selectedP[pid];
    this.getLabel(this.jqSelect, pid)
      .removeClass('label-warning')
      .addClass('label-default');
    this.changed();
  },
  removeTarget: function(pid) {
    delete tracker.targeted[pid];
    if (pid == this.hoverPid)
      this.setHoverPid(null);
    this.removeTargetLabel(pid);
    this.changed();
    // TODO(bowen): clean up target custom color?
  },

  /**
   * Toggle the select state
   * @param {number} pid
   */
  toggleSelect: function(pid) {
    if (!this.selected[pid])
      this.addSelect(pid);
    else
      this.removeSelect(pid);
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
    label.find('span:first').text(pid);
    label.find('.btn-label-close')
      .click(function() {
        tracker.removeSelect(pid);
      });
    label
      .click(function() {
        if (!tracker.selectedP[pid])
          tracker.addSelectP(pid);
        else
          tracker.removeSelectP(pid);
      })
      .mouseenter(function() {
        tracker.setHoverPid(pid);
      })
      .mouseleave(function() {
        tracker.setHoverPid(null);
      })
      .draggable({
        helper: 'clone'
      });
  },
  addTargetLabel: function (pid) {
    var tracker = this;
    var label = $('<div><span></span><span class="glyphicon glyphicon-remove btn-label-close"><span></div>')
      .attr('data-value', pid)
      .addClass('label label-danger label-target tracker-target')
      .appendTo(this.jqTarget);
    label.find('span:first').text(pid);
    label.find('.btn-label-close')
      .click(function() {
        tracker.removeTarget(pid);
      });

    label
      .mouseenter(function() {
        tracker.setHoverPid(pid);
      })
      .mouseleave(function() {
        tracker.setHoverPid(null);
      })
      .click(function () {
        // TODO(bowen): show group info
        tracker.showPidInfo(pid);
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
