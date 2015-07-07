
'use strict';

/**
 * Table for plotting matrix data,
 * Currently for showing facility percentages.
 * @constructor
 */
var Table = function() {
  /** Margins of plot are to the view boundaries
   * @const */
  this.margins = [
    [40, 0],
    [0, 0]
  ];

  /** Rendering states */
  this.zoom = null;
  this.zoomTranslate = [0, 0];
  this.zoomScale = 1.0;

  /** Settings */
  // On/Off state
  this.show = true;

  /** Data to show */
  this.dimensions = [];
  this.tableData = {};

  /** Function for retrieve the color for a grid */
  this.getGridColor = null;
};


/** @const */
Table.prototype.OFF_HEIGHT = 0;

/**
 * Setup the context for the chart.
 */
Table.prototype.context = function(title, panelTag) {
  var viewTag = panelTag + ' .panel-body';
  this.svg = d3.select(panelTag + ' svg > g');
  this.svgTable = this.svg.select('.table');
  this.svgLabel = this.svg.select('.table-labels');
  this.jqHeader = $(panelTag).find('.panel-heading');
  this.jqView = $(viewTag);
  this.jqSvg = $(panelTag).find('svg');
  this.jqSeq = this.jqSvg.find('.table');
  this.jqSelectRange = this.jqView.find('.select-range');

  var width = this.jqSvg.width(),
      height = this.jqSvg.height();
  this.svgSize = [width, height];
  this.xScale = d3.scale.linear()
    .range([this.margins[0][0], width - this.margins[0][1]]);
  // Screen y is NOT reversed
  this.yScale = d3.scale.linear()
      .range([this.margins[1][0], height - this.margins[0][1]]);

  // Create title
  $('<span></span>').text(title)
    .appendTo(this.jqHeader);

  // Create buttons
  this.btnShow = $('<div></div>')
    .addClass('label btn-label btn-right')
    .attr('data-toggle', 'tooltip')
    .appendTo(this.jqHeader);

  // Hook event handlers
  var table = this;
  this.btnShow
    .addClass(this.show ? 'label-primary' : 'label-default')
    .text(this.show ? 'On' : 'Off')
    .click(function(event) {
      table.setShow(!table.show);
    });
};

/**
 * Set whether to show the table
 * @param {boolean} state
 *   If given, set state to the given one.
 *   Otherwise, toggle the current state.
 */
Table.prototype.setShow = function(state) {
  if (state == undefined) {
    state = !this.show;
  }
  this.show = state;
  if (this.show) {
    this.btnShow.addClass('label-primary')
      .removeClass('label-default')
      .text('On');
    this.render();
  } else {
    this.btnShow.removeClass('label-primary')
      .addClass('label-default')
      .text('Off');
    this.clear();
  }
};

/**
 * Map a grid to its color.
 * @param {function} getColor
 */
Table.prototype.setColors = function(getColor) {
  this.getGridColor = getColor;
};

/**
 * Set the data and compute the scales.
 * @param {{
 *   dimensions: [string, string, ...],
 *   rowNames: [string, string, ...],
 *   data: [[v00, v01, ...], [v10, v11, ...], ...]
 * }}
 */
Table.prototype.setTableData = function(data) {
  this.dimensions = data.dimensions;
  this.tableData = data.data;
  var tableData = this.tableData;
  this.xScale.domain([0, this.dimensions.length]);
  var index = 0;
  var order = tracker.getOrderedTargets().concat(
    tracker.getOrderedSelects());
  for (var k = 0; k < order.length; k++) {
    var pid = order[k];
    tableData[pid].index = index++;
  }
  this.yScale.domain([0, index]);
  this.interaction();
};

/**
 * Data has not changed but the order changed.
 */
Table.prototype.reindex = function() {
  if (!this.show) return;
  var order = tracker.getOrderedTargets().concat(
    tracker.getOrderedSelects());
  var index = 0;
  var data = this.tableData;
  for (var k = 0; k < order.length; k++) {
    var pid = order[k];
    data[pid].index = index++;
  }
  this.render();
};

/**
 * Change context when window resizes.
 */
Table.prototype.resize = function() {
  var width = this.jqSvg.width(),
      height = this.jqSvg.height();
  this.svgSize = [width, height];
  this.xScale.range([this.margins[0][0], width - this.margins[0][1]]);
  this.render();
};


/**
 * Handler when the view is zoomed.
 */
Table.prototype.zoomHandler = function() {
  var translate = d3.event.translate,
      scale = d3.event.scale;
  var w = this.jqSvg.width(),
      h = this.jqSvg.height();
  translate[0] = 0;
  translate[1] = Math.max(h * (1 - scale), translate[1]);
  translate[1] = Math.min(0, translate[1]);

  this.zoomTranslate = translate;
  this.zoomScale = scale;
  this.zoom.translate(translate);
  this.svg.select('g').attr('transform',
      'translate(' + translate + ') ' +
      'scale(1,' + scale + ')'
  );
  this.render();
};


