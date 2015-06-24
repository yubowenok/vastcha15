
'use strict';

var areavis = {
  /**
   * @const {string}
   */
  areaColors: [
    '#fff3ca', // Kiddle Land
    '#edeaf1', // Entry Corridor
    '#dbeef4', // Tundra Land
    '#c4d59f', // Wet Land
    '#d99591'  // Coaster Alley
  ],

  /**
   * Margins of plot area to the boundaries of the view
   * @const */
  margins: [
    [0, 0],
    [0, 20]
  ],

  /** Rendering states */
  zoom: null,
  zoomTranslate: [],
  zoomScale: 1.0,
  /**
   * Area sequence data
   */
  seqData: null,


  /**
   * Get the context of the area visualization view
   */
  context: function() {
    this.svg = d3.select('#svg-area > g');
    this.svgSeq = this.svg.select('#seq');
    this.jqView = $('#area-view');
    this.jqSvg = $('#svg-area');
    this.jqSeq = this.jqSvg.find('#seq');
    this.jqSelectRange = this.jqView.find('.select-range');

    var width = this.jqSvg.width(),
        height = this.jqSvg.height();
    this.xScale = d3.time.scale()
        .range([0, width]);
    // Screen y is reversed
    this.plotHeight = height - this.margins[1][1];
    this.yScale = d3.scale.linear()
        .range([0, this.plotHeight]);
    vastcha15.viewIcon(this.jqView, 'plus-sign', true);
  },


  /**
   * Set the area sequence data
   * @param {Array} data
   */
  setSequenceData: function(data) {
    this.seqData = data;

    var minTime = Infinity, maxTime = -Infinity;
    var index = 0;
    for (var pid in data) {
      var as = data[pid];
      for (var i = 0; i < as.length; i++) {
        var a = as[i];
        minTime = Math.min(minTime, a[0]);
        maxTime = Math.max(maxTime, a[0]);
      }
      as.index = index++; // assign an index
    }
    var height = this.jqSvg.height();
    this.xScale.domain([minTime * utils.MILLIS, maxTime * utils.MILLIS]);
    // not "index - 1", otherwise the last row has now height!
    this.yScale.domain([0, index]);
    this.interaction();
    vastcha15.viewIcon(this.jqView, 'plus-sign', false);
  },


  /**
   * Set up the interaction for area vis
   */
  interaction: function() {
    var areavis = this;
    var zoomHandler = function() {
      var translate = d3.event.translate,
          scale = d3.event.scale;
      var w = areavis.jqSvg.width(),
          h = areavis.jqSvg.height();
      translate[0] = Math.max(w * (1 - scale), translate[0]);
      translate[0] = Math.min(0, translate[0]);
      translate[1] = 0;

      areavis.zoomTranslate = translate;
      areavis.zoomScale = scale;

      areavis.zoom.translate(translate);
      areavis.svg.select('g').attr('transform',
        'translate(' + translate + ') ' +
        'scale(' + scale + ',1)'
      );
      areavis.svg.select('.seq-axis').call(areavis.axis);
    };
    this.zoom = d3.behavior.zoom()
      .scaleExtent([1, 1000])
      .on('zoom', zoomHandler);
    this.zoom.x(this.xScale);
    this.svg.call(this.zoom);
  },

  /**
   * Render the area sequences
   */
  renderSequences: function() {
    var data = this.seqData,
        svg = this.svgSeq;
    // clear previous rendering
    svg.selectAll('*').remove();

    var scale = this.zoomScale,
        translate = this.zoomTranslate;
    for (var pid in data) {
      var as = data[pid],
          index = as.index;
      var yl = this.yScale(index),
          yr = this.yScale(index + 1);
      var g = svg.append('g')
        .attr('transform', 'translate(0,' + yl + ')');
      for (var i = 0; i < as.length - 1; i++) {
        var xl = this.xScale(as[i][0] * utils.MILLIS),
            xr = this.xScale(as[i + 1][0] * utils.MILLIS),
            color = this.areaColors[as[i][1]];
        var r = g.append('rect')
          .attr('x', xl)
          .attr('width', xr - xl)
          .attr('height', yr - yl)
          .style('fill', color);
      }
    }
    this.renderAxis();
  },

  /**
   * Render the time axis
   */
  renderAxis: function() {
    var svg = this.svg;
    // clear previous axis
    svg.select('.seq-axis').remove();

    this.axis = d3.svg.axis()
      .scale(this.xScale);
    var g = svg.append("g")
      .classed("seq-axis", true)
      .attr('transform', 'translate(0,' + this.plotHeight + ')')
      .call(this.axis);
  }


};
