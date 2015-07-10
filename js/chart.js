
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
  this.showRiver = false;
  this.showCheckin = false;
  this.riverPossible = true;
  // Query type
  this.type = 0;
  this.size = 0;
  this.sizeText = ['S', 'M', 'L', 'XL'];
  this.sizeHeight = [50, 150, 300, 450];
  this.numTicks = [2, 5, 10, 15];
  this.TypeNames = ['Default'];
  // Update callback function
  this.update = null;
  // Whether update data function shall be called on zoom
  this.updateOnZoom = true;

  // Optionally map pid to color
  this.getColor = null;
  // Optionally get facility info
  this.getInfo = null;
  // Whether contains facilities data
  this.isFacility = false;

  /** Data
   * @type {Object<number, Array>}
   *   { pid: [[x0, y0], [x1, y1], ...], ... }
   */
  this.chartData = {};
  this.riverData = [];
  this.riverTs = [];
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
  this.svgCanvas = this.svg.select('.canvas');
  this.jqHeader = $(panelTag).find('.panel-heading');
  this.jqView = $(viewTag)
    .addClass('chart');
  this.jqSvg = $(panelTag).find('svg');
  this.jqCanvas = this.jqSvg.find('.canvas');
  this.jqSelectRange = this.jqView.find('.select-range');
  this.jqGrabBackground = this.jqSvg.find('.grab-background');

  var width = this.jqSvg.width(),
      height = this.jqSvg.height();
  this.svgSize = [width, height];
  this.xScale = d3.time.scale()
      .range([this.margins[0][0], width]);
  // Screen y is reversed
  this.plotHeight = height - this.margins[1][0] - this.margins[1][1];
  this.yScale = d3.scale.linear()
      .range([this.plotHeight, this.margins[1][1]]);
  this.yScaleRiver = this.yScale.copy();

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
  this.btnRiver = this.btnShow.clone()
    .text('River')
    .appendTo(this.jqHeader);
  this.btnCheckin = this.btnShow.clone()
    .text('Checkin')
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
  this.btnRiver
    .addClass(this.showRiver ? 'label-primary' : 'label-default')
    .click(function(event) {
      chart.setShowRiver();
    });
  this.btnCheckin
    .addClass(this.showCheckin ? 'label-primary' : 'label-default')
    .click(function(event) {
      chart.setShowCheckin();
    });
  this.resize(true);

  if (this.TypeNames.length == 1) {
    this.btnType.hide();
  }
};


/**
 * Disable the river functionality permanently.
 */
Chart.prototype.disableRiver = function() {
  this.btnCheckin.hide();
  this.btnRiver.hide();
  this.setShowRiver(false, true);
};

/**
 * Change context when window resizes.
 * @param {boolean} noRender If true, will not render the scene.
 */
Chart.prototype.resize = function(noRender) {
  if (!this.show) return;
  this.jqView.css('height', this.sizeHeight[this.size]);
  this.jqSvg.css('height', this.sizeHeight[this.size]);
  this.jqGrabBackground.css('height', this.sizeHeight[this.size]);
  var width = this.jqSvg.width(),
      height = this.jqSvg.height();
  this.svgSize = [width, height];
  this.xScale.range([this.margins[0][0], width]);
  this.plotHeight = height - this.margins[1][0] - this.margins[1][1];
  this.yScale.range([this.plotHeight, this.margins[1][1]]);
  this.yScaleRiver.range([this.plotHeight, this.margins[1][1]]);
  if (!noRender)
    this.render();
};


/**
 * Set whether to show the chart.
 * @param {boolean} state
 *   If given, set state to the given one.
 *   Otherwise, toggle the current state.
 */
