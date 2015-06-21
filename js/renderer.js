
'use strict';

var renderer = {

  /**
   * Compute the context of the rendering
   * upon initialization or screen resize.
   * @this {renderer}
   */
  context: function() {
    this.svgPath = d3.select('#svgMove #path');
    this.svgPeople = d3.select('#svgMove #people');
    this.jqSvg = $('#svgMove');
    this.jqMap = $('#svgMove #parkMap');

    var width = this.jqSvg.width(),
        height = this.jqSvg.height();
    var widthGrid = width / 100,
        heightGrid = height / 100;
    this.xScale = d3.scale.linear()
        .domain([0, 99])
        .range([widthGrid / 2, width - widthGrid / 2]),
    // Screen y is reversed
    this.yScale = d3.scale.linear()
        .domain([0, 99])
        .range([height - heightGrid / 2, heightGrid / 2]);
  },

  /**
   * Convert Array<[time, #, eventType, x, y]>
   * to Map<#, Array<[time, eventType, x, y]>>
   * TODO(bowen): expect server to do this
   * @return {Object} Data grouped by pid
   */
  groupMoveByPid: function(data) {
    var result = {};
    for (var i = 0; i < data.length; i++) {
      var id = data[i][1],
          a = [data[i][0], data[i][2], data[i][3], data[i][4]];
      if (result[id] == undefined) {
        result[id] = [a];
      } else {
        result[id].push(a);
      }
    }
    return result;
  },


  /**
   * Render the given move data. All previous data is cleared.
   * @this {renderer}
   * @param {Array<[#, eventType, ]>} data
   */
  renderMove: function(data) {
    console.log('rendering', utils.size(data), 'moves');

    var svg = this.svgPath;
    // clear previous paths
    svg.selectAll('*').remove();

    var line = d3.svg.line().interpolate('linear');
    for (var id in data) {
      var points = [], as = data[id];
      for (var i = 0; i < as.length; i++) {
        points.push([this.xScale(as[i][2]), this.yScale(as[i][3])]);
      }
      var color = 'rgb(' + utils.randArray(3, [0, 255], true).join(',') + ')';
      svg.append('path')
          .attr('d', line(points))
          .style('stroke', color);
    }
  },

  /**
   * Render the positions of people at the current time point (exact).
   * @this {renderer}
   * @param {Object} data
   */
  renderPeople: function(data) {
    var svg = this.svgPeople;
    // clear previous people
    svg.selectAll('*').remove();

    for (var id in data) {
      var as = data[id];
      var x = this.xScale(as[0][2]),
          y = this.yScale(as[0][3]);
      svg.append('circle')
          .attr('r', 5)
          .attr('cx', x)
          .attr('cy', y);
    }
  },

  /**
   * Render the park map behind the scene
   * @this {renderer}
   */
  renderParkMap: function() {
    this.jqMap.prependTo('#svgMove');
  },

  clearMove: function() {
    this.svgPath.selectAll('*').remove();
  }
};
