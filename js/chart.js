
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
    [15, 5]
  ];

  /** Rendering states */
  this.zoom = null;
  this.zoomTranslate = [0, 0];
  this.zoomScale = 1.0;

  /** @const */
  this.strokeWidth = 1.0;
  this.timePointStrokeWidth = 1.0;

  /** Settings */
  // On/Off state
  this.show = true;
  // Query type
  this.type = 0;
  this.size = 1;
  this.sizeText = ['S', 'M', 'L', 'XL'];
  this.sizeHeight = [50, 150, 300, 450];
  this.TypeNames = ['Default'];
  // Update callback function
  this.update = null;
  // Whether update data function shall be called on zoom
  this.updateOnZoom = true;

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
 */
Chart.prototype.setTypeNames = function(names) {
  this.TypeNames = names;
};
/**
 * Set an update function to be called when the chart is changed,
 * e.g. zoomed, reset data, changed type.
 * @param {function} update
 */
Chart.prototype.setUpdate = function(update) {
  this.update = update;
};

/**
 * Set whether the chart should refetch data on zoom.
 * @param {boolean} state
 */
Chart.prototype.setUpdateOnZoom = function(state) {
  this.updateOnZoom = state;
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
  this.plotHeight = height - this.margins[1][0] - this.margins[1][1];
  this.yScale = d3.scale.linear()
      .range([this.plotHeight, this.margins[1][1]]);

  // Create title
  $('<span></span>').text(title)
    .appendTo(this.jqHeader);

  // Create buttons
  this.btnShow = $('<div></div>')
    .addClass('label btn-label btn-right')
    .attr('data-toggle', 'tooltip')
    .appendTo(this.jqHeader);
  this.btnSize = this.btnShow.clone()
    .addClass('label-primary')
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
    .click(function(event) {
      chart.setType();
    });
  this.btnSize
    .text(this.sizeText[this.size])
    .click(function(event) {
      chart.setSize();
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
  this.plotHeight = height - this.margins[1][0] - this.margins[1][1];
  this.yScale.range([this.plotHeight, this.margins[1][1]]);
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
    this.btnSize.addClass('label-primary')
      .removeClass('label-default');
    this.render();
    this.jqView.height(this.DEFAULT_HEIGHT);
  } else {
    this.btnShow.removeClass('label-primary')
      .addClass('label-default')
      .text('Off');
    this.btnSize.removeClass('label-primary')
      .addClass('label-default');
    this.clear();
    this.jqView.height(this.OFF_HEIGHT);
  }
};


/**
 * Change the height of the view.
 * @param {number} size Index of sizes
 *   If given, set the size to the given index.
 *   Otherwise, switch to the next size.
 */
Chart.prototype.setSize = function(size) {
  if (!this.show) return;
  if (size == undefined) {
    size = (this.size + 1) % this.sizeText.length;
  }
  this.size = size;
  this.btnSize.text(this.sizeText[size]);
  this.jqView.css('height', this.sizeHeight[size]);
  this.jqSvg.css('height', this.sizeHeight[size]);
  this.resize();
}


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
  this.update(true);
};


/**
 * Set the X domain for the chart
 * @param {Array<number>} domain
 */
Chart.prototype.setXDomain = function(domain) {
  this.minTime = domain[0] * utils.MILLIS;
  this.maxTime = domain[1] * utils.MILLIS;
  this.queryRange = [domain[0], domain[1]];
  this.xScale.domain([this.minTime, this.maxTime]);
  this.xScaleZoom = this.xScale.copy();
  this.zoomScale = 1.0;
  this.zoomTranslate = [0, 0];
  this.interaction();
};

/**
 * Set the data and compute the scales.
 * @param {Object<number,Array>} data See above definition.
 */
Chart.prototype.setChartData = function(data) {
  this.chartData = data;
  var minVal = Infinity, maxVal = -Infinity;
  for (var pid in data) {
    var l = data[pid];
    for (var i = 0; i < l.length; i++) {
      var p = l[i];
      minVal = Math.min(minVal, p[1]);
      maxVal = Math.max(maxVal, p[1]);
    }
  }
  // Have 5% vertical margins.
  //var spanVal = maxVal - minVal;
  //minVal -= spanVal * 0.05; // uncomment to NOT touch base
  //maxVal += spanVal * 0.05;

  if (minVal != Infinity) {
    // not "index - 1", otherwise the last row has now height!
    this.yScale.domain([minVal, maxVal]);
  }
};



