
'use strict';

var renderer = {

  /** @const */
  posSize: 4,
  posStrokeWidth: 1,
  svgSize: [500, 500],
  renderMargin: 10,

  /** @enum */
  mouseModes: {
    NONE: 0,
    RANGE_SELECT: 1,
    ZOOM: 2
  },

  /**
   * Rendering states
   */
  moveData: {}, // movement trajectory
  posData: {}, // position
  zoom: null,
  zoomTranslate: [0, 0],
  zoomScale: 1.0,

  /**
   * Interaction states
   */
  mouseMode: 0, // mouseModes.NONE
  startPos: [0, 0],
  endPos: [0, 0],
  selectRange: [[0, 0], [0, 0]],
  ctrlDown: false,


  /**
   * Compute the context of the rendering
   * upon initialization or screen resize.
   * @this {renderer}
   */
  context: function() {
    this.svg = d3.select('#svgMove > g');
    this.svgPath = this.svg.select('#path');
    this.svgPos = this.svg.select('#pos');
    this.jqView = $('#mapView');
    this.jqSvg = $('#svgMove');
    this.jqPath = this.jqSvg.find('#path');
    this.jqPos = this.jqSvg.find('#pos');
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
      // Perform range select in the map
      if (renderer.mouseMode == mouseModes.RANGE_SELECT) {
        renderer.jqSelectRange.hide();
        var selects = renderer.getRangeSelection();
        tracker.setSelects(selects);
        renderer.renderPositions(renderer.posData);
      }
      renderer.mouseMode = mouseModes.NONE;
    };

    $('body')
      .keydown(function(event) {
        if (event.which == utils.keyCodes.CTRL) {
          renderer.ctrlDown = true;
        }
      })
      .keyup(function(event) {
        if (event.which == utils.keyCodes.CTRL) {
          renderer.ctrlDown = false;
        }
      })
      .mouseup(function(event) {
        // clean up the keypress
        renderer.ctrlDown = false;
      });

    this.jqView
      .mousedown(function(event) {
        if (!renderer.ctrlDown) return;
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

    var zoomHandler = function() {
      if (renderer.mouseMode == mouseModes.RANGE_SELECT) {
        // Do not zoom when making selection
        renderer.zoom.scale(renderer.zoomScale);
        renderer.zoom.translate(renderer.zoomTranslate);
        return;
      }
      renderer.mouseMode = mouseModes.ZOOM;
      var translate = d3.event.translate,
          scale = d3.event.scale,
          w = renderer.svgSize[0],
          h = renderer.svgSize[1];
      translate[0] = Math.max(w * (1 - scale), translate[0]);
      translate[1] = Math.max(h * (1 - scale), translate[1]);
      translate[0] = Math.min(0, translate[0]);
      translate[1] = Math.min(0, translate[1]);

      renderer.zoomTranslate = translate;
      renderer.zoomScale = scale;

      renderer.zoom.translate(translate);
      renderer.svg.select('g').attr('transform',
        'translate(' + translate + ') ' +
        'scale(' + scale + ')'
      );
      renderer.renderPositions(renderer.posData);
    };

    this.zoom = d3.behavior.zoom()
      .scaleExtent([1, 8])
      .on('zoom', zoomHandler);
    this.svg.call(this.zoom);
  },

  /**
   * Get the people within the range selection
   */
  getRangeSelection: function() {
    var data = this.posData;
    var selected = [];
    for (var id in data) {
      var x = data[id][0], y = data[id][1];
      x = this.xScale(x);
      y = this.yScale(y);
      var p = utils.projectPoint([x, y], this.zoomTranslate, this.zoomScale);
      if (utils.fitRange(p, this.selectRange)) {
        selected.push(id);
      }
    }
    return selected;
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
   * Set the move / pos data
   * @param {array<[pid, eventType, x, y]} data
   */
  setMoveData: function(data) {
    this.moveData = data;
  },
  setPositionData: function(data) {
    this.posData = data;
  },


  /**
   * Render the given move data. All previous data is cleared.
   * @this {renderer}
   */
  renderMoves: function() {
    var data = this.moveData;
    console.log('rendering', utils.size(data), 'moves');
    this.moveData = data;
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
   */
  renderPositions: function() {
    var data = this.posData;
    //console.log('rendering', utils.size(data), 'positions');
    var svg = this.svgPos,
        margin = this.renderMargin;
    // clear previous people
    svg.selectAll('*').remove();

    var scale = this.zoomScale,
        translate = this.zoomTranslate;
    for (var pid in data) {
      var p = data[pid];
      if(p[0] <= 5 && (p[1] <= 5 || p[1] >= 95)) {
        vastcha15.warning('Weird position detected:', JSON.stringify(p));
      }
      var x = this.xScale(p[0]),
          y = this.yScale(p[1]);

      var pScreen = utils.projectPoint([x, y], translate, scale);
      if (!utils.fitRange(pScreen,
          [[0, this.svgSize[0]], [0, this.svgSize[1]]],
          margin)) {
        continue;
      }

      var c = svg.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', this.posSize / scale)
          .style('stroke-width', this.posStrokeWidth / scale);
      if (tracker.targeted[pid]) {
        c.classed('pos-target', true);
      } else if (tracker.selectedP[pid]) {
        c.classed('pos-selectP', true);
      } else if (tracker.selected[pid]) {
        c.classed('pos-select', true);
      }
    }

    // reorder the important people so that they appear on top others
    this.jqPos.find('.pos-select').appendTo(this.jqPos);
    this.jqPos.find('.pos-selectP').appendTo(this.jqPos);
    this.jqPos.find('.pos-target').appendTo(this.jqPos);
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
