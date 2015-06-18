
'use strict';

var vastcha15 = {

  /** @const */
  dayTimeRange: {
    Fri: [1402066816, 1402110727],
    Sat: [1402153208, 1402209324],
    Sun: [1402239611, 1402295113]
  },

  /** stores the state */
  day: 'Fri',
  timePoint: 1402066816,
  timeRange: [1402066816, 1402066816],
  /** currently loaded data */
  moveData: [],
  commData: [],

  /**
   * Vastcha15 entry function.
   * Called when the DOMs are ready
   */
  main: function() {
    this.getMeta();
    this.ui();
    $('.colorpicker').colorpicker({
      showOn: 'both'
    });
  },

  /**
   * Prepare UI in the settings panel
   */
  ui: function() {
    var vastcha15 = this;

    // prepare time sliders
    $('#timeRangeSlider').slider({
      min: this.dayTimeRange[this.day][0],
      max: this.dayTimeRange[this.day][1],
      range: true,
      slide: function(event, ui) {
        var s = ui.values[0],
            t = ui.values[1];
        var timeStart = moment(s * 1000).format('llll'),
            timeEnd = moment(t * 1000).format('llll');
        $('#timeStart').text(timeStart);
        $('#timeEnd').text(timeEnd);
        vastcha15.timeRange = [s, t];
      }
    });
    $('#timePointSlider').slider({
      min: this.dayTimeRange[this.day][0],
      max: this.dayTimeRange[this.day][1],
      slide: function(event, ui) {
        var t = ui.value;
        var time = moment(t * 1000).format('llll');
        $('#timePoint').text(time);
        vastcha15.timePoint = t;
        vastcha15.queryTimeRange({
          dataType: 'move',
          day: vastcha15.day,
          tmStart: t,
          tmEnd: t
        }, function(data) {
          if (data == null) return;
          vastcha15.moveData = data;
          renderer.renderMove(data);
        });
      }
    });

    // time range query is sent when this button is clicked
    $('#btnTimeRange').click(function() {
      vastcha15.queryTimeRange({
        dataType: 'move',
        day: vastcha15.day,
        tmStart: vastcha15.timeRange[0],
        tmEnd: vastcha15.timeRange[1]
      }, function(data) {
        if (data == null) return;
        vastcha15.moveData = data;
        renderer.renderMove(data);
      });
    });

    $('#checkTransMap').on('switchChange.bootstrapSwitch',
      function(event, state) {
        $('#parkMap').toggleClass('transparent');
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
      vastcha15.updateDay(day);
    });

    // map is resizable
    // TODO: how to avoid map overflowing the container?
    $('#mapView').resizable();
  },

  /**
   * Specify a new day to load.
   * The current time range will be kept.
   */
  updateDay: function(day) {
    var vastcha15 = this;
    this.day = day;
    queryTimeRange({
      dataType: 'both',
      day: vastcha15.day,
      tmStart: vastcha15.timeRange[0],
      tmEnd: vastcha15.timeRange[1]
    }, function(data) {
      vastcha15.moveData = data[0];
      vastcha15.commData = data[1];
    });
  },

  /**
   * Get all meta data
   */
  getMeta: function() {
    var vastcha15 = this;
    $.get('http://localhost:3000/vastcha15', {
        queryType: 'meta'
      }, function(data) {
        vastcha15.meta = data;
        console.log(data);
      }, 'jsonp')
      .fail(function() {
        vastcha15.error('getMeta failed');
      });
  },

  /**
   * Get all data within a given time range
   * Calls the callback function with the result data, or null on error
   * @param {Object} params
   *   dataType: "move" / "comm",
   *   day: "Fri" / "Sat" / "Sun",
   *   tmStart: start time
   *   tmEnd: end time
   */
  queryTimeRange: function(params, callback) {
    var vastcha15 = this;
    if (callback == null)
      this.error('undefined callback for queryTimeRange');

    params.queryType = 'timerange';
    $.get('http://localhost:3000/vastcha15', params,
      function(data) {
        callback(data);
      }, 'jsonp')
      .fail(function() {
        vastcha15.error('queryTimeRange failed:', JSON.stringify(params));
      });
  },

  /**
   * Display an error/warning message at the top of the page
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