Chart.prototype.setShow = function(state) {
  if (state == undefined) state = !this.show;
  this.show = state;
  if (this.show) {
    this.btnShow.addClass('label-primary')
      .removeClass('label-default')
      .text('On');
    this.btnSize.addClass('label-primary')
      .removeClass('label-default');
    this.resize();
    this.render();
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
 * Set whether to show theme river.
 * @param {boolean} state
 */
Chart.prototype.setShowRiver = function(state, noRender) {
  if (state == undefined) state = !this.showRiver;
  this.showRiver = state;
  this.btnRiver.toggleClass('label-primary')
    .toggleClass('label-default');
  if (!noRender)
    this.render();
};


/**
 * Set whether to show the overlaying checkin on the river.
 * @param {boolean} state
 */
Chart.prototype.setShowCheckin = function(state, noRender) {
  if (state == undefined) state = !this.showCheckin;
  this.showCheckin = state;
  this.btnCheckin.toggleClass('label-default')
    .toggleClass('label-primary');
  if (!noRender)
    this.render();
};


/**
 * Pass in a getColor function that maps a pid to color.
 */
Chart.prototype.setGetColor = function(getColor) {
  this.getColor = getColor;
};

/**
 * Pass in a getInfo function that maps an id to its description.
 */
Chart.prototype.setGetInfo = function(getInfo) {
  this.getInfo = getInfo;
};

/**
 * Whether chart contains facility info.
 */
Chart.prototype.setFacility = function(state) {
  this.isFacility = state;
};

/**
 * Change the height of the view.
 * @param {number} size Index of sizes
 *   If given, set the size to the given index.
 *   Otherwise, switch to the next size.
 */
Chart.prototype.setSize = function(size, noRender) {
  if (!this.show) return;
  if (size == undefined) {
    size = (this.size + 1) % this.sizeText.length;
  }
  this.size = size;
  this.btnSize.text(this.sizeText[size]);
  this.resize(noRender);
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
  var sums = {}, cntTm = {};
  var ts = [], hasTs = false;
  for (var pid in data) {
    var l = data[pid];
    for (var i = 0; i < l.length; i++) {
      var p = l[i];
      if (!hasTs) ts.push(p[0]);
      minVal = Math.min(minVal, p[1]);
      maxVal = Math.max(maxVal, p[1]);
      if (sums[p[0]] == undefined) sums[p[0]] = 0;
      sums[p[0]] += p[1];
      if (cntTm[p[0]] == undefined) cntTm[p[0]] = 0;
      cntTm[p[0]]++;
    }
    hasTs = true;
  }
  this.minVal = minVal;
  this.maxVal = maxVal;
  // Have 5% vertical margins.
  //var spanVal = maxVal - minVal;
  //minVal -= spanVal * 0.05; // uncomment to NOT touch base
  //maxVal += spanVal * 0.05;

  if (minVal != Infinity) {
    // not "index - 1", otherwise the last row has now height!
    this.yScale.domain([minVal, maxVal]);
  }

  // Determine if a river can be drawn.
  this.riverPossible = true;
  var list = Object.keys(data);
  var maxSum = 0;
  for (var t in sums) {
    if (cntTm[t] != list.length) {
      this.riverPossible = false;
      break;
    }
    maxSum = Math.max(maxSum, sums[t]);
  }
  if (this.riverPossible) {
    // River possible, so we pre-process data
    this.maxSum = maxSum;
    this.yScaleRiver.domain([0, maxSum]);

    this.riverData = [];
    for (var i = 0; i < list.length; i++) {
      this.riverData[i] = [];
      // associate id with data row
      this.riverData[i].pid = list[i];
    }
    this.riverTs = ts;
    for (var j = 0; j < ts.length; j++) {
      var prev = 0;
      for (var i = 0; i < list.length; i++) {
        var pid = list[i];
        var val = data[pid][j][1],
            valc = data[pid][j][2];
        // Vertical range full is [prev, prev + val]
        // Vertical range special is [prev, prev + valc]
        // prev =
        //   this.riverData[i - 1] (i > 0)
        //   or 0 (i = 0)
        this.riverData[i].push([prev + val, prev + valc]);

        prev += val;
      }
    }
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
    this.svgCanvas.selectAll('path')
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

  var chart = this;
  this.jqSvg.mousedown(function(event) {
    if (!vastcha15.keys.ctrl) return;
    var offset = utils.getOffset(event, $(this));
    chart.setTimePoint(offset[0]);
    event.stopPropagation();
    return false;
  });
};


/**
 * Get the time corresponding to the clicked position.
 * And set the time point to it.
 * @param {number} x
 */
Chart.prototype.setTimePoint = function(x) {
  var x = this.xScale.invert(
    (x - this.zoomTranslate[0]) / this.zoomScale);
  var t = (+x) / utils.MILLIS;
  t = parseInt(t);
  vastcha15.setTimePoint(t, true);
};


/** Highlight / unhighlight hovered element. */
Chart.prototype.updateHover = function(id) {
  if (!this.isFacility) {
    this.svgCanvas.select('#l' + id)
      .classed('chart-hover', true)
      .style('stroke-width', 2 * this.strokeWidth / this.zoomScale);
  } else {
    this.svgCanvas.select('#r' + id)
      .style('stroke', 'black')
      .style('stroke-width', 2 / this.zoomScale);
    this.jqCanvas.find('#r' + id)
      .appendTo(this.jqCanvas);
  }
};
Chart.prototype.clearHover = function(id) {
  if (!this.isFacility) {
    this.svgCanvas.select('#l' + id)
      .classed('chart-hover', false)
      .style('stroke-width', this.strokeWidth / this.zoomScale);
  } else {
    this.svgCanvas.select('#r' + id)
      .style('stroke', 'none');
  }
};

/** Wrapper */
Chart.prototype.render = function() {
  this.clear();
  if (!this.show) return;
  if (!this.showRiver)
    this.renderChart();
  else
    this.renderRiver();
  this.renderAxis();
  this.renderTimePoint();
};

/** Clear the rendering */
Chart.prototype.clear = function() {
  this.svgCanvas.selectAll('*').remove();
  this.svg.selectAll('.chart-axis').remove();
  this.svg.select('.chart-timepoint').remove();
};


/** Render the theme river */
Chart.prototype.renderRiver = function() {
  if (!this.riverPossible)
    return vastcha15.error('River not possible');
  var data = this.riverData;
  var ts = this.riverTs;
  var line = d3.svg.line().interpolate('linear-closed');
  var svg = this.svgCanvas;

  var xs = [];
  for (var j = 0; j < ts.length; j++) {
    xs[j] = this.xScale(ts[j] * utils.MILLIS);
  }

  var chart = this;
  for (var i = 0; i < data.length; i++) {
    var points = [], rev = [], revc = [];
    for (var j = 0; j < ts.length; j++) {
      var prev = i ? data[i - 1][j][0] : 0;
      var val = data[i][j][0],
          valc = data[i][j][1];
      points.push([xs[j], this.yScaleRiver(prev)]);
      rev.push([xs[j], this.yScaleRiver(val)]);
      if (this.showCheckin)
        revc.push([xs[j], this.yScaleRiver(valc)]);
    }
    var pts = points.concat(rev.reverse());

    var color;
    if (this.getColor != null) {
      color = this.getColor(data[i].pid);
    } else {
      color = utils.randomColor(data[i].pid);
    }
    var e = svg.append('path')
      .attr('d', line(pts))
      .attr('id', 'r' + data[i].pid)
      .style('stroke', 'none')
      .style('fill', color)
      .on('mouseover', function() {
        var id = d3.event.target.id.substr(1);
        var text;
        if (!chart.isFacility) {
          tracker.setHoverPid(id);
          text = id;
        } else {
          tracker.setHoverFid(id);
          text = chart.getInfo(id);
        }
        chart.renderJqLabel([d3.event.pageX + 5, d3.event.pageY], text);
      })
      .on('mouseout', function() {
        if (!chart.isFacility) {
          tracker.setHoverPid(null);
        } else {
          tracker.setHoverFid(null);
        }
        chart.removeJqLabel();
      })

    if (this.showCheckin) {
      pts = points.concat(revc.reverse());
      color = utils.darkerColor(color);
      e = svg.append('path')
        .attr('d', line(pts))
        .attr('id', 'c' + data[i].pid)
        .style('stroke', 'none')
        .style('fill', color);
    }
  }
};


/** Render the chart. */
Chart.prototype.renderChart = function() {
  var data = this.chartData,
      svg = this.svgCanvas;

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

    if (this.getColor != null) {
      var color = this.getColor(pid);
      e.style('stroke', color);
    }

    e.on('mouseover', function() {
        var id = d3.event.target.id.substr(1);
        var text;
        if (!chart.isFacility) {
          tracker.setHoverPid(id);
          text = id;
        } else {
          tracker.setHoverFid(id);
          text = chart.getInfo(id);
        }
        chart.renderJqLabel([d3.event.pageX + 5, d3.event.pageY], text);
      })
      .on('mouseout', function() {
        if (!chart.isFacility) {
          tracker.setHoverPid(null);
        } else {
          tracker.setHoverFid(null);
        }
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
  this.svgCanvas.selectAll('.chart-target')
    .classed('chart-target', false);
  var data = this.chartData;
  for (var pid in data) {
    if (tracker.targeted[pid]) {
      this.svgCanvas.select('#l' + pid)
        .style('stroke', '')
        .classed('chart-target', true);
    }
  }
};

/**
 * Render the current time point
 */
Chart.prototype.renderTimePoint = function() {
  // clear previous
  this.svgCanvas.selectAll('.chart-timepoint, .chart-timerange').remove();
  if (!this.show) return;

  var x = this.xScale(vastcha15.timePoint * utils.MILLIS);
  this.svgCanvas.append('line')
    .classed('chart-timepoint', true)
    .attr('y1', 0)
    .attr('y2', this.plotHeight)
    .attr('transform', 'translate(' + x + ',0)')
    .style('stroke-width', this.timePointStrokeWidth / this.zoomScale);

  var xl = this.xScale(vastcha15.timeRangeD[0] * utils.MILLIS),
      xr = this.xScale(vastcha15.timeRangeD[1] * utils.MILLIS);
  xl = Math.max(xl, this.margins[0][0]);
  xr = Math.min(xr, this.svgSize[0]);
  this.svgCanvas.append('rect')
    .classed('chart-timerange', true)
    .attr('x', this.margins[0][0])
    .attr('width', xl - this.margins[0][0])
    .attr('y', 0)
    .attr('height', this.plotHeight);
  this.svgCanvas.append('rect')
    .classed('chart-timerange', true)
    .attr('x', xr)
    .attr('width', this.svgSize[0] - xr)
    .attr('y', 0)
    .attr('height', this.plotHeight);
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

  var yScale = this.showRiver ? this.yScaleRiver : this.yScale;
  this.yAxis = d3.svg.axis().orient('left')
    .ticks(this.numTicks[this.size])
    .scale(yScale);
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
