
'use strict';

/**
 * Plot sequences as rows of rectangles.
 * @constructor
 */
var SequenceVisualizer = function() {
  /** Margins of plot are to the view boundaries
   * @const */
  this.margins = [
    [40, 0],
    [0, 20]
  ];

  /** Rendering states */
  this.zoom = null;
  this.zoomTranslate = [0, 0];
  this.zoomScale = 1.0;

  /** Data and colors */
  this.seqData = {};
  this.getSeqColor = null; // function
  this.getSeqInfo = null; // function
  this.update = null;

  /** @const */
  this.timePointStrokeWidth = 1.0;

  /** On/Off state of the view */
  this.show = true;
  /** Whether to show checkin */
  this.showCheckin = true;

  /** Size of the view */
  this.size = 0;
  this.sizeText = ['S', 'M', 'L', 'XL'];
  this.sizeHeight = [100, 200, 400, 800];
};

/** @const */
SequenceVisualizer.prototype.DEFAULT_HEIGHT = 200;
SequenceVisualizer.prototype.OFF_HEIGHT = 0;

/**
 * Setup the context for the sequence visualizer.
 */
SequenceVisualizer.prototype.context = function(title, panelTag) {
  var viewTag = panelTag + ' .panel-body';
  this.svg = d3.select(panelTag + ' svg > g');
  this.svgSeq = this.svg.select('.seq');
  this.jqHeader = $(panelTag).find('.panel-heading');
  this.jqView = $(viewTag);
  this.jqSvg = $(panelTag).find('svg');
  this.jqSeq = this.jqSvg.find('.seq');
  this.jqSelectRange = this.jqView.find('.select-range');
  this.jqGrabBackground = this.jqSvg.find('.grab-background');

  var width = this.jqSvg.width(),
      height = this.jqSvg.height();
  this.svgSize = [width, height];
  this.xScale = d3.time.scale()
      .range([this.margins[0][0], width]);
  // Screen y is NOT reversed, as the order of rows is arbitrary.
  this.plotHeight = height - this.margins[1][1];
  this.yScale = d3.scale.linear()
      .range([0, this.plotHeight]);

  $('<span></span>').text(title)
    .appendTo(this.jqHeader);

  this.btnShow = $('<div></div>')
    .addClass('label btn-label btn-right')
    .attr('data-toggle', 'tooltip')
    .appendTo(this.jqHeader);
  this.btnCheckin = this.btnShow.clone()
    .addClass('label-primary')
    .appendTo(this.jqHeader);
  this.btnSize = this.btnShow.clone()
    .addClass('label-primary')
    .appendTo(this.jqHeader);

  var seqvis = this;
  this.btnShow
    .addClass(this.show ? 'label-primary' : 'label-default')
    .text(this.show ? 'On' : 'Off')
    .click(function(event) {
      seqvis.setShow(!seqvis.show);
    });
  this.btnCheckin
    .addClass(this.showCheckin ? 'label-primary' : 'label-default')
    .text('Check-in')
    .click(function(event) {
      seqvis.setCheckin();
    });
  this.btnSize
    .text(this.sizeText[this.size])
    .click(function(event) {
      seqvis.setSize();
    });
  this.resize(true);
};


/**
 * Update function call
 * @param {function} update
 */
SequenceVisualizer.prototype.setUpdate = function(update) {
  this.update = update;
};

/**
 * Change context when window resizes.
 * @param {boolean} noRender If true, skip re-rendering the scene.
 */
SequenceVisualizer.prototype.resize = function(noRender) {
  if (!this.show) return;
  this.jqView.css('height', this.sizeHeight[this.size]);
  this.jqSvg.css('height', this.sizeHeight[this.size]);
  this.jqGrabBackground.css('height', this.sizeHeight[this.size]);
  var width = this.jqSvg.width(),
      height = this.jqSvg.height();
  this.svgSize = [width, height];
  this.xScale.range([this.margins[0][0], width]);
  this.plotHeight = height - this.margins[1][0] - this.margins[1][1];
  this.yScale.range([0, this.plotHeight]);
  if (!noRender)
    this.render();
};


/**
 * Turn on/off sequence visualizer.
 * @param {boolean} state
 */
