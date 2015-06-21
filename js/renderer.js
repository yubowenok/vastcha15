
'use strict';

var renderer = {

  /** @enum */
  mouseModes: {
    NONE: 0,
    RANGE_SELECT: 1
  },

  /**
   * Rendering states
   */
  moveData: {},
  positionData: {},

  /**
   * Interaction states
   */
  mouseMode: 0, // mouseModes.NONE
  startPos: [0, 0],
  endPos: [0, 0],
  selectRange: [[0, 0], [0, 0]],

  /**
   * Compute the context of the rendering
   * upon initialization or screen resize.
   * @this {renderer}
   */
  context: function() {
    this.svgPath = d3.select('#svgMove #path');
    this.svgPeople = d3.select('#svgMove #people');
    this.jqView = $('#mapView');
    this.jqSvg = $('#svgMove');
    this.jqMap = $('#svgMove #parkMap');
    this.jqSelectRange = this.jqView.find('.select-range');

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

    this.mapInteraction();
  },


  /**
   * Setup map interaction.
   */
  mapInteraction: function() {
    var renderer = this;
    var mouseModes = this.mouseModes;
    var endHandler = function(event) {
      renderer.mouseMode = mouseModes.NONE;
      renderer.jqSelectRange.hide();
    };
    this.jqView
      .mousedown(function(event) {
        event.preventDefault();
        if (renderer.mouseMode == mouseModes.NONE) {
          renderer.mouseMode = mouseModes.RANGE_SELECT;
          renderer.startPos = utils.getOffset(event, $(this));
        }
      })
      .mousemove(function(event) {
        if (renderer.mouseMode != mouseModes.RANGE_SELECT) return;
        renderer.endPos = utils.getOffset(event, $(this));
        renderer.updateSelectRange();
      })
      .mouseleave(endHandler)
      .mouseup(endHandler);
  },


  /**
   * Update and render the current selection range.
   */
  updateSelectRange: function() {
    renderer.jqSelectRange.show();
    var xl = Math.min(this.startPos[0], this.endPos[0]),
        xr = Math.max(this.startPos[0], this.endPos[0]),
        yl = Math.min(this.startPos[1], this.endPos[1]),
        yr = Math.max(this.startPos[1], this.endPos[1]);
    this.selectRange = [[xl, xr], [yl, yr]];
    this.jqSelectRange
        .css({
          left: xl,
          top: yl,
          width: xr - xl,
          height: yr - yl
        });
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
   * Render the park map behind the scene.
   * @this {renderer}
   */
  renderParkMap: function() {
    this.jqMap.prependTo('#svgMove');
  },

  /**
   * Clear the move rendering.
   */
  clearMove: function() {
    this.svgPath.selectAll('*').remove();
  }
};
