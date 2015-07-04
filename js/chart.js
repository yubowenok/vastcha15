
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

  /** Settings */
  // On/Off state
  this.show = true;
  // Query type
  this.type = 0;
  this.TypeNames = ['Default'];
  // typeUpdate callback function
  this.typeUpdate = null;

  /** Data
   * @type {Object<number, Array>}
   *   { pid: [[x0, y0], [x1, y1], ...], ... }
   */
  this.chartData = {};
};

/** @const */
Chart.prototype.DEFAULT_HEIGHT = 150;
Chart.prototype.OFF_HEIGHT = 0;

/**
 * Set the query type names.
 * @param {Array<string>} names
 * @param {function} callback
 */
Chart.prototype.setTypeNames = function(names, callback) {
  if (callback == undefined)
    return vastcha15.error('callback not specified for setTypeNames');
  this.TypeNames = names;
  this.typeUpdate = callback;
};


/**
 * Setup the context for the chart.
 */
Chart.prototype.context = function(title, panelTag) {
  var viewTag = panelTag + ' .panel-body';
  this.svg = d3.select(panelTag + ' svg > g');
  this.svgChart = this.svg.select('.chart');
  this.jqHeader = $(panelTag).find('.panel-heading');
  this.jqView = $(viewTag);
  this.jqSvg = $(panelTag).find('svg');
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

  // Create title
  $('<span></span>').text(title)
    .appendTo(this.jqHeader);

  // Create buttons
  this.btnShow = $('<div></div>')
    .addClass('label btn-label btn-right')
    .attr('data-toggle', 'tooltip')
    .appendTo(this.jqHeader);
  this.btnType = this.btnShow.clone()
    .addClass('label-primary')
    .appendTo(this.jqHeader);

  // Hook event handlers
  var chart = this;
  this.btnShow
    .addClass(this.show ? 'label-primary' : 'label-default')
    .text(this.show ? 'On' : 'Off')
    .click(function(event) {
      chart.setShow(!chart.show);
    });
  this.btnType
    .text(utils.camelize(this.TypeNames[this.type]))
    .click(function(Event) {
      chart.setType();
    });
};


/**
 * Change context when window resizes.
 */
Chart.prototype.resize = function() {
  var width = this.jqSvg.width(),
      height = this.jqSvg.height();
  this.svgSize = [width, height];
  this.xScale.range([this.margins[0][0], width]);
  this.render();
};


/**
 * Set whether to show the chart.
 * @param {boolean} state
 *   If given, set state to the given one.
 *   Otherwise, toggle the current state.
 */
Chart.prototype.setShow = function(state) {
  if (state == undefined) {
    state = !this.show;
  }
  this.show = state;
  if (this.show) {
    this.btnShow.addClass('label-primary')
      .removeClass('label-default')
      .text('On');
    this.render();
    this.jqView.height(this.DEFAULT_HEIGHT);
  } else {
    this.btnShow.removeClass('label-primary')
      .addClass('label-default')
      .text('Off');
    this.clear();
    this.jqView.height(this.OFF_HEIGHT);
  }
};


/**
 * Set the rendering type of the chart.
 * @param {number} type
 *   If type is given, set the type to the given one.
 *   Otherwise, switch the current type to the next one.
 */
Chart.prototype.setType = function(type) {
  if (type == undefined) {
    type = (this.type + 1) % this.TypeNames.length;
  }
  this.type = type;
  this.btnType.text(utils.camelize(this.TypeNames[this.type]));
  this.typeUpdate();
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
      minVal = Math.min(minVal, p[1]);
      maxVal = Math.max(maxVal, p[1]);
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
    chart.svg.select('.chart-axis').call(chart.xAxis);
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
  //this.renderJqLabel(null, pid);
};
Chart.prototype.clearHover = function(pid) {
  this.svgChart.select('#l' + pid)
    .classed('chart-hover', false)
    .style('stroke-width', 1.5 / this.zoomScale);
  //this.removeJqLabel();
};

/** Wrapper */
Chart.prototype.render = function() {
  this.renderChart();
  this.renderAxis();
  this.renderTimepoint();
};

/** Clear the rendering */
Chart.prototype.clear = function() {
  this.svgChart.selectAll('*').remove();
  this.svg.selectAll('.chart-axis').remove();
  this.svg.select('.chart-timepoint').remove();
};


/** Render the chart. */
Chart.prototype.renderChart = function() {
  var data = this.chartData,
      svg = this.svgChart;
  // clear previous rendering
  svg.selectAll('*').remove();

  var scale = this.zoomScale,
      translate = this.zoomTranslate;
  var chart = this;

  var line = d3.svg.line().interpolate('linear');
  for (var pid in data) {
    var l = data[pid];
    var points = [];
    for (var i = 0; i < l.length; i++) {
      points.push([
        this.xScale(l[i][0] * utils.MILLIS),
        this.yScale(l[i][1])
        ]);
    }
    var e = svg.append('path')
      .attr('d', line(points))
      .attr('id', 'l' + pid)
      .style('stroke-width', 1 / this.zoomScale);

    e.on('mouseover', function() {
        var id = d3.event.target.id.substr(1);
        tracker.setHoverPid(id);
        chart.renderJqLabel([d3.event.pageX + 5, d3.event.pageY], id);
      })
      .on('mouseout', function() {
        tracker.setHoverPid(null);
        chart.removeJqLabel();
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
  this.svg.selectAll('.chart-axis').remove();

  this.xAxis = d3.svg.axis()
    .scale(this.xScale);
  this.svg.append('g')
    .classed('chart-axis', true)
    .attr('transform', 'translate(0,' + this.plotHeight + ')')
    .call(this.xAxis);
  this.yAxis = d3.svg.axis().orient('left')
    .scale(this.yScale);
  this.svg.append('g')
    .classed('chart-axis', true)
    .attr('transform', 'translate(' +  this.margins[0][0] + ',0)')
    .call(this.yAxis);
};

/**
 * Show a label with given text at given position.
 * @param {Array<number>} pos  [x, y]
 * @param {string}        text
 */
Chart.prototype.renderJqLabel = function(pos, text) {
  this.removeJqLabel(); // Only one label at a time
  if (pos == null) {
    pos = [this.margins[0][0] + 15, this.jqView.offset().top + 5];
  }
  $('<div></div>')
    .text(text)
    .css({
        left: pos[0],
        top: pos[1]
      })
    .addClass('vis-label')
    .appendTo(this.jqView)
    .click(function() {
      $(this).remove();
    });
};
Chart.prototype.removeJqLabel = function() {
  this.jqView.find('.vis-label').remove();
};
