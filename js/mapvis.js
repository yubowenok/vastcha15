
'use strict';

var mapvis = {

  /** @const */
  posSize: 4,
  posStrokeWidth: 1,
  svgSize: [500, 500],
  // a person is drawn as long as she is within margin distance to the viewport
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
   * @this {mapvis}
   */
  context: function() {
    this.svg = d3.select('#svg-move > g');
    this.svgPath = this.svg.select('#path');
    this.svgPos = this.svg.select('#pos');
    this.jqView = $('#map-view');
    this.jqSvg = $('#svg-move');
    this.jqPath = this.jqSvg.find('#path');
    this.jqPos = this.jqSvg.find('#pos');
    this.jqMap = this.jqSvg.find('#parkMap');
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

    this.interaction();
  },


  /**
   * Setup map interaction.
   */
  interaction: function() {

    // Position logger: show coordinate when clicked on map
    // Note: coordinate is with respect to svg, DOES NOT SUPPORT ZOOM
    /*
    this.jqView.mousedown(function(event) {
        var p = utils.getOffset(event, $(this));
        var x = p[0], y = p[1];
        var a = [x / 500 * 100, (500 - y) / 500 * 100];
        a[0] = parseFloat(a[0].toFixed(1));
        a[1] = parseFloat(a[1].toFixed(1));
        console.log('pos: [' + a[0] + ', ' + a[1] + '],');
    });
    */

    var mapvis = this;
    var mouseModes = this.mouseModes;

    var endHandler = function(event) {
      // Perform range select in the map
      if (mapvis.mouseMode == mouseModes.RANGE_SELECT) {
        mapvis.jqSelectRange.hide();
        var selects = mapvis.getRangeSelection();
        tracker.setSelects(selects);
        mapvis.render();
      }
      mapvis.mouseMode = mouseModes.NONE;
    };

    $('body')
      .keydown(function(event) {
          if (event.which == utils.KeyCodes.CTRL) {
            mapvis.ctrlDown = true;
          }
        })
      .keyup(function(event) {
          if (event.which == utils.KeyCodes.CTRL) {
            mapvis.ctrlDown = false;
          }
        })
      .mouseup(function(event) {
          // clean up the keypress
          mapvis.ctrlDown = false;
        });

    this.jqView
      .mousedown(function(event) {
          if (!mapvis.ctrlDown) return;
          event.preventDefault();
          if (mapvis.mouseMode == mouseModes.NONE) {
            mapvis.mouseMode = mouseModes.RANGE_SELECT;
            mapvis.startPos = utils.getOffset(event, $(this));
          }
        })
      .mousemove(function(event) {
          if (mapvis.mouseMode != mouseModes.RANGE_SELECT) return;
          mapvis.endPos = utils.getOffset(event, $(this));

          mapvis.updateSelectRange();
        })
      .mouseleave(endHandler)
      .mouseup(endHandler);

    var zoomHandler = function() {
      if (mapvis.mouseMode == mouseModes.RANGE_SELECT) {
        // Do not zoom when making selection
        mapvis.zoom.scale(mapvis.zoomScale);
        mapvis.zoom.translate(mapvis.zoomTranslate);
        return;
      }
      mapvis.mouseMode = mouseModes.ZOOM;
      var translate = d3.event.translate,
          scale = d3.event.scale,
          w = mapvis.svgSize[0],
          h = mapvis.svgSize[1];
      translate[0] = Math.max(w * (1 - scale), translate[0]);
      translate[1] = Math.max(h * (1 - scale), translate[1]);
      translate[0] = Math.min(0, translate[0]);
      translate[1] = Math.min(0, translate[1]);

      mapvis.zoomTranslate = translate;
      mapvis.zoomScale = scale;

      mapvis.zoom.translate(translate);
      mapvis.svg.select('g').attr('transform',
          'translate(' + translate + ') ' +
          'scale(' + scale + ')'
      );

      mapvis.render();
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
      var x = data[id][1], y = data[id][2];
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
    mapvis.jqSelectRange.show();
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
   * Set the movement data
   * @param {Object<pid, [time, event, x, y]} data
   */
  setMoveData: function(data) {
    this.moveData = data;
  },

  /**
   * Set the position data
   * @param {Object<pid, [event, x, y]} data [[Description]]
   */
  setPositionData: function(data) {
    this.posData = data;
  },


  /**
   * Wrapper of render functions
   */
  render: function() {
    this.renderMoves();
    this.renderPositions();
    this.renderLabels();
  },


  /**
   * Render the given move data. All previous data is cleared.
   * @this {mapvis}
   */
  renderMoves: function() {
    // clear previous paths
    this.svgPath.selectAll('*').remove();
    if (!vastcha15.settings.showMove) return;

    var data = this.moveData;
    this.moveData = data;
    console.log('rendering', utils.size(data), 'moves');

    var line = d3.svg.line().interpolate('linear');
    for (var id in data) {
      var points = [], as = data[id];
      for (var i = 0; i < as.length; i++) {
        points.push([this.xScale(as[i][2]), this.yScale(as[i][3])]);
      }
      var color = 'rgb(' + utils.randArray(3, [0, 255], true).join(',') + ')';
      this.svgPath.append('path')
          .attr('d', line(points))
          .style('stroke', color);
    }
  },

  /**
   * Render the positions of people at the current time point (exact).
   * @this {mapvis}
   */
  renderPositions: function() {
    // clear previous
    this.svgPos.selectAll('*').remove();
    //console.log('rendering', utils.size(data), 'positions');

    var data = this.posData,
        margin = this.renderMargin;
    var scale = this.zoomScale,
        translate = this.zoomTranslate;

    for (var pid in data) {
      var p = data[pid];
      var event = p[0],
          x = this.xScale(p[1]),
          y = this.yScale(p[2]);

      var pScreen = utils.projectPoint([x, y], translate, scale);
      if (!utils.fitRange(pScreen,
          [[0, this.svgSize[0]], [0, this.svgSize[1]]],
          margin)) {
        continue;
      }

      var r = this.posSize / scale, c;
      if (event == 1) {
        c = this.svgPos.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', this.posSize / scale)
          .style('stroke-width', this.posStrokeWidth / scale);
      } else {
        c = this.svgPos.append('rect')
            .attr('x', x - r)
            .attr('y', y - r)
            .attr('width', 2 * r)
            .attr('height', 2 * r)
            .style('stroke-width', this.posStrokeWidth / scale);
      }


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
    this.jqPos.find('.pos-selectP').appendTo(this.jqPos);
    this.jqPos.find('.pos-target').appendTo(this.jqPos);
  },

  /**
   * Show rawIds on the map
   */
  renderLabels: function() {
    // clear previous people
    this.svg.select('.map-ids').remove();
    if (!vastcha15.settings.showMapId) return;

    var data = this.posData,
        margin = this.renderMargin;
    var g = this.svg.append('g')
      .classed('map-ids', true);

    var scale = this.zoomScale,
        translate = this.zoomTranslate;

    for (var pid in data) {
      var p = data[pid];
      var x = this.xScale(p[1]),
          y = this.yScale(p[2]);

      var pScreen = utils.projectPoint([x, y], translate, scale);
      if (!utils.fitRange(pScreen,
          [[0, this.svgSize[0]], [0, this.svgSize[1]]],
          margin)) {
        continue;
      }

      g.append('text')
        .attr('x', pScreen[0] + 5)
        .attr('y', pScreen[1] + 5)
        .text(meta.mapPid[pid]);
    }
  },

  /**
   * Remove rawIds shown in the map
   */
  clearLabels: function() {
    this.svg.select('.map-ids').remove();
  },

  /**
   * Render the park map behind the scene.
   * @this {mapvis}
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
