
var vastcha15 = {

  /** @const */
  dayTimeRange: {
    Fri: [1402066816, 1402110727],
    Sat: [1402153208, 1402209324],
    Sun: [1402239611, 1402295113]
  },

  /** stores the state */
  day: "Fri",

  main: function() {
    this.ui();
    $(".colorpicker").colorpicker({
      showOn: "both"
    });
  },

  ui: function() {
    $("#timeRangeSlider").slider({
      min: this.dayTimeRange[this.day][0],
      max: this.dayTimeRange[this.day][1],
      range: true,
      slide: function(event, ui) {
        var timeStart = moment(ui.values[0] * 1000).format('llll'),
            timeEnd = moment(ui.values[1] * 1000).format('llll');
        $('#timeStart').text(timeStart);
        $('#timeEnd').text(timeEnd);
      }
    });
    $("#timePointSlider").slider({
      min: this.dayTimeRange[this.day][0],
      max: this.dayTimeRange[this.day][1],
      slide: function(event, ui) {
        var time = moment(ui.value * 1000).format('llll');
        $('#timePoint').text(time);
      }
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
    $.get("http://localhost:3000/vastcha15", params,
      function(data) {
        callback(data);
      }, "jsonp").fail(function(){
        console.error("queryTimeRange failed:", params);
        callback(null);
      });
  }
};
