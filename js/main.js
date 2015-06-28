
'use strict';



var vastcha15 = {
  /** @enum {number} */
  FilterTypes: {
    ALL: 0,
    SELECTS: 1,
    TARGETS: 2
  },
  /** @const */
  filterNames: [
    'All',
    'Selects',
    'Targets'
  ],
  MIN_QUERY_GAP: 40, // FPS <= 25
  serverAddr: 'http://localhost:3000/vastcha15',
  dayTimeRange: {
    Fri: [1402066816, 1402110727],
    Sat: [1402153208, 1402209324],
    Sun: [1402239611, 1402295113]
  },
  movePlayTimeStep: 0.1,
  movePlayInterval: 100,
  timeFormat: 'hh:mm:ss A',
  dateFormat: 'MMM D, YYYY',

  /** stores the state */
  day: 'Fri',
  timePoint: 0, //1402067816,
  timeRange: [], //[1402066816, 1402069816],
  timeRangeD: [], //[1402067316, 1402069316],
  settings: {
    transparentMap: false,
    showFacilities: false,
    showMove: false,
    showMapId: false,
    playSpd: 1,
    filter: 0
  },
  lastTick: 0,

  /**
   * Compute time gap in milliseconds.
   * @param {boolean} set
   * @return {number}
   *   Return the gap between current time and last tick.
   *   If set is true, set last tick to current time.
   */
  tick: function(set) {
    var m = moment();
    var t = utils.MILLIS * m.unix() + m.milliseconds();
    var lastt = this.lastTick;
    if (set) this.lastTick = t;
    return t - lastt;
  },

  /**
   * Vastcha15 entry function.
   * Called when the DOMs are ready
   * @this {vastcha15}
   */
  main: function() {
    meta.getData();
    mapvis.context();
    tracker.context();
    areavis.context();
    this.ui();
    this.viewIcon($('#comm-view'), 'ban-circle', true);
    this.tick();
  },

  /**
   * Prepare UI in the settings panel.
   * @this {vastcha15}
   */
  ui: function() {
    var vastcha15 = this;

    // Prepare time sliders
    $('#timerange-slider').slider({
      min: this.dayTimeRange[this.day][0],
      max: this.dayTimeRange[this.day][1],
      range: true,
      slide: function(event, ui) {
        vastcha15.setTimeRange(ui.values);
      }
    });
    $('#timepoint-slider').slider({
      slide: function(event, ui) {
        vastcha15.playMove('stop');
        // Prevent the slider from being dragged out of range
        // Set the timepoint softly to avoid overloading queries.
        if (!vastcha15.setTimePoint(ui.value, true))
          return false;
      }
    });
    $('#timerange-slider-d').slider({
      range: true,
      slide: function(event, ui) {
        vastcha15.setTimeRangeD(ui.values);
      }
    });
    $('#timerange-slider-d .ui-slider-range').click(function(event, ui) {
      return false;
    });

    // Update movements rendering when clicked
    $('#btn-update-move').click(function() {
      vastcha15.getAndRenderMoves();
    });

    // Play the movements (by updating timePoints)
    $('#btn-play-move').click(function() {
      if ($(this).hasClass('glyphicon-play')) {
        vastcha15.playMove('start');
      } else {
        vastcha15.playMove('stop');
      }
    });

    // Time increment buttons
    $('#btn-inc-sec').click(function() {
      vastcha15.incrementTimePoint(1);
    });
    $('#btn-inc-min').click(function() {
      vastcha15.incrementTimePoint(60);
    });
    $('#btn-dec-sec').click(function() {
      vastcha15.incrementTimePoint(-1);
    });
    $('#btn-dec-min').click(function() {
      vastcha15.incrementTimePoint(-60);
    });

    // play speed
    $('#btns-play-spd button').click(function(event) {
      $(this).parent().children('button').removeClass('active');
      $(this).addClass('active');
      vastcha15.settings.playSpd = event.target.value;
    });

    $('#check-trans-map').click(function(event) {
      var state = !vastcha15.settings.transparentMap;
      vastcha15.settings.transparentMap = state;
      if (!state) {
        $(this).removeClass('label-primary');
      } else {
        $(this).addClass('label-primary');
      }
      d3.select('#parkmap').classed('transparent', state);
    });
    $('#check-move').click(function(event) {
      var state = !vastcha15.settings.showMove;
      vastcha15.settings.showMove = state;
      if (!state) {
        mapvis.clearMove();
        $(this).removeClass('label-primary');
      } else {
        vastcha15.getAndRenderMoves();
        $(this).addClass('label-primary');
      }
    });
    $('#check-mapid').click(function(event) {
      var state = !vastcha15.settings.showMapId;
      vastcha15.settings.showMapId = state;
      if (!state) {
        mapvis.clearLabels();
        $(this).removeClass('label-primary');
      } else {
        mapvis.renderLabels();
        $(this).addClass('label-primary');
      }
    });
    $('#check-facility').click(function(event) {
      var state = !vastcha15.settings.showFacilities;
      vastcha15.settings.showFacilities = state;
      if (!state) {
        mapvis.clearFacilities();
        $(this).removeClass('label-primary');
      } else {
        mapvis.renderFacilities();
        $(this).addClass('label-primary');
      }
    });
    $('#filter').click(function(event) {
      var state = vastcha15.settings.filter + 1;
      if (state == utils.size(vastcha15.FilterTypes)) state = 0;
      vastcha15.settings.filter = state;
      $(this).text(vastcha15.filterNames[state]);
      vastcha15.update();
    });

    // enable error/warning message dismiss
    $('.alert button').click(function() {
      $(this).parent().hide();
    });

    // bootstrap switches
    $('.to-bootstrap-switch').bootstrapSwitch({
      size: 'mini'
    });

    $('input[name=dayGroup]').change(function(event) {
      var day = event.target.value;
      vastcha15.setDay(day);
    });

    // TODO: enable colorpicker on demand
    $('.colorpicker').colorpicker({
      showOn: 'both'
    });

    // map is resizable
    // TODO: how to avoid map overflowing the container?
    // $('#mapView').resizable();

    // set initial range
    this.setDay(this.day);
    /*
    this.setTimeRange(this.timeRange);
    this.setTimeRangeD(this.timeRangeD);
    this.setTimePoint(this.timePoint);
    */
  },


  /**
   * Get the pids resulting from the current filter type
   * @returns {Array<number>|null}
   */
  getFilteredPids: function() {
    var pid = null;
    if (this.settings.filter == vastcha15.FilterTypes.SELECTS) {
      pid = tracker.getSelectsAndTargets();
    } else if (this.settings.filter == vastcha15.FilterTypes.TARGETS) {
      pid = tracker.getTargets();
    }
    return pid;
  },

  /**
   * Get and render the movement data
   * corresponding to the current timeRangeD
   * @this {vastcha15}
   */
  getAndRenderMoves: function() {
    if (!this.settings.showMove) return;
    var vastcha15 = this;
    var params = {
      dataType: 'move',
      day: this.day,
      tmStart: this.timeRangeD[0],
      tmEnd: this.timeRangeD[1]
    };
    var pid = this.getFilteredPids();
    if (pid != null) params.pid = pid.join(',');
    this.queryTimeRange(params, function(data) {
      if (data == null) return;
      mapvis.setMoveData(data);
      mapvis.renderMoves();
    });
  },

  /**
   * Get and render the position data
   * @param {number} t Timepoint for tmExact
   */
  getAndRenderPositions: function(t) {
    var params = {
      dataType: 'move',
      day: this.day,
      tmExact: t
    };
    var pid = this.getFilteredPids();
    if (pid != null) params.pid = pid.join(',');
    this.queryPositions(params, function(data) {
      if (data == null) return;
      mapvis.setPositionData(data);
      mapvis.renderPositions();
    });
  },

  /**
   * Get and render the area sequence data
   */
  getAndRenderSequences: function() {
    var params = {
      day: this.day
    };
    var pid = this.getFilteredPids();
    if (pid == null) pid = tracker.getSelectsAndTargets();
    if (pid != null) params.pid = pid.join(',');
    vastcha15.queryAreaSequences(params, function(data) {
      if (data == null) return;
      areavis.setSequenceData(data);
      areavis.renderSequences();
    });
  },


  /**
   * Update all visualizations
   */
  update: function() {
    this.getAndRenderMoves();
    this.getAndRenderSequences();
    this.getAndRenderPositions(this.timePoint);
  },
  updateHover: function(pid) {
    mapvis.updateHover(pid);
    areavis.updateHover(pid);
    tracker.updateHover(pid);
  },
  /**
   * Clear the hover for pid
   * @param {number} pid
   */
  clearHover: function(pid) {
    mapvis.clearHover(pid);
    areavis.clearHover(pid);
    tracker.clearHover(pid);
  },

  /**
   * Specify a new day to load.
   * The current time range will be kept.
   * @this {vastcha15}
   */
  setDay: function(day) {
    var range = this.dayTimeRange[day];
    this.day = day;
    $('#date').text(moment(range[0] * utils.MILLIS).format(this.dateFormat));
    $('#timerange-slider')
        .slider('option', 'min', range[0])
        .slider('option', 'max', range[1]);

    this.setTimeRangeD(range);
    this.setTimeRange(range);

    this.update();
  },

  /**
   * Set timePoint to a given value and update the people's positions
   * @param {boolean} soft
   * @return {boolean} Whether the given time is out of timeRangeD
   */
  setTimePoint: function(t, soft) {
    var outOfRange = false;
    if (t < this.timeRangeD[0]) {
      t = this.timeRangeD[0];
      outOfRange = true;
    }
    if (t > this.timeRangeD[1]) {
      t = this.timeRangeD[1];
      outOfRange = true;
    }
    this.timePoint = t;
    $('#timepoint').text(moment(t * utils.MILLIS).format(this.timeFormat));
    $('#timepoint-slider').slider('option', 'value', t);

    if (!soft || this.tick() > this.MIN_QUERY_GAP) {
      this.tick(true);
      this.getAndRenderPositions(t);
    }
    areavis.renderTimepoint();
    return !outOfRange;
  },

  /**
   * Set timeRange to a given range and potentially update timeRangeD
   * @this {vastcha15}
   */
  setTimeRange: function(range) {
    var s = range[0], t = range[1];
    this.timeRange = range;
    $('#timerange-slider').slider('option', 'values', this.timeRange);
    $('#time-start').text(moment(s * utils.MILLIS).format(this.timeFormat));
    $('#time-end').text(moment(t * utils.MILLIS).format(this.timeFormat));

    $('#timepoint-slider').slider('option', 'min', s);
    $('#timepoint-slider').slider('option', 'max', t);
    $('#timerange-slider-d').slider('option', 'min', s);
    $('#timerange-slider-d').slider('option', 'max', t);

    var changed = false;
    if (s > this.timeRangeD[0]) {
      this.timeRangeD[0] = s;
      if (this.timeRangeD[1] < s) this.timeRangeD[1] = s;
      changed = true;
    }
    if (t < this.timeRangeD[1]) {
      this.timeRangeD[1] = t;
      if (this.timeRangeD[0] > t) this.timeRangeD[0] = t;
      changed = true;
    }
    if (changed) {
      this.setTimeRangeD(this.timeRangeD);
    }
  },

  /**
   * Set timeRangeD to a given range and potentially update timePoint
   * @this {vastcha15}
   */
  setTimeRangeD: function(range) {
    var s = range[0], t = range[1];
    this.timeRangeD = range;
    $('#timerange-slider-d').slider('option', 'values', range);
    $('#time-start-d').text(moment(s * utils.MILLIS).format(this.timeFormat));
    $('#time-end-d').text(moment(t * utils.MILLIS).format(this.timeFormat));
    if (this.timePoint < s) this.setTimePoint(s);
    if (this.timePoint > t) this.setTimePoint(t);
  },


  /**
   * Get all data within a given time range
   * Calls the callback function with the result data, or null on error
   * @this {vastcha15}
   * @param {Object} params
   *    dataType: 'move' / 'comm'
   *    day: 'Fri' / 'Sat' / 'Sun'
   *    tmStart: start time
   *    tmEnd: end time
   * @param {function} callback
   */
  queryTimeRange: function(params, callback) {
    var vastcha15 = this;
    if (callback == null)
      this.error('undefined callback for queryTimeRange');

    params.queryType = 'timerange';
    $.get(this.serverAddr, params,
      function(data) {
        callback(data);
      }, 'jsonp')
      .fail(function() {
        vastcha15.error('queryTimeRange failed:', JSON.stringify(params));
      });
  },

  /**
   * Get people's positions at a given time point
   * @param {{
   *   dataType: string, 'move'
   *   day: string, 'Fri' / 'Sat' / 'Sun'
   *   tmExact: time,
   * }} params
   * @param {Function} callback
   */
  queryPositions: function(params, callback) {
    var vastcha15 = this;
    if (callback == null)
      this.error('undefined callback for queryPositions');

    params.queryType = 'timeexact';
    $.get(this.serverAddr, params,
      function(data) {
        callback(data);
      }, 'jsonp')
      .fail(function() {
        vastcha15.error('queryPositions failed:', JSON.stringify(params));
      });
  },


  /**
   * Get area sequences
   * @param {Object} params
   * @param {Function} callback
   */
  queryAreaSequences: function(params, callback) {
    var vastcha15 = this;
    if (callback == null)
      this.error('undefined callback for queryAreaSequences');

    params.queryType = 'areaseq';
    this.viewIcon(areavis.jqView, 'hourglass', true);
    $.get(this.serverAddr, params,
      function(data) {
        callback(data);
        vastcha15.viewIcon(areavis.jqView, 'hourglass', false);
      }, 'jsonp')
      .fail(function() {
        vastcha15.error('queryAreaSequences failed:', JSON.stringify(params));
      });
  },


  /**
   * Increment the time point by a fixed time step, used in movePlay
   * @this {vastcha15}
   */
  incrementTimePoint: function(step) {
    if (step == 0) {
      this.warning('Incrementing timePoint by zero');
      return;
    }
    var t = this.timePoint + step;
    if (t < this.timeRangeD[0] || t > this.timeRangeD[1]) {
      // play is over
      this.playMove('stop');
    }
    this.setTimePoint(t);
  },

  /**
   * Play or pause the movements
   * @this {vastcha15}
   * @param {string} action "start" or "stop"
   */
  playMove: function(action) {
    var vastcha15 = this;
    if (action == 'start') {
      $('#btn-play-move').removeClass('glyphicon-play')
          .addClass('glyphicon-pause');
      /** @private */
      this.movePlayTimer = setInterval(function() {
        vastcha15.incrementTimePoint(
          vastcha15.movePlayTimeStep * vastcha15.settings.playSpd
        );
      }, this.movePlayInterval);
    } else if (action == 'stop') {
      $('#btn-play-move').removeClass('glyphicon-pause')
          .addClass('glyphicon-play');
      clearInterval(this.movePlayTimer);
    } else {
      this.error('Unknown playMove action', action);
    }
  },

  /**
   * Display an error/warning message at the top of the page
   * @this {vastcha15}
   * @param {string} msg1 , msg2 ...
   */
  warning: function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    console.warn(msg);
    $('#warning').text(msg);
    $('#warning').parent().show();
  },
  error: function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    console.error(msg);
    $('#error').text(msg);
    $('#error').parent().show();
  },

  /**
   * Load a view with icon (e.g. for loading)
   * @param {jQuery} jqView
   * @param {string} icon Bootstrap icon name (withou prefix)
   * @param {boolean} state
   */
  viewIcon: function(jqView, icon, state) {
    var cls = 'view-icon glyphicon glyphicon-' + icon;
    if (state == true) {
      jqView.children().hide();
      jqView
        .addClass(cls)
        .css('line-height', jqView.height() + 'px');
    } else if (state == false) {
      jqView
        .removeClass(cls)
        .css('line-height', '');
      jqView.children().show();
    }
  }
};