SequenceVisualizer.prototype.setShow = function(state) {
  this.show = state;
  if (this.show) {
    this.btnShow.addClass('label-primary')
      .removeClass('label-default')
      .text('On');
    this.btnSize.addClass('label-primary')
      .removeClass('label-default');
    this.resize(true);
    this.update(true);
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
 * Turn on/off checkin vis.
 * @param {boolean} state
 */
SequenceVisualizer.prototype.setCheckin = function(state) {
  if (state == undefined) state = !this.showCheckin;
  this.showCheckin = state;
  if (state) {
    this.btnCheckin.addClass('label-primary')
      .removeClass('label-default')
  } else {
    this.btnCheckin.removeClass('label-primary')
      .addClass('label-default')
  }
  this.render();
};


/**
 * Change the height of the view.
 * @param {number} size Index of sizes
 *   If given, set the size to the given index.
 *   Otherwise, switch to the next size.
 */
SequenceVisualizer.prototype.setSize = function(size) {
  if (!this.show) return;
  if (size == undefined) {
    size = (this.size + 1) % this.sizeText.length;
  }
  this.size = size;
  this.btnSize.text(this.sizeText[size]);
  this.resize();
}

/**
 * Set a function that will map a given value of bar to its color.
 * @param {function} getColor
 */
SequenceVisualizer.prototype.setColors = function(getColor) {
  this.getSeqColor = getColor;
};
/**
 * Set a function that will map a given value of bar to its info.
 * @param {function} getInfo
 */
SequenceVisualizer.prototype.setInfo = function(getInfo) {
  this.getSeqInfo = getInfo;
};


/**
 * Set the sequence data
 * @param {Array} data
 */
SequenceVisualizer.prototype.setSequenceData = function(data) {
  this.seqData = data;
  var minTime = Infinity, maxTime = -Infinity;
  var index = 0;
  var order = tracker.getOrderedTargets().concat(
    tracker.getOrderedSelects());
  for (var k = 0; k < order.length; k++) {
    var pid = order[k];
    var as = data[pid];
    if (data[pid] == undefined) continue;
    for (var i = 0; i < as.length; i++) {
      var a = as[i];
      minTime = Math.min(minTime, a[0]);
      maxTime = Math.max(maxTime, a[0]);
    }
    as.index = index++; // assign an index
  }
  var height = this.jqSvg.height();
  if (minTime != Infinity) {
    this.xScale.domain([minTime * utils.MILLIS, maxTime * utils.MILLIS]);
    // not "index - 1", otherwise the last row has now height!
    this.yScale.domain([0, index]);
  }
  this.interaction();
};

/**
 * The data has not changed. But the rendering order has changed.
 */
SequenceVisualizer.prototype.reindex = function() {
  if (!this.show) return;
  var data = this.seqData;
  var order = tracker.getOrderedTargets().concat(
    tracker.getOrderedSelects());
  var index = 0;
  for (var k = 0; k < order.length; k++) {
    var pid = order[k];
    if (data[pid] == undefined) continue;
    data[pid].index = index++;
  }
  this.render();
};


/**
 * Response zoom event.
 */
SequenceVisualizer.prototype.zoomHandler = function() {
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
  this.svg.select('.seq-axis').call(this.axis);
  this.renderTimePoint();
}

/**
 * Set up the interaction for the rendered elements.
 */
SequenceVisualizer.prototype.interaction = function() {
  var seqvis = this;
  this.xScaleZoom = this.xScale.copy();
  this.zoom = d3.behavior.zoom()
    .scaleExtent([1, 1000])
    .on('zoom', this.zoomHandler.bind(this));
  this.zoom.x(this.xScaleZoom);
  this.svg.call(this.zoom);

  this.jqSvg.mousedown(function(event) {
    if (!vastcha15.keys.ctrl) return;
    var offset = utils.getOffset(event, $(this));
    seqvis.setTimePoint(offset[0]);
    event.stopPropagation();
    return false;
  });
};


/**
 * Get the time corresponding to the clicked position.
 * And set the time point to it.
 * @param {number} x
 */
SequenceVisualizer.prototype.setTimePoint = function(x) {
  var x = this.xScale.invert(
    (x - this.zoomTranslate[0]) / this.zoomScale);
  var t = (+x) / utils.MILLIS;
  t = parseInt(t);
  vastcha15.setTimePoint(t, true);
};


/** Highlight / unhighlight hovered element. */
SequenceVisualizer.prototype.updateHover = function(pid) {
  var as = this.seqData[pid];
  if (as == undefined) return;
  var index = as.index;
  var yl = this.yScale(index),
      yr = this.yScale(index + 1);
  this.svgSeq.append('rect')
    .classed('seq-hover', true)
    .attr('x', 0)
    .attr('width', this.svgSize[0])
    .attr('y', yl)
    .attr('height', yr - yl);
};
SequenceVisualizer.prototype.clearHover = function(pid) {
  this.svgSeq.select('.seq-hover').remove();
};

/** Wrapper */
SequenceVisualizer.prototype.render = function() {
  if (!this.show) return;
  this.renderSequences();
  this.renderLabels();
  this.renderTimePoint();
  this.renderAxis();
};

/** Clear the rendering. */
SequenceVisualizer.prototype.clear = function() {
  this.svgSeq.selectAll('*').remove();
  this.svg.select('.seq-labels').remove();
  this.svg.select('.seq-timepoint').remove();
  this.svg.select('.seq-axis').remove();
};

/** Render the sequences. */
SequenceVisualizer.prototype.renderSequences = function() {
  var seqvis = this;
  var data = this.seqData,
      svg = this.svgSeq;
  // clear previous rendering
  svg.selectAll('*').remove();

  var scale = this.zoomScale,
      translate = this.zoomTranslate;
  for (var pid in data) {
    var as = data[pid];
    var index = as.index;
    var yl = this.yScale(index),
        yr = this.yScale(index + 1);
    var g = svg.append('g')
      .attr('id', 'a' + pid)
      .attr('transform', 'translate(0,' + yl + ')');
    for (var i = 0; i < as.length - 1; i++) {
      var xl = this.xScale(as[i][0] * utils.MILLIS),
          xr = this.xScale(as[i + 1][0] * utils.MILLIS),
          color = this.getSeqColor(as[i][1]);
      if (as[i][2] == 0 && this.showCheckin) // Check-in
        color = utils.darkerColor(color);
      var r = g.append('rect')
        .attr('x', xl)
        .attr('val', as[i][1])
        .attr('width', xr - xl)
        .attr('height', yr - yl)
        .style('fill', color);
      r.on('mouseover', function() {
        var id = d3.event.target.parentElement.id.substr(1);
        tracker.setHoverPid(id);
        var val = $(d3.event.target).attr('val');
        seqvis.renderJqLabel(
          [d3.event.pageX + 5, d3.event.pageY],
          seqvis.getSeqInfo(val)
        );
      })
      .on('mouseout', function() {
        tracker.setHoverPid(null);
        seqvis.removeJqLabel();
      })
    }
  }
  this.renderAxis();
  this.renderLabels();
  this.renderTimePoint();
};


/**
 * Show pid for each row
 */
SequenceVisualizer.prototype.renderLabels = function() {
  var data = this.seqData;
  // clear previous labels
  this.svg.select('.seq-labels').remove();

  var g = this.svg.append('g')
    .classed('seq-labels', true);
  for (var pid in data) {
    var as = data[pid];
    var index = as.index;
    var y = this.yScale(index + 0.5) + 5;
    var lb = g.append('text')
      .attr('id', 'lb' + pid)
      .attr('x', 3)
      .attr('y', y)
      .text(pid);
    lb.on('mousedown', function() {
        var id = d3.event.target.id.substr(2);
        tracker.toggleTarget(id);
      })
      .on('mouseover', function() {
        var id = d3.event.target.id.substr(2);
        tracker.setHoverPid(id);
      })
      .on('mouseout', function() {
        var id = d3.event.target.id.substr(2);
        tracker.setHoverPid(null);
      });
  }
  this.renderTargets();
};


/**
 * Highlight the targeted elements
 */
SequenceVisualizer.prototype.renderTargets = function() {
  if (!this.show) return;
  var data = this.seqData;
  this.svg.selectAll('.seq-label-target')
    .classed('seq-label-target', false);
  for (var pid in data) {
    if (tracker.targeted[pid]) {
      this.svg.select('#lb' + pid)
        .classed('seq-label-target', true);
    }
  }
};


/**
 * Show a label with given text and position
 * @param {Array<number>} pos  [x, y]
 * @param {string}        text
 */
SequenceVisualizer.prototype.renderJqLabel = function(pos, text) {
  this.removeJqLabel(); // only one label at a time
  $('<div></div>')
    .text(text)
    .css({
        left: pos[0] + 5,
        top: pos[1]
      })
    .addClass('vis-label')
    .appendTo(this.jqView)
    .click(function() {
      $(this).remove();
    });
};
SequenceVisualizer.prototype.removeJqLabel = function() {
  this.jqView.find('.vis-label').remove();
};


/**
 * Render the current time point
 */
SequenceVisualizer.prototype.renderTimePoint = function() {
  // clear previous
  this.svgSeq.selectAll('.seq-timepoint, .seq-timerange').remove();
  if (!this.show) return;

  var x = this.xScale(vastcha15.timePoint * utils.MILLIS);
  this.svgSeq.append('line')
    .classed('seq-timepoint', true)
    .attr('y1', 0)
    .attr('y2', this.plotHeight)
    .attr('transform', 'translate(' + x + ',0)')
    .style('stroke-width', this.timePointStrokeWidth / this.zoomScale);

  var xl = this.xScale(vastcha15.timeRangeD[0] * utils.MILLIS),
      xr = this.xScale(vastcha15.timeRangeD[1] * utils.MILLIS);
  xl = Math.max(xl, this.margins[0][0]);
  xr = Math.min(xr, this.svgSize[0]);
  this.svgSeq.append('rect')
    .classed('seq-timerange', true)
    .attr('x', this.margins[0][0])
    .attr('width', xl - this.margins[0][0])
    .attr('y', 0)
    .attr('height', this.plotHeight);
  this.svgSeq.append('rect')
    .classed('seq-timerange', true)
    .attr('x', xr)
    .attr('width', this.svgSize[0] - xr)
    .attr('y', 0)
    .attr('height', this.plotHeight);
};


/**
 * Render the time axis
 */
SequenceVisualizer.prototype.renderAxis = function() {
  // clear previous axis
  this.svg.select('.seq-axis').remove();

  this.axis = d3.svg.axis()
    .scale(this.xScaleZoom);
  var g = this.svg.append('g')
    .classed('seq-axis', true)
    .attr('transform', 'translate(0,' + this.plotHeight + ')')
    .call(this.axis);
};