/**
 * Handler when the view is zoomed.
 */
Chart.prototype.zoomHandler = function(isZoomEnd) {
  if (!isZoomEnd) {
    var translate = d3.event.translate,
        scale = d3.event.scale;
    var w = this.jqSvg.width(),
        h = this.jqSvg.height();
    translate[0] = Math.max(w * (1 - scale), translate[0]);
    translate[0] = Math.min(0, translate[0]);
    translate[1] = 0;

    this.zoomTranslate = translate;
    this.zoomScale = scale;
    this.zoom.translate(translate);

    this.svg.select('g').attr('transform',
        'translate(' + translate + ') ' +
        'scale(' + scale + ',1)'
    );
    this.svg.select('.chart-axis').call(this.xAxis);
    // Make line width consistent.
    this.svgChart.selectAll('path')
      .style('stroke-width', this.strokeWidth / scale);
  }
  var l = this.xScale.invert(
    (this.margins[0][0] - this.zoomTranslate[0]) / this.zoomScale);
  var r = this.xScale.invert(
    (this.svgSize[0] - this.zoomTranslate[0]) / this.zoomScale);
  l = (+l) / utils.MILLIS;
  r = (+r) / utils.MILLIS;
  this.queryRange = [l, r];
  var enforced = isZoomEnd;
  if (this.updateOnZoom) {
    this.update(enforced);
  } else {
    this.render();
  }
};


/**
 * Setup interaction for chart.
 */
Chart.prototype.interaction = function() {
  this.zoom = d3.behavior.zoom()
    .scaleExtent([1, 1000])
    .on('zoom', this.zoomHandler.bind(this))
    .on('zoomend', this.zoomHandler.bind(this, true));
  /**
   * Here we must use xScaleZoom because d3 will change the input scale's
   * domain during zooming. So we must give it a scale copy.
   */
  this.zoom.x(this.xScaleZoom);
  this.svg.call(this.zoom);
};



/** Highlight / unhighlight hovered element. */
Chart.prototype.updateHover = function(pid) {
  this.svgChart.select('#l' + pid)
    .classed('chart-hover', true)
    .style('stroke-width', 2 * this.strokeWidth / this.zoomScale);
};
Chart.prototype.clearHover = function(pid) {
  this.svgChart.select('#l' + pid)
    .classed('chart-hover', false)
    .style('stroke-width', this.strokeWidth / this.zoomScale);
};

/** Wrapper */
Chart.prototype.render = function() {
  this.renderChart();
  this.renderAxis();
  this.renderTimePoint();
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
  this.renderTargets();
  this.renderAxis();
  this.renderTimePoint();
};


/**
 * Highlight targets.
 */
Chart.prototype.renderTargets = function() {
  if (!this.show) return;
  this.svgChart.selectAll('.chart-target')
    .classed('chart-target', false);
  var data = this.chartData;
  for (var pid in data) {
    if (tracker.targeted[pid]) {
      this.svgChart.select('#l' + pid)
        .classed('chart-target', true);
    }
  }
};

/**
 * Render the current time point
 */
Chart.prototype.renderTimePoint = function() {
  // clear previous
  this.svgChart.select('.chart-timepoint').remove();
  if (!this.show) return;

  var x = this.xScale(vastcha15.timePoint * utils.MILLIS);
  this.svgChart.append('line')
    .classed('chart-timepoint', true)
    .attr('y1', 0)
    .attr('y2', this.plotHeight)
    .attr('transform', 'translate(' + x + ',0)')
    .style('stroke-width', this.timePointStrokeWidth / this.zoomScale);
};


/**
 * Render the time axis
 */
Chart.prototype.renderAxis = function() {
  // clear previous axis
  this.svg.selectAll('.chart-axis').remove();

  this.xAxis = d3.svg.axis()
    .scale(this.xScaleZoom);
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
