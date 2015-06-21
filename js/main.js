
'use strict';

var vastcha15 = {

  /** @const */
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
  timePoint: 1402067816,
  timeRange: [1402066816, 1402069816],
  timeRangeD: [1402067316, 1402069316],
  /** currently loaded data */
  moveData: [],
  posData: [],
  commData: [],
  settings: {
    transparentMap: false,
    showMove: false,
    playSpd: 1
  },

  /**
   * Vastcha15 entry function.
   * Called when the DOMs are ready
   * @this {vastcha15}
   */
  main: function() {
    this.getMeta();
    this.ui();
    renderer.context();
  },

  /**
   * Prepare UI in the settings panel
   * @this {vastcha15}
   */
  ui: function() {
    var vastcha15 = this;
    // prepare time sliders
    $('#timeRangeSlider').slider({
      min: this.dayTimeRange[this.day][0],
      max: this.dayTimeRange[this.day][1],
      range: true,
      slide: function(event, ui) {
        vastcha15.setTimeRange(ui.values);
      }
    });
    $('#timePointSlider').slider({
      slide: function(event, ui) {
        // prevent the slider from being dragged out of range
        if (!vastcha15.setTimePoint(ui.value))
          return false;
      }
    });
    $('#timeRangeSliderD').slider({
      range: true,
      slide: function(event, ui) {
        vastcha15.setTimeRangeD(ui.values);
      }
    });

    // Update movements rendering when clicked
    $('#btnUpdateMove').click(function() {
      vastcha15.getAndRenderMove();
    });

    // Play the movements (by updating timePoints)
    $('#btnPlayMove').click(function() {
      if ($(this).hasClass('glyphicon-play')) {
        vastcha15.playMove('start');
      } else {
        vastcha15.playMove('stop');
      }
    });

    // Time increment buttons
    $('#btnIncSec').click(function() {
      vastcha15.incrementTimePoint(1);
    });
    $('#btnIncMin').click(function() {
      vastcha15.incrementTimePoint(60);
    });
    $('#btnDecSec').click(function() {
      vastcha15.incrementTimePoint(-1);
    });
    $('#btnDecMin').click(function() {
      vastcha15.incrementTimePoint(-60);
    });

    // play speed
    $('#btnsPlaySpd button').click(function(event) {
      $(this).parent().children('button').removeClass('active');
      $(this).addClass('active');
      vastcha15.settings.playSpd = event.target.value;
    });

    $('#checkTransMap').on('switchChange.bootstrapSwitch',
        function(event, state) {
          vastcha15.settings.transparentMap = state;
          d3.select('#parkMap').classed('transparent', state);
        });
    $('#checkMove').on('switchChange.bootstrapSwitch',
        function(event, state) {
          vastcha15.settings.showMove = state;
          if (!state) {
            renderer.clearMove();
            $('#btnUpdateMove').attr('disabled', true);
          } else {
            vastcha15.getAndRenderMove();
            $('#btnUpdateMove').attr('disabled', false);
          }
        });

    // enable error/warning message dismiss
    $('.alert button').click(function() {
      $(this).parent().hide();
    });

    // bootstrap switches
    $('.to-bootstrapSwitch').bootstrapSwitch({
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
    this.setTimeRange(this.timeRange);
    this.setTimeRangeD(this.timeRangeD);
    this.setTimePoint(this.timePoint);
    this.setDay(this.day);
  },

  /**
   * Get and render the movement data
   * corresponding to the current timeRangeD
   * @this {vastcha15}
   */
  getAndRenderMove: function() {
    var vastcha15 = this;
    this.queryTimeRange({
      dataType: 'move',
      day: this.day,
      tmStart: this.timeRangeD[0],
      tmEnd: this.timeRangeD[1]
    }, function(data) {
      if (data == null) return;
      vastcha15.moveData = data;
      renderer.renderMoves(data);
    });
  },

  /**
   * Specify a new day to load.
   * The current time range will be kept.
   * @this {vastcha15}
   */
  setDay: function(day) {
    var range = this.dayTimeRange[day];
    this.day = day;
    $('#date').text(moment(range[0] * 1000).format(this.dateFormat));
    $('#timeRangeSlider')
        .slider('option', 'min', range[0])
        .slider('option', 'max', range[1]);
    this.setTimeRange(this.timeRange);
    this.setTimeRangeD(this.timeRangeD);
    this.setTimePoint(this.timePoint);
  },

  /**
   * Set timePoint to a given value and update the people's positions
   * @this {vastcha15}
   * @return {boolean} Whether the given time is out of timeRangeD
   */
  setTimePoint: function(t) {
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
    $('#timePoint').text(moment(t * 1000).format(this.timeFormat));
    $('#timePointSlider').slider('option', 'value', t);
    this.queryPositions({
      dataType: 'move',
      day: this.day,
      tmExact: t
    }, function(data) {
      if (data == null) return;
      vastcha15.posData = data;
      renderer.renderPositions(data);
    });
    return !outOfRange;
  },

  /**
   * Set timeRange to a given range and potentially update timeRangeD
   * @this {vastcha15}
   */
  setTimeRange: function(range) {
    var s = range[0], t = range[1];
    this.timeRange = range;
    $('#timeRangeSlider').slider('option', 'values', this.timeRange);
    $('#timeStart').text(moment(s * 1000).format(this.timeFormat));
    $('#timeEnd').text(moment(t * 1000).format(this.timeFormat));

    $('#timePointSlider').slider('option', 'min', s);
    $('#timePointSlider').slider('option', 'max', t);
    $('#timeRangeSliderD').slider('option', 'min', s);
    $('#timeRangeSliderD').slider('option', 'max', t);

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
    $('#timeRangeSliderD').slider('option', 'values', range);
    $('#timeStartD').text(moment(s * 1000).format(this.timeFormat));
    $('#timeEndD').text(moment(t * 1000).format(this.timeFormat));
    if (this.timePoint < s) this.setTimePoint(s);
    if (this.timePoint > t) this.setTimePoint(t);
  },

  /**
   * Get all meta data
   * @this {vastcha15}
   */
  getMeta: function() {
    var vastcha15 = this;
    $.get('http://localhost:3000/vastcha15', {
        queryType: 'meta'
      }, function(data) {
        vastcha15.meta = data;
      }, 'jsonp')
      .fail(function() {
        vastcha15.error('getMeta failed');
      });
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
   * @this {vastcha15}
   * @param {Object} params
   *    dataType: 'move'
   *    day: 'Fri' / 'Sat' / 'Sun'
   *    tmExact: time
   * @param {function} callback
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
      $('#btnPlayMove').removeClass('glyphicon-play')
          .addClass('glyphicon-pause');
      /** @private */
      this.movePlayTimer = setInterval(function() {
        vastcha15.incrementTimePoint(
          vastcha15.movePlayTimeStep * vastcha15.settings.playSpd
        );
      }, this.movePlayInterval);
    } else if (action == 'stop') {
      $('#btnPlayMove').removeClass('glyphicon-pause')
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
  }
};
