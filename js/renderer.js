
'use strict';

var renderer = {
  /**
   * Render the given move data. All previous data is cleared.
   */
  renderMove: function(data) {
    var svg = d3.select('#svgMap'),
        jqSvg = $('#svgMap');

    var width = jqSvg.width(),
        height = jqSvg.height();
    var widthGrid = width / 100,
        heightGrid = height / 100;
    var xScale = d3.scale.linear()
          .domain([0, 99])
          .range([widthGrid / 2, width - widthGrid / 2]),
        yScale = d3.scale.linear()
          .domain([0, 99])
          .range([heightGrid / 2, width - heightGrid / 2]);

    console.log(data);
    for (var i = 0; i < data.length; i++) {

    }
  }
};
