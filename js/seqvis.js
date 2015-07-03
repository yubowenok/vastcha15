
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
  this.seqData = null;
  this.getSeqColor = null; // function
  this.getSeqInfo = null; // function

  /** On/Off state of the view */
  this.show = true;
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

  var seqvis = this;
  this.btnShow
    .addClass(this.show ? 'label-primary' : 'label-default')
    .text(this.show ? 'On' : 'Off')
    .click(function(event) {
      seqvis.setShow(!seqvis.show);
    });
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
  if (minTime != Infinity) {
    this.xScale.domain([minTime * utils.MILLIS, maxTime * utils.MILLIS]);
    // not "index - 1", otherwise the last row has now height!
    this.yScale.domain([0, index]);
  }
  this.interaction();
};


/** Set up the interaction for the rendered elements. */
SequenceVisualizer.prototype.interaction = function() {
  var seqvis = this;
  var zoomHandler = function() {
    var translate = d3.event.translate,
        scale = d3.event.scale;
    var w = seqvis.jqSvg.width(),
        h = seqvis.jqSvg.height();
    translate[0] = Math.max(w * (1 - scale), translate[0]);
    translate[0] = Math.min(0, translate[0]);
    translate[1] = 0;

    seqvis.zoomTranslate = translate;
    seqvis.zoomScale = scale;

    seqvis.zoom.translate(translate);

    seqvis.svg.select('g').attr('transform',
        'translate(' + translate + ') ' +
        'scale(' + scale + ',1)'
    );
    seqvis.svg.select('.seq-axis').call(seqvis.axis);
    seqvis.renderTimepoint();
  };
  this.zoom = d3.behavior.zoom()
    .scaleExtent([1, 1000])
    .on('zoom', zoomHandler);
  this.zoom.x(this.xScale);
  this.svg.call(this.zoom);
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
  this.renderSequences();
  this.renderLabels();
  this.renderTimepoint();
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
    var as = data[pid],
        index = as.index;
    var yl = this.yScale(index),
        yr = this.yScale(index + 1);
    var g = svg.append('g')
      .attr('id', 'a' + pid)
      .attr('transform', 'translate(0,' + yl + ')');
    for (var i = 0; i < as.length - 1; i++) {
      var xl = this.xScale(as[i][0] * utils.MILLIS),
          xr = this.xScale(as[i + 1][0] * utils.MILLIS),
          color = this.getSeqColor(as[i][1]);
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
          [d3.event.pageX, d3.event.pageY],
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
  this.renderTimepoint();
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
    var as = data[pid],
        index = as.index;
    var y = this.yScale(index + 0.5) + 5;
    var lb = g.append('text')
      .attr('id', 'lb' + pid)
      .attr('x', 3)
      .attr('y', y)
      .text(pid);
    lb.on('mousedown', function() {
        var id = d3.event.target.id.substr(2);
        tracker.toggleSelect(id);
      });
  }
};

/**
 * Show a label with given text and position
 * @param {Array<number>} pos  [x, y]
 * @param {string}        text
 */
SequenceVisualizer.prototype.renderJqLabel = function(pos, text) {
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
SequenceVisualizer.prototype.renderTimepoint = function() {
  // clear previous
  this.svg.select('.seq-timepoint').remove();
  if (!this.show) return;

  var x = this.xScale(vastcha15.timePoint * utils.MILLIS);
  this.svg.append('line')
    .classed('seq-timepoint', true)
    .attr('y1', 0)
    .attr('y2', this.plotHeight)
    .attr('transform', 'translate(' + x + ',0)');
};


/**
 * Render the time axis
 */
SequenceVisualizer.prototype.renderAxis = function() {
  // clear previous axis
  this.svg.select('.seq-axis').remove();

  this.axis = d3.svg.axis()
    .scale(this.xScale);
  var g = this.svg.append('g')
    .classed('seq-axis', true)
    .attr('transform', 'translate(0,' + this.plotHeight + ')')
    .call(this.axis);
};