/**
 * Setup interaction for chart.
 */
Table.prototype.interaction = function() {
  this.zoom = d3.behavior.zoom()
    .scaleExtent([1, 1000])
    .on('zoom', this.zoomHandler.bind(this));
  this.zoom.y(this.yScale);
  this.svg.call(this.zoom);
};

/** Highlight / unhighlight hovered element. */
Table.prototype.updateHover = function(pid) {
  var row = this.tableData[pid];
  if (row == undefined) return;
  var index = row.index;
  var yl = this.yScale(index),
      yr = this.yScale(index + 1);
  this.svgTable.append('rect')
    .classed('table-hover', true)
    .attr('x', 0)
    .attr('width', this.svgSize[0])
    .attr('y', yl)
    .attr('height', yr - yl);
};
Table.prototype.clearHover = function(pid) {
  this.svgTable.select('.table-hover').remove();
};

/** Wrapper */
Table.prototype.render = function() {
  this.renderTable();
  this.renderLabels();
};

/** Clear the rendering */
Table.prototype.clear = function() {
  this.svgTable.selectAll('*').remove();
  this.svgLabel.selectAll('*').remove();
};


/** Render the chart. */
Table.prototype.renderTable = function() {
  var data = this.tableData,
      svg = this.svgTable;
  // clear previous rendering
  svg.selectAll('*').remove();

  var scale = this.zoomScale,
      translate = this.zoomTranslate;
  var table = this;

  for (var pid in data) {
    var as = data[pid];
    var index = as.index;
    var yl = this.yScale(index),
        yr = this.yScale(index + 1) - 1;
    if (yr < yl) yr = yl;
    var xl = this.xScale(0),
        xr = this.xScale(as.length);

    var g = svg.append('g')
      .attr('id', 'r' + pid)
      .attr('transform', 'translate(0,' + yl + ')');

    var mouseoverHandler = function() {
      var id = d3.event.target.parentElement.id.substr(1);
      tracker.setHoverPid(id);
      var jqTarget = $(d3.event.target);
      var val = (+jqTarget.attr('val')).toFixed(2),
          dim = jqTarget.attr('dim');
      if (dim == undefined) // coverage bar
        return;
      table.renderJqLabel(
        [d3.event.pageX + 5 - table.jqView.offset().left,
         d3.event.pageY - table.jqView.offset().top],
        table.dimensions[dim] + ': ' + val + '%'
      );
    };
    var mouseoutHandler = function() {
      tracker.setHoverPid(null);
      table.removeJqLabel();
    };
    var h = Math.max(1, yr - yl);

    for (var i = 0; i < as.length; i++) {
      var xl = this.xScale(i),
          xr = this.xScale(i + 1);
      var val = as[i];
      // coverage bar
      g.append('rect')
       .attr('x', xl)
       .attr('width', xr - xl)
       .attr('height', h)
       .attr('val', val)
       .attr('dim', i)
       .classed('table-coverage', true)
       .on('mouseover', mouseoverHandler)
       .on('mouseout', mouseoutHandler);
      xr = val / 100 * (xr - xl) + xl;
      var color = this.getGridColor(this.dimensions[i]);
      var r = g.append('rect')
        .attr('x', xl)
        .attr('width', xr - xl)
        .attr('height', h)
        .style('fill', color);

      r.on('mouseover', mouseoverHandler)
      .on('mouseout', mouseoutHandler)
    }
  }
};

/**
 * Show labels for each row.
 */
Table.prototype.renderLabels = function() {
  var data = this.tableData,
      svg = this.svgLabel;
  // clear previous rendering
  svg.selectAll('*').remove();

  var scale = this.zoomScale,
      translate = this.zoomTranslate;
  var table = this;
  for (var pid in data) {
    var as = data[pid],
        index = as.index;
    var y = (this.yScale(index + 0.5) + 5) * scale + translate[1];
    var lb = svg.append('text')
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
 * Highlight targets.
 */
Table.prototype.renderTargets = function() {
  if (!this.show) return;
  var data = this.tableData;
  this.svg.selectAll('.table-label-target')
    .classed('table-label-target', false);
  for (var pid in data) {
    if (tracker.targeted[pid]) {
      this.svg.select('#lb' + pid)
        .classed('table-label-target', true);
    }
  }
};


/**
 * Show vis label for table
 * @param {Array<number>} pos
 * @param {string}        text
 */
Table.prototype.renderJqLabel = function(pos, text) {
  this.removeJqLabel(); // only one label at a time
  var left = pos[0] + 5;
  var e = $('<div></div>')
    .text(text)
    .css({
        left: left,
        top: pos[1]
      })
    .addClass('vis-label')
    .appendTo(this.jqView)
    .click(function() {
      $(this).remove();
    });
  if (e.width() + left > this.svgSize[0]) {
    e.css('left', pos[0] - e.width() - 10);
  }
};
Table.prototype.removeJqLabel = function() {
  this.jqView.find('.vis-label').remove();
};


