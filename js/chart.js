
'use strict';

/**
 * Chart for plotting line charts.
 * @constructor
 */
var Chart = function() {
  /** Margins of plot are to the view boundaries
   * @const */
  this.margins = [
    [40, 0],
    [20, 0]
  ];

  /** Rendering states */
  this.zoom = null;
  this.zoomTranslate = [0, 0];
  this.zoomScale = 1.0;

  /** On/Off state of the view */
  this.show = true;

  /** Data
   * @type {Object<number, Array>}
   *   { pid: [[x0, y0], [x1, y1], ...], ... }
   */
  this.chartData;
};


/**
 * Setup the context for the chart.
 */
Chart.prototype.context = function(title, panelTag, svgTag) {
  var viewTag = panelTag + ' .panel-body';
  this.svg = d3.select(svgTag + ' > g');
  this.svgChart = this.svg.select('.chart');
  this.jqHeader = $(panelTag).find('.panel-heading');
  this.jqView = $(viewTag);
  this.jqSvg = $(svgTag);
  this.jqSeq = this.jqSvg.find('.chart');
  this.jqSelectRange = this.jqView.find('.select-range');

  var width = this.jqSvg.width(),
      height = this.jqSvg.height();
  this.svgSize = [width, height];
  this.xScale = d3.time.scale()
      .range([this.margins[0][0], width]);
  // Screen y is reversed
  this.plotHeight = height - this.margins[1][0];
  this.yScale = d3.scale.linear()
      .range([this.plotHeight, 0]);

  $('<span></span>').text(title)
    .appendTo(this.jqHeader);

  this.btnShow = $('<div></div>')
    .addClass('label btn-label btn-right')
    .attr('data-toggle', 'tooltip')
    .appendTo(this.jqHeader);

  var chart = this;
  this.btnShow
    .addClass(this.show ? 'label-primary' : 'label-default')
    .text(this.show ? 'On' : 'Off')
    .click(function(event) {
      chart.show = !chart.show;
      if (chart.show) {
        $(this).addClass('label-primary')
          .removeClass('label-default')
          .text('On');
      } else {
        $(this).removeClass('label-primary')
          .addClass('label-default')
          .text('Off');
      }
    });
};


/**
 * Set the data and compute the scales.
 * @param {Object<number,Array>} data See above definition.
 */
Chart.prototype.setChartData = function(data) {
  this.chartData = data;

  var minTime = Infinity, maxTime = -Infinity;
  var minVal = Infinity, maxVal = -Infinity;
  for (var pid in data) {
    var l = data[pid];
    for (var i = 0; i < l.length; i++) {
      var p = l[i];
      minTime = Math.min(minTime, p[0]);
      maxTime = Math.max(maxTime, p[0]);
      minVal = Math.min(minVal, p[2]);
      maxVal = Math.max(maxVal, p[2]);
    }
  }
  // Have 5% vertical margins.
  var spanVal = maxVal - minVal;
  //minVal -= spanVal * 0.05; // uncomment to NOT touch base
  maxVal += spanVal * 0.05;

  var height = this.jqSvg.height();
  if (minTime != Infinity) {
    this.xScale.domain([minTime * utils.MILLIS, maxTime * utils.MILLIS]);
    // not "index - 1", otherwise the last row has now height!
    this.yScale.domain([minVal, maxVal]);
  }
  this.interaction();
};


/**
 * Setup interaction for chart.
 */
Chart.prototype.interaction = function() {
  var chart  = this;
  var zoomHandler = function() {
    var translate = d3.event.translate,
        scale = d3.event.scale;
    var w = chart.jqSvg.width(),
        h = chart.jqSvg.height();
    translate[0] = Math.max(w * (1 - scale), translate[0]);
    translate[0] = Math.min(0, translate[0]);
    translate[1] = 0;

    chart.zoomTranslate = translate;
    chart.zoomScale = scale;

    chart.zoom.translate(translate);

    chart.svg.select('g').attr('transform',
        'translate(' + translate + ') ' +
        'scale(' + scale + ',1)'
    );
    chart.svg.select('.chart-axis').call(chart.axis);
    // Make line width consistent.
    chart.svgChart.selectAll('path')
      .style('stroke-width', 1.0 / scale);
  };
  this.zoom = d3.behavior.zoom()
    .scaleExtent([1, 1000])
    .on('zoom', zoomHandler);
  this.zoom.x(this.xScale);
  this.svg.call(this.zoom);
};



/** Highlight / unhighlight hovered element. */
Chart.prototype.updateHover = function(pid) {
  this.svgChart.select('#l' + pid)
    .classed('chart-hover', true)
    .style('stroke-width', 3.0 / this.zoomScale);
};
Chart.prototype.clearHover = function(pid) {
  this.svgChart.select('#l' + pid)
    .classed('chart-hover', false)
    .style('stroke-width', 1.5 / this.zoomScale);
};

/** Wrapper */
Chart.prototype.render = function() {
  this.renderChart();
  this.renderAxis();
  this.renderTimepoint();
};


/** Render the chart. */
Chart.prototype.renderChart = function() {
  var data = this.chartData,
      svg = this.svgChart;
  // clear previous rendering
  svg.selectAll('*').remove();

  var scale = this.zoomScale,
      translate = this.zoomTranslate;

  var line = d3.svg.line().interpolate('linear');
  for (var pid in data) {
    var l = data[pid];
    var points = [];
    for (var i = 0; i < l.length; i++) {
      points.push([
        this.xScale(l[i][0] * utils.MILLIS),
        this.yScale(l[i][2])
        ]);
    }
    var e = svg.append('path')
      .attr('d', line(points))
      .attr('id', 'l' + pid)
      .style('stroke-width', 1 / this.zoomScale);

    e.on('mouseover', function() {
        var id = d3.event.target.id.substr(1);
        tracker.setHoverPid(id);
      })
      .on('mouseout', function() {
        tracker.setHoverPid(null);
      })
  }
  this.renderAxis();
  this.renderTimepoint();
};

/**
 * Render the current time point
 */
Chart.prototype.renderTimepoint = function() {
  // clear previous
  this.svg.select('.chart-timepoint').remove();
  if (!this.show) return;

  var x = this.xScale(vastcha15.timePoint * utils.MILLIS);
  this.svg.append('line')
    .classed('chart-timepoint', true)
    .attr('y1', 0)
    .attr('y2', this.plotHeight)
    .attr('transform', 'translate(' + x + ',0)');
};


/**
 * Render the time axis
 */
Chart.prototype.renderAxis = function() {
  // clear previous axis
  this.svg.select('.chart-axis').remove();

  this.axis = d3.svg.axis()
    .scale(this.xScale);
  var g = this.svg.append('g')
    .classed('chart-axis', true)
    .attr('transform', 'translate(0,' + this.plotHeight + ')')
    .call(this.axis);
};
