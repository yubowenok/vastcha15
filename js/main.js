
'use strict';

// Area sequence visualization
var areavis;
// Facility sequence visualization
var facivis;

// Message volume chart (x2)
var volchart = [];


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
  VOLUME_DELTA: 30, // +/- 30 sec send/receive volume range

  serverAddr: 'http://localhost:3000/vastcha15',
  dayTimeRange: {
    Fri: [1402066816, 1402122395],
    Sat: [1402153208, 1402209324],
    Sun: [1402239611, 1402295113]
  },
  PLAY_TMSTEP: 0.1,
  PLAY_INTERVAL: 100,
  TIME_FORMAT: 'hh:mm:ss A',
  DATE_FORMAT: 'MMM D, YYYY',


  blockUpdates_: false,

  /** stores the state */
  day: 'Fri',
  timePoint: 0, //1402067816,
  timeRange: [], //[1402066816, 1402069816],
  timeRangeD: [], //[1402067316, 1402069316],
  /** Global settings */
  // TODO(bowen): Some of them can be moved to view controller
  settings: {
    playSpd: 1,
    msgLayout: 1,
    volumeSize: 1,
    filter: 0
  },
  /** State of key press */
  keys: {
    ctrl: false,
    shift: false
  },
  lastTick: 0,

  /** @enum {string} */
  AreaColors: {
    0: '#fff3ca', // Kiddle Land
    1: '#edeaf1', // Entry Corridor
    2: '#dbeef4', // Tundra Land
    3: '#c4d59f', // Wet Land
    4: '#d99591',  // Coaster Alley
    10: '#b2aa8d',
    11: '#a5a3a8',
    12: '#99a6aa',
    13: '#89956f',
    14: '#976865'
  },
  /**
   * Map an area code to its color.
   * @param  {string} areaId
   * @return {string} Color hex
   */
  getAreaColor: function(areaId) {
    return vastcha15.AreaColors[areaId];
  },
  getAreaName: function(areaId) {
    return meta.mapArea[areaId % meta.AREA_OFFSET];
  },

  /** @enum {string} */
  FacilityTypeColors: {
    'None': '#ffffff',
    'Thrill Rides': '#eb3434',
    'Kiddie Rides': '#eb8034',
    'Rides for Everyone': '#cceb34',
    'Food': '#34eb3a',
    'Restrooms': '#346eeb',
    'Beer Gardens': '#e8e40c',
    'Shopping': '#25c2c2',
    'Shows & Entertainment': '#7e25c2',
    'Information & Assistance': '#cccccc'
  },
  /**
   * Map a facility id to its color.
   * @param   {string}   faciId
   * @return  {string}   Color hex
   */
  getFacilityColor: function(faciId) {
    var type = meta.facilitiesList[faciId].type;
    return vastcha15.FacilityTypeColors[type];
  },
  /**
   * Map a facility id to its name.
   * @param {string} faciId
   * @return {string} Facility name
   */
  getFacilityName: function(faciId) {
    var faci = meta.facilitiesList[faciId];
    return faci.name + ' (' + faci.type + ')';
  },

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
   * Set or get the block update state
   * @param   {boolean|undefined} state
   *   State to be set. If not given, returns the current state
   * @returns {boolean}
   *   Current state
   */
  blockUpdates: function(state) {
    if (state == undefined) return this.blockUpdates_;
    this.blockUpdates_ = state;
    return state;
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
    msgvis.context();

    areavis = new SequenceVisualizer();
    areavis.context('Area Sequence', '#area-panel');
    areavis.setColors(this.getAreaColor);
    areavis.setInfo(this.getAreaName);

    facivis = new SequenceVisualizer();
    facivis.context('Facility Sequence', '#facility-panel');
    facivis.setColors(this.getFacilityColor);
    facivis.setInfo(this.getFacilityName);

    volchart[0] = new Chart();
    // setTypeNames, Goes before context
    volchart[0].setTypeNames(['send', 'receive', 'both'],
                         this.getAndRenderVolumeChart.bind(vastcha15, 0));
    volchart[0].context('Message Volume 0', '#volchart-panel-0');

    volchart[1] = new Chart();
    // setTypeNames, Goes before context
    volchart[1].setTypeNames(['send', 'receive', 'both'],
                         this.getAndRenderVolumeChart.bind(vastcha15, 1));
    volchart[1].context('Message Volume 1', '#volchart-panel-1');

    this.ui();
    this.tick();
  },

  /**
   * Prepare UI in the settings panel.
   * @this {vastcha15}
   */
  ui: function() {
    var vastcha15 = this;

    $('body')
      .keydown(function(event) {
          var w = event.which;
          if (w == utils.KeyCodes.CTRL) {
            vastcha15.keys.ctrl = true;
          } else if (w == utils.KeyCodes.SHIFT) {
            vastcha15.keys.shift = true;
          }
        })
      .keyup(function(event) {
          var w = event.which;
          if (w == utils.KeyCodes.CTRL) {
            vastcha15.keys.ctrl = false;
          } else if (w == utils.KeyCodes.SHIFT) {
            vastcha15.keys.shift = false;
          }
        })
      .mouseup(function(event) {
          // clean up the keypress
          vastcha15.keys.ctrl = false;
          vastcha15.keys.shift = false;
        });

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
      },
      stop: function(event, ui) {
        // Enforce time range update after slider stops.
        // Otherwise visualization may not be up-to-date.
        vastcha15.setTimePoint(ui.value);
      }
    });
    $('#timerange-slider-d').slider({
      range: true,
      slide: function(event, ui) {
        vastcha15.setTimeRangeD(ui.values);
      },
      stop: function(event, ui) {
        vastcha15.setTimeRangeD(ui.values, true);
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

    // TODO: check if we need colorpickers
    /*
    $('.colorpicker').colorpicker({
      showOn: 'both'
    });
    */

    // set initial range
    this.setDay(this.day);
  },


  /**
   * Get the pids resulting from the current filter type
   * @param {boolean} allowAll
   *   If the current filter is ALL, then
   *     If allowAll is set, this method returns null.
   *     Because null passed to server will result in queries
   *     over all pids.
   *     If allowAll is not set, this method returns the union
   *     of selects and targets.
   * @returns {string|null}
   */
  getFilteredPids: function(allowAll) {
    var pid;
    if (this.settings.filter == vastcha15.FilterTypes.SELECTS) {
      pid = tracker.getSelectsAndTargets();
    } else if (this.settings.filter == vastcha15.FilterTypes.TARGETS) {
      pid = tracker.getTargets();
    } else {
      if (!allowAll) pid = tracker.getSelectsAndTargets();
      else pid = null;
    }
    if (pid != null) pid = pid.join(',');
    return pid;
  },

  /**
   * Get and render the movement data
   * corresponding to the current timeRangeD
   * @this {vastcha15}
   */
  getAndRenderMoves: function() {
    if (!mapvis.showMove) return;
    var pid = this.getFilteredPids();
    this.queryMovements({ pid: pid }, function(data) {
      mapvis.setMoveData(data);
      mapvis.renderMoves();
    });
  },

  /**
   * Get and render the position data.
   * @param {number} t Timepoint for tmExact
   */
  getAndRenderPositions: function(t) {
    if (!mapvis.showPos) return;
    var pid = this.getFilteredPids(true);
    this.queryPositions({ pid: pid }, function(data) {
      mapvis.setPositionData(data);
      mapvis.renderPositions();
    });
  },

  /**
   * Get and render the area sequences.
   */
  getAndRenderAreaSequences: function() {
    if (!areavis.show) return;
    var pid = this.getFilteredPids();
    this.queryAreaSequences({ pid: pid }, function(data) {
      areavis.setSequenceData(data);
      areavis.renderSequences();
    });
  },

  /**
   * Get and render the facility sequences.
   */
  getAndRenderFaciSequences: function() {
    if (!facivis.show) return;
    var pid = this.getFilteredPids();
    this.queryFaciSequences({ pid: pid }, function(data) {
      facivis.setSequenceData(data);
      facivis.renderSequences();
    });
  },

  /**
   * Get and render the message volumes.
   */
  getAndRenderMessageVolumes: function() {
    if (!msgvis.show) return;
    var pid = this.getFilteredPids();
    var dir = msgvis.DirectionNames[msgvis.direction];
    this.queryMessageVolumes({
      pid: pid,
      direction: dir
    }, function(data) {
      msgvis.setVolumeData(data);
      msgvis.renderVolumes();
    });
    this.getAndRenderVolumeSizes();
  },

  /**
   * Get and render the send/receive message volumes in a graph.
   */
  getAndRenderVolumeSizes: function() {
    if (!msgvis.show || !msgvis.volSize) return;
    var pid = this.getFilteredPids(true);
    var dir = msgvis.VolSizeNames[msgvis.volSize];
    this.queryTimePointVolumes({
      pid: pid,
      direction: dir
    }, function(data) {
      msgvis.setSizeData(data);
      msgvis.renderVolumeSizes();
    });
  },

  /**
   * Get and render the message volumes in a line chart.
   */
  getAndRenderVolumeChart: function(chartId) {
    var chart = volchart[chartId];
    if (!chart.show) return;
    var pid = this.getFilteredPids();
    var dir = chart.TypeNames[chart.type];
    this.queryChartVolumes({
      pid: pid,
      direction: dir,
      numSeg: chart.svgSize[0]
    }, function(data) {
      chart.setChartData(data);
      chart.renderChart();
    });
  },

  /**
   * Update all visualizations.
   */
  update: function() {
    this.getAndRenderMoves();
    this.getAndRenderAreaSequences();
    this.getAndRenderFaciSequences();
    this.getAndRenderPositions(this.timePoint);
    this.getAndRenderMessageVolumes(); // Must go after getting positions
    this.getAndRenderVolumeChart(0);
    this.getAndRenderVolumeChart(1);
  },

  updateTimepoint: function() {
    this.getAndRenderPositions(this.timePoint);
    this.getAndRenderMessageVolumes(); // Must go after getting positions
    areavis.renderTimepoint();
    facivis.renderTimepoint();
    volchart[0].renderTimepoint();
    volchart[1].renderTimepoint();
  },

  /**
   * Propagate hover event
   */
  updateHover: function(pid) {
    mapvis.updateHover(pid);
    msgvis.updateHover(pid);
    areavis.updateHover(pid);
    facivis.updateHover(pid);
    volchart[0].updateHover(pid);
    volchart[1].updateHover(pid);
    tracker.updateHover(pid);
  },
  /**
   * Clear the hover for pid
   * @param {number} pid
   */
  clearHover: function(pid) {
    mapvis.clearHover(pid);
    msgvis.clearHover(pid);
    areavis.clearHover(pid);
    facivis.clearHover(pid);
    volchart[0].clearHover(pid);
    volchart[1].clearHover(pid);
    tracker.clearHover(pid);
  },

  /**
   * Specify a new day to load.
   * The current time range will be kept.
   * @this {vastcha15}
   */
  setDay: function(day) {
    this.blockUpdates(true);

    var range = this.dayTimeRange[day];
    this.day = day;
    $('#date').text(moment(range[0] * utils.MILLIS).format(this.DATE_FORMAT));
    $('#timerange-slider')
        .slider('option', 'min', range[0])
        .slider('option', 'max', range[1]);

    this.setTimeRangeD(range);
    this.setTimeRange(range);

    this.blockUpdates(false);
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
    $('#timepoint').text(moment(t * utils.MILLIS).format(this.TIME_FORMAT));
    $('#timepoint-slider').slider('option', 'value', t);

    if (!this.blockUpdates_ &&
        (!soft || this.tick() > this.MIN_QUERY_GAP)) {
      this.tick(true);
      this.updateTimepoint();
    }
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
    $('#time-start').text(moment(s * utils.MILLIS).format(this.TIME_FORMAT));
    $('#time-end').text(moment(t * utils.MILLIS).format(this.TIME_FORMAT));

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
  setTimeRangeD: function(range, soft) {
    var s = range[0], t = range[1];
    this.timeRangeD = range;
    $('#timerange-slider-d').slider('option', 'values', range);
    $('#time-start-d').text(moment(s * utils.MILLIS).format(this.TIME_FORMAT));
    $('#time-end-d').text(moment(t * utils.MILLIS).format(this.TIME_FORMAT));
    if (this.timePoint < s) this.setTimePoint(s);
    if (this.timePoint > t) this.setTimePoint(t);

    if (!this.blockUpdates_ &&
        (!soft || this.tick() > this.MIN_QUERY_GAP)) {
      this.tick(true);
      this.update();
    }
  },


  /**
   * Wrapper of queries
   * @param {params}   params   Parameters sent to the server
   * @param {Function} callback Callback function accepting data input
   * @param {string}   err      Error message
   */
  queryData: function(params, callback, err) {
    if (callback == undefined) {
      this.error(err, 'undefined callback');
      return;
    }
    var vastcha15 = this;
    for (var key in params) {
      if (params[key] == null) delete params[key];
    }
    $.get(this.serverAddr, params,
      function(data) {
        if (data == null)
          return vastcha15.error('null data returned from query');
        callback(data);
      }, 'jsonp')
      .fail(function() {
        vastcha15.error(err, JSON.stringify(params));
      });
  },

  /**
   * Get movement trajectories within given time range
   * Calls the callback function with the result data, or null on error
   * @param {function} callback
   */
  queryMovements: function(params, callback) {
    _(params).extend({
      queryType: 'timerange',
      dataType: 'move',
      tmStart: this.timeRangeD[0],
      tmEnd: this.timeRangeD[1],
      day: this.day
    });
    this.queryData(params, callback, 'queryMovements failed');
  },

  /**
   * Get the message volume sent within a time range.
   */
  queryMessageVolumes: function(params, callback) {
    _(params).extend({
      queryType: 'timerange',
      dataType: 'comm',
      tmStart: this.timeRangeD[0],
      tmEnd: this.timeRangeD[1],
      day: this.day
    });
    this.queryData(params, callback, 'queryMessageVolumes failed');
  },

  /**
   * Query the send volumes near timePoint for given pids.
   */
  queryTimePointVolumes: function(params, callback) {
    _(params).extend({
      queryType: 'rangevol',
      tmStart: this.timePoint - this.VOLUME_DELTA,
      tmEnd: this.timePoint + this.VOLUME_DELTA,
      day: this.day
    });
    this.queryData(params, callback, 'queryTimePointVolumes failed');
  },

  /**
   * Qeury the send volumes for the whole day.
   */
  queryChartVolumes: function(params, callback) {
    _(params).extend({
      queryType: 'rangevol',
      tmStart: this.dayTimeRange[this.day][0],
      tmEnd: this.dayTimeRange[this.day][1],
      day: this.day
    });
    this.queryData(params, callback, 'queryChartVolumes failed');
  },

  /**
   * Get people's positions at a given time point
   */
  queryPositions: function(params, callback) {
    _(params).extend({
      queryType: 'timeexact',
      dataType: 'move',
      tmExact: this.timePoint,
      day: this.day
    });
    this.queryData(params, callback, 'queryPositions failed');
  },


  /**
   * Get area sequences.
   */
  queryAreaSequences: function(params, callback) {
    _(params).extend({
      queryType: 'areaseq',
      day: this.day
    });
    this.queryData(params, callback, 'queryAreaSequences failed');
  },


  /**
   * Get facility sequences.
   */
  queryFaciSequences: function(params, callback) {
    _(params).extend({
      queryType: 'faciseq',
      day: this.day
    });
    this.queryData(params, callback, 'queryFaciSequences failed');
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
          vastcha15.PLAY_TMSTEP * vastcha15.settings.playSpd
        );
      }, this.PLAY_INTERVAL);
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
