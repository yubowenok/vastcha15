
'use strict';

// Area sequence visualization
var areavis;
// Facility sequence visualization
var facivis;

// Message volume chart (x2)
var volchart = [];

// Speed chart and distance chart (speed chart x2)
var spdchart = [];

// Table for showing facility percentage
var facitable;

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

  MAX_QUERY_PER_SEC: 40,
  MIN_QUERY_GAP: 40, // FPS <= 25
  VOLUME_DELTA: 300, // +/- 5 min send/receive volume range

  serverAddr: 'http://localhost:3000/vastcha15',
  dayTimeRange: {
    Fri: [1402066816, 1402122395],
    Sat: [1402153208, 1402209324],
    Sun: [1402239611, 1402295113]
  },
  numPeople: {
    Fri: 3557,
    Sat: 6411,
    Sun: 7569
  },
  PLAY_TMSTEP: 0.1,
  PLAY_INTERVAL: 100,
  TIME_FORMAT: 'hh:mm:ss A',
  DATE_FORMAT: 'MMM D, YYYY',
  LABEL_LIST_HEIGHT_FULL: 300,


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
    volumeSize: 1,
    filter: 0,
    seltarFull: false,
  },
  /** State of key press */
  keys: {
    ctrl: false,
    shift: false
  },
  lastTick: 0,
  // The queue only keeps the last query for each type
  queryQueue: {
    timerange_move: null,
    timeexact: null,
    timerange_comm: null,
    areaseq: null,
    faciseq: null,
    rangevol: null,
    volseq: null,
    faciperc: null,
    facisimilar: null,
    speedseq: null,
    distseq: null
  },
  /** For query frequency estimation */
  queryDuration: 0, // time since the last estimation point
  queryCount: 0, // queries sent since the last estimation point

  /** Whether timeline is playing */
  playing: false,

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
    var name = meta.mapArea[areaId % meta.AREA_OFFSET];
    if (areaId >= meta.AREA_OFFSET) name += ' (Check-in)';
    return name;
  },

  /** @enum {string} */
  FacilityTypeColors: {
    'None': '#dddddd',
    'Thrill Rides': '#d62728',
    'Kiddie Rides': '#ff9896',
    'Rides for Everyone': '#ff7f0e',
    'Food': '#8ca252',
    'Restrooms': '#1f77b4',
    'Beer Gardens': '#e7ba52',
    'Shopping': '#c5b0d5',
    'Shows & Entertainment': '#9467bd',
    'Information & Assistance': '#7f7f7f'
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
  getFacilityTypeColor: function(type) {
    return vastcha15.FacilityTypeColors[type];
  },
  /**
   * Map a facility id to its name.
   * @param {string} faciId
   * @return {string} Facility name
   */
  getFacilityName: function(faciId) {
    var faci = meta.facilitiesList[faciId];
    if (faciId == 0) return 'None';
    return faci.id + ': ' + faci.name + ' (' + faci.type + ')';
  },

  /**
   * Compute time gap in milliseconds.
   * @param {boolean} set
   * @return {number}
   *   Return the gap between current time and last tick.
   *   If set is true, set last tick to current time.
   */
  tick: function(set) {
    var t = +(new Date());
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

    facitable = new Table();
    facitable.context('Facility Percentage', '#table-panel');
    facitable.setColors(this.getFacilityTypeColor);

    areavis = new SequenceVisualizer();
    areavis.context('Area Sequence', '#area-panel');
    areavis.setColors(this.getAreaColor);
    areavis.setInfo(this.getAreaName);
    areavis.setUpdate(
      this.getAndRenderAreaSequences.bind(this)
    );
    // Disabled by default, not as useful as facivis.
    areavis.setShow(false);

    facivis = new SequenceVisualizer();
    facivis.context('Facility Sequence', '#facility-panel');
    facivis.setColors(this.getFacilityColor);
    facivis.setInfo(this.getFacilityName);
    facivis.setUpdate(
      this.getAndRenderFaciSequences.bind(this)
    );

    var volchartTypes = [
      'send Segment', 'receive Segment', 'both Segment',
      'send Sequence', 'receive Sequence', 'both Sequence'
    ];
    volchart[0] = new Chart();
    // setTypeNames, Goes before context
    volchart[0].setTypeNames(volchartTypes);
    volchart[0].setUpdate(
      this.getAndRenderVolumeChart
    );
    volchart[0].context('Message Volume 0', '#volchart-panel-0');


    volchart[1] = new Chart();
    // setTypeNames, Goes before context
    volchart[1].setTypeNames(volchartTypes);
    volchart[1].setUpdate(
      this.getAndRenderVolumeChart
    );
    volchart[1].context('Message Volume 1', '#volchart-panel-1');

    var spdchartTypes = [ 'speed', 'distance' ];
    spdchart[0] = new Chart();
    spdchart[0].setTypeNames(spdchartTypes);
    spdchart[0].setUpdate(
      this.getAndRenderSpeedChart
    );
    spdchart[0].context('Speed Chart 0', '#spdchart-panel-0');
    spdchart[0].setUpdateOnZoom(false);

    spdchart[1] = new Chart();
    spdchart[1].setTypeNames(spdchartTypes);
    spdchart[1].setUpdate(
      this.getAndRenderSpeedChart
    );
    spdchart[1].context('Speed Chart 1', '#spdchart-panel-1');
    spdchart[1].setUpdateOnZoom(false);


    this.ui();

    // set initial range
    this.setDay(this.day);

    // Must go after setDay.
    // Otherwise chart does not have x domain / queryRange.
    volchart[1].setType(1);
    spdchart[1].setType(1);
  },

  /**
   * Prepare UI in the settings panel.
   * @this {vastcha15}
   */
  ui: function() {
    var vastcha15 = this;

    $('.flying').draggable();

    $('#seltar').click(function() {
      var state = !vastcha15.settings.seltarFull;
      vastcha15.settings.seltarFull = state;
      $(this).toggleClass('label-primary')
          .toggleClass('label-default');
      if (state == 0) {
        $('.label-list').css('height', '');
      } else {
        $('.label-list').css('height', vastcha15.LABEL_LIST_HEIGHT_FULL);
      }
    });

    $('body')
      .keydown(function(event) {
          var w = event.which;
          if (w == utils.KeyCodes.CTRL) {
            vastcha15.keys.ctrl = true;
          } else if (w == utils.KeyCodes.SHIFT) {
            vastcha15.keys.shift = true;
          } else if (utils.ArrowKeys[w]) {
            event.preventDefault();
            switch (w) {
              case utils.KeyCodes.LEFT:
                vastcha15.incrementTimePoint(-1);
                break;
              case utils.KeyCodes.RIGHT:
                vastcha15.incrementTimePoint(1);
                break;
              case utils.KeyCodes.UP:
                vastcha15.incrementTimePoint(-60);
                break;
              case utils.KeyCodes.DOWN:
                vastcha15.incrementTimePoint(60);
                break;
            }
          }
        })
      .keyup(function(event) {
          var w = event.which;
          if (w == utils.KeyCodes.CTRL) {
            vastcha15.keys.ctrl = false;
          } else if (w == utils.KeyCodes.SHIFT) {
            vastcha15.keys.shift = false;
          } else if (utils.ArrowKeys[w]) {
            event.preventDefault();
            switch (w) {
              case utils.KeyCodes.LEFT:
                vastcha15.incrementTimePoint(-1, true);
                break;
              case utils.KeyCodes.RIGHT:
                vastcha15.incrementTimePoint(1, true);
                break;
              case utils.KeyCodes.UP:
                vastcha15.incrementTimePoint(-60, true);
                break;
              case utils.KeyCodes.DOWN:
                vastcha15.incrementTimePoint(60, true);
                break;
            }
          }
        })
      .mouseup(function(event) {
          // clean up the keypress
          vastcha15.keys.ctrl = false;
          vastcha15.keys.shift = false;
        });

    $('.navbar-nav li a').click(function(event) {
      event.preventDefault();
      vastcha15.jumpToView($(this).attr('target'));
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
        // Prevent the slider from being dragged out of range.
        if (!vastcha15.setTimePoint(ui.value)) {
          return false;
        }
      },
      stop: function(event, ui) {
        // Enforce time range update after slider stops.
        // Otherwise visualization may not be up-to-date.
        vastcha15.setTimePoint(ui.value, true);
      }
    });
    $('#timerange-slider-d').slider({
      range: true,
      start: function(event, ui) {
        if (vastcha15.keys.ctrl) {
          vastcha15.sliderGap = ui.values[1] - ui.values[0];
        } else {
          vastcha15.sliderGap = null;
        }
      },
      slide: function(event, ui) {
        vastcha15.setTimeRangeD(ui.values);
      },
      stop: function(event, ui) {
        // Enforce time range update after slider stops.
        // Otherwise visualization may not be up-to-date.
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
      vastcha15.incrementTimePoint(1, true);
    });
    $('#btn-inc-min').click(function() {
      vastcha15.incrementTimePoint(60, true);
    });
    $('#btn-dec-sec').click(function() {
      vastcha15.incrementTimePoint(-1, true);
    });
    $('#btn-dec-min').click(function() {
      vastcha15.incrementTimePoint(-60, true);
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
      vastcha15.update(true);
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

    $(window).on('resize', function() {
      vastcha15.updateTimePointLabel_();
      vastcha15.updateTimeRangeDLabels_();
      vastcha15.updateTimeRangeLabels_();
      areavis.resize();
      facivis.resize();
      facitable.resize();
      volchart[0].resize();
      volchart[1].resize();
    });
  },

  /**
   * Jump to a view tag (by scrolling).
   * @param {string} tag
   */
  jumpToView: function(tag) {
    var marginTop = parseInt($('#main').css('margin-top'));
    var top = $(tag).offset().top - marginTop;
    $('body').scrollTop(top);
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
  getAndRenderMoves: function(enforced) {
    if (!mapvis.showMove) return;
    var params = {
      queryType: 'timerange_move',
      pid: this.getFilteredPids(),
      tmStart: this.timeRangeD[0],
      tmEnd: this.timeRangeD[1],
      day: this.day
    };
    var callback = function(data) {
      mapvis.setMoveData(data);
      mapvis.renderMoves();
    };
    this.queryData(params, callback, 'query moves failed', enforced);
  },

  /**
   * Get and render the position data.
   * @param {number} t Timepoint for tmExact
   */
  getAndRenderPositions: function(enforced) {
    if (!mapvis.showPos) return;
    var params = {
      queryType: 'timeexact',
      pid: this.getFilteredPids(true),
      tmExact: this.timePoint,
      day: this.day
    };
    var callback = function(data) {
      mapvis.setPositionData(data);
      mapvis.renderPositions();
    };
    this.queryData(params, callback, 'query positions failed', enforced);
  },

  /**
   * Get and render the area sequences.
   */
  getAndRenderAreaSequences: function(enforced) {
    if (!areavis.show) return;
    var params = {
      queryType: 'areaseq',
      pid: this.getFilteredPids(),
      day: this.day
    }
    var callback = function(data) {
      areavis.setSequenceData(data);
      areavis.renderSequences();
    };
    this.queryData(params, callback, 'query area sequences failed', enforced);
  },

  /**
   * Get and render the facility sequences.
   */
  getAndRenderFaciSequences: function(enforced) {
    if (!facivis.show) return;
    var params = {
      queryType: 'faciseq',
      pid: this.getFilteredPids(),
      day: this.day
    };
    var callback = function(data) {
      facivis.setSequenceData(data);
      facivis.renderSequences();
    };
    this.queryData(params, callback, 'query faci sequences failed', enforced);
  },

  getAndRenderFaciPercentages: function(enforced) {
    if (!facitable.show) return;
    var params = {
      queryType: 'faciperc',
      pid: this.getFilteredPids(),
      day: this.day
    };
    var callback = function(data) {
      facitable.setTableData(data);
      facitable.render();
    };
    this.queryData(params, callback, 'query faci percentages failed', enforced);
  },

  /**
   * Get and render the message volumes.
   */
  getAndRenderMessageVolumes: function(enforced) {
    if (!msgvis.show) return;
    var params = {
      queryType: 'timerange_comm',
      pid: this.getFilteredPids(),
      direction: msgvis.DirectionNames[msgvis.direction],
      tmStart: this.timeRangeD[0],
      tmEnd: this.timeRangeD[1],
      day: this.day
    };
    var callback = function(data) {
      msgvis.setVolumeData(data);
      msgvis.renderVolumes();
    };
    this.queryData(params, callback, 'query message volumes failed', enforced);
    this.getAndRenderVolumeSizes(enforced);
  },

  /**
   * Get and render the send/receive message volumes in a graph.
   */
  getAndRenderVolumeSizes: function(enforced) {
    if (!msgvis.show || !msgvis.volSize) return;
    var params = {
      queryType: 'rangevol',
      pid: this.getFilteredPids(true),
      direction: msgvis.VolSizeNames[msgvis.volSize],
      tmStart: this.timePoint - this.VOLUME_DELTA,
      tmEnd: this.timePoint + this.VOLUME_DELTA,
      day: this.day,
      numSeg: 1
    };
    var callback = function(data) {
      msgvis.setSizeData(data);
      msgvis.renderVolumeSizes();
    };
    this.queryData(params, callback, 'query volume sizes failed', enforced);
  },

  /**
   * Get and render the message volumes in a line chart.
   * @this {Chart} "this" is Chart when this function is called!
   * @param {boolean}  enforced
   */
  getAndRenderVolumeChart: function(enforced) {
    var type = this.TypeNames[this.type].split(' ');
    var params = {
      pid: vastcha15.getFilteredPids(),
      direction: type[0],
      tmStart: this.queryRange[0],
      tmEnd: this.queryRange[1],
      day: vastcha15.day
    };
    var chart = this;
    var callback = function(data) {
      chart.setChartData(data);
      chart.render();
    };
    if (type[1] == 'Segment') {
      params.queryType = 'rangevol';
      params.numSeg = this.svgSize[0];
    } else if (type[1] == 'Sequence') {
      params.queryType = 'volseq';
    }
    vastcha15.queryData(params, callback, 'query volume segments failed', enforced);
  },

  /**
   * Get and render the movement speed in a line chart
   * @this {Chart} "this" is Chart when this function is called!
   * @param {boolean}  enforced
   */
  getAndRenderSpeedChart: function(enforced) {
    var type = this.TypeNames[this.type];
    var params = {
      pid: vastcha15.getFilteredPids(),
      tmStart: this.queryRange[0],
      tmEnd: this.queryRange[1],
      day: vastcha15.day
    };
    var chart = this;
    var callback = function(data) {
      chart.setChartData(data);
      chart.render();
    };
    if (type == 'speed') {
      params.queryType = 'speedseq';
    } else if (type == 'distance') {
      params.queryType = 'distseq';
    }
    vastcha15.queryData(params, callback, 'query speed chart failed', enforced);
  },

  /**
   * Find those pids with similar faciliy percentages.
   * @param {number} pid
   */
  getFaciPercentageSimilar: function(pid) {
    var params = {
      queryType: 'facisimilar',
      pid: pid,
      day: this.day
    };
    var callback = function(data) {
      tracker.setSelects(data);
    };
    this.queryData(params, callback, 'query faci similar failed', true);
  },

  /**
   * Update responses.
   */
  update: function(enforced) {
    if (this.blockUpdates()) return;
    this.getAndRenderMoves(enforced);
    this.getAndRenderPositions(enforced);
    this.getAndRenderAreaSequences(enforced);
    this.getAndRenderFaciSequences(enforced);
    this.getAndRenderPositions(enforced);
    this.getAndRenderMessageVolumes(enforced); // Must go after getting positions
    this.getAndRenderFaciPercentages(enforced);
    volchart[0].update(enforced);
    volchart[1].update(enforced);
    spdchart[0].update(enforced);
    spdchart[1].update(enforced);
  },
  /**
   * Some views require special settings after day is changed.
   * - The volume charts need to get new X domains.
   */
  updateDay: function() {
    if (this.blockUpdates()) return;
    volchart[0].setXDomain(this.dayTimeRange[this.day]);
    volchart[1].setXDomain(this.dayTimeRange[this.day]);
    spdchart[0].setXDomain(this.dayTimeRange[this.day]);
    spdchart[1].setXDomain(this.dayTimeRange[this.day]);
  },
  updateRendering: function() {
    if (this.blockUpdates()) return;
    mapvis.render();
    msgvis.render();
    facitable.render();
    areavis.renderTargets();
    facivis.renderTargets();
    volchart[0].renderTargets();
    volchart[1].renderTargets();
    spdchart[0].renderTargets();
    spdchart[1].renderTargets();
  },
  updateTimeRangeD: function(enforced) {
    if (this.blockUpdates()) return;
    this.getAndRenderMoves(enforced);
    this.getAndRenderMessageVolumes(enforced);
    areavis.renderTimePoint();
    facivis.renderTimePoint();
    volchart[0].renderTimePoint();
    volchart[1].renderTimePoint();
  },
  updateTimePoint: function(enforced) {
    if (this.blockUpdates()) return;
    this.getAndRenderPositions(enforced);
    this.getAndRenderVolumeSizes(enforced);
    areavis.renderTimePoint();
    facivis.renderTimePoint();
    volchart[0].renderTimePoint();
    volchart[1].renderTimePoint();
  },

  /**
   * Propagate hover event
   */
  updateHover: function(pid) {
    mapvis.updateHover(pid);
    msgvis.updateHover(pid);
    areavis.updateHover(pid);
    facivis.updateHover(pid);
    facitable.updateHover(pid);
    volchart[0].updateHover(pid);
    volchart[1].updateHover(pid);
    spdchart[0].updateHover(pid);
    spdchart[1].updateHover(pid);
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
    facitable.clearHover(pid);
    volchart[0].clearHover(pid);
    volchart[1].clearHover(pid);
    spdchart[0].clearHover(pid);
    spdchart[1].clearHover(pid);
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
    $('#date')
      .text(moment(range[0] * utils.MILLIS)
            .format(this.DATE_FORMAT));
    $('#timerange-slider')
        .slider('option', 'min', range[0])
        .slider('option', 'max', range[1]);

    this.setTimeRangeD(range);
    this.setTimeRange(range);

    this.blockUpdates(false);
    this.updateDay();
    this.update(true);
  },

  /**
   * Update time labels when slided, or the window is resized.
   */
  updateTimePointLabel_: function() {
    var timepoint = $('#timepoint');
    var handle = $('#timepoint-slider .ui-slider-handle');
    var offset = handle.offset();
    offset.top -= $('body').scrollTop();
    offset.top += timepoint.height();
    offset.left -= timepoint.outerWidth() * 0.5 - handle.width() * 0.5;
    var t = this.timePoint;
    timepoint
      .text(moment(t * utils.MILLIS).format(this.TIME_FORMAT))
      .css(offset);
  },
  updateTimeRangeLabels_: function() {
    var handleStart = $('#timerange-slider .ui-slider-handle').first(),
        handleEnd = $('#timerange-slider .ui-slider-handle').last();
    var startOffset = handleStart.offset(),
        endOffset = handleEnd.offset();
    var timeStart = $('#time-start'),
        timeEnd = $('#time-end');
    var scrollTop = $('body').scrollTop();
    startOffset.top -= scrollTop;
    endOffset.top -= scrollTop;
    startOffset.left -= timeStart.outerWidth() + handleStart.width() * 0.5;
    endOffset.left += handleEnd.width() * 1.5;
    var s = this.timeRange[0],
        t = this.timeRange[1];
    timeStart
      .text(moment(s * utils.MILLIS).format(this.TIME_FORMAT))
      .css(startOffset);
    timeEnd
      .text(moment(t * utils.MILLIS).format(this.TIME_FORMAT))
      .css(endOffset);
  },
  updateTimeRangeDLabels_: function() {
    var handleStart = $('#timerange-slider-d .ui-slider-handle').first(),
        handleEnd = $('#timerange-slider-d .ui-slider-handle').last();
    var startOffset = handleStart.offset(),
        endOffset = handleEnd.offset();
    var timeStartD = $('#time-start-d'),
        timeEndD = $('#time-end-d');
    var scrollTop = $('body').scrollTop();
    startOffset.top -= scrollTop;
    endOffset.top -= scrollTop;
    startOffset.top += 3;
    startOffset.left -= timeStartD.outerWidth() + handleStart.width() * 0.5;
    endOffset.top += 3;
    endOffset.left += handleEnd.width() * 1.5;
    var s = this.timeRangeD[0],
        t = this.timeRangeD[1];
    timeStartD
      .text(moment(s * utils.MILLIS).format(this.TIME_FORMAT))
      .css(startOffset);
    timeEndD
      .text(moment(t * utils.MILLIS).format(this.TIME_FORMAT))
      .css(endOffset);
  },

  /**
   * Set timePoint to a given value and update the people's positions
   * @param {boolean} enforced
   * @return {boolean} Whether the given time is out of timeRangeD
   */
  setTimePoint: function(t, enforced) {
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
    $('#timepoint-slider').slider('option', 'value', t);

    this.updateTimePointLabel_();
    this.updateTimePoint(enforced);

    return !outOfRange;
  },

  /**
   * Set timeRange to a given range and potentially update timeRangeD
   * @this {vastcha15}
   */
  setTimeRange: function(range, enforced) {
    var s = range[0], t = range[1];
    this.timeRange = range;

    $('#timerange-slider').slider('option', 'values', this.timeRange);
    $('#timepoint-slider').slider('option', 'min', s);
    $('#timepoint-slider').slider('option', 'max', t);
    $('#timerange-slider-d').slider('option', 'min', s);
    $('#timerange-slider-d').slider('option', 'max', t);

    this.updateTimeRangeLabels_();
    // Also need to update timeRangeD and timePoint labels because its min/max has changed.
    this.updateTimeRangeDLabels_();
    this.updateTimePointLabel_();

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
      this.setTimeRangeD(this.timeRangeD, enforced);
    }
  },

  /**
   * Set timeRangeD to a given range and potentially update timePoint
   * @this {vastcha15}
   */
  setTimeRangeD: function(range, enforced) {
    var s = range[0], t = range[1];
    this.timeRangeD = range;
    $('#timerange-slider-d').slider('option', 'values', range);
    var changed = false;
    if (this.timePoint < s) this.setTimePoint(s, enforced);
    if (this.timePoint > t) this.setTimePoint(t, enforced);
    this.updateTimeRangeDLabels_();
    this.updateTimeRangeD(enforced);
  },

  /**
   * Execute a query and call the callback function with data.
   * @param   {Object}   query
   */
  executeQuery: function(query) {
    this.queryCount++;
    var duration = this.tick(true);
    this.queryDuration += duration;
    if (this.queryCount == 10) {
      var spd = this.queryCount / this.queryDuration * utils.MILLIS;
      if (spd > this.MAX_QUERY_PER_SEC) {
        //this.warning('Server overloading:', spd.toFixed(3), 'queries per second');
      }
      this.queryCount = 0;
      this.queryDuration = 0;
    }
    $.get(this.serverAddr, query.params,
      function(data) {
        if (data == null)
          return vastcha15.error('null data returned from query');
        query.callback(data);
      }, 'jsonp')
      .fail(function() {
        vastcha15.error(query.err, JSON.stringify(query.params));
      });
  },

  /**
   * Look at the query queue and process the latest query of each type
   */
  processQuery: function() {
    // Process all enforced queries immediately
    for (var type in this.queryQueue) {
      var query = this.queryQueue[type];
      if (query != null) {
        if (query.enforced) {
          this.executeQuery(query);
          this.queryQueue[type] = null;
        }
      }
    }
    if (this.tick() > this.MIN_QUERY_GAP) {
      for (var type in this.queryQueue) {
      var query = this.queryQueue[type];
        if (query != null) {
          this.executeQuery(query);
          this.queryQueue[type] = null;
        }
      }
      this.tick(true);
    }
  },

  /**
   * Wrapper of queries
   * @param {params}   params   Parameters sent to the server
   * @param {Function} callback Callback function accepting data input
   * @param {string}   err      Error message
   */
  queryData: function(params, callback, err, enforced) {
    if (callback == undefined) {
      this.error(err, 'undefined callback');
      return;
    }
    var vastcha15 = this;
    for (var key in params) {
      if (params[key] == null) delete params[key];
    }
    var lastQuery = this.queryQueue[params.queryType];
    if (lastQuery != null) {
      enforced |= lastQuery.enforced;
    }
    this.queryQueue[params.queryType] = {
      params: params,
      callback: callback,
      err: err,
      enforced: enforced
    };
    // Triggers query processing
    this.processQuery();
  },

  /**
   * Increment the time point by a fixed time step, used in movePlay
   * @this {vastcha15}
   */
  incrementTimePoint: function(step, enforced) {
    if (step == 0) {
      this.warning('Incrementing timePoint by zero');
      return;
    }
    var t = this.timePoint + step;
    if (t < this.timeRangeD[0] || t > this.timeRangeD[1]) {
      // play is over
      this.playMove('stop');
    }
    this.setTimePoint(t, enforced);
  },

  /**
   * Play or pause the movements
   * @this {vastcha15}
   * @param {string} action "start" or "stop"
   */
  playMove: function(action) {
    var vastcha15 = this;
    if (action == 'start') {
      if (this.playing) return;
      $('#btn-play-move').removeClass('glyphicon-play')
          .addClass('glyphicon-pause');
      /** @private */
      this.movePlayTimer = setInterval(function() {
        vastcha15.incrementTimePoint(
          vastcha15.PLAY_TMSTEP * vastcha15.settings.playSpd
        );
      }, this.PLAY_INTERVAL);
      this.playing = true;
    } else if (action == 'stop') {
      if (!this.playing) return;
      $('#btn-play-move').removeClass('glyphicon-pause')
          .addClass('glyphicon-play');
      clearInterval(this.movePlayTimer);
      // Make sure the final time point is up-to-date.
      this.setTimePoint(this.timePoint, true);
      this.playing = false;
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
