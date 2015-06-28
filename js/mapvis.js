
'use strict';

var mapvis = {

  /** @const */
  posSize: 4,
  posStrokeWidth: 1,
  svgSize: [0, 0],
  // a person is drawn as long as she is within margin distance to the viewport
  renderMargin: 10,

  /** @enum */
  mouseModes: {
    NONE: 0,
    RANGE_SELECT: 1,
    ZOOM: 2
  },
  /** @const {string} */
  glyphiconFacilities: {
    'Thrill Rides': 'glyphicon-star',
    'Kiddie Rides': 'glyphicon-star-empty',
    'Rides for Everyone': 'glyphicon-heart',
    'Food': 'glyphicon-cutlery',
    'Restrooms': 'glyphicon-refresh',
    'Beer Gardens': 'glyphicon-filter',
    'Shopping': 'glyphicon-shopping-cart',
    'Shows & Entertainment': 'glyphicon-blackboard',
    'Information & Assistance': 'glyphicon-bullhorn'
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
    this.svgId = d3.select('#svg-move > #map-ids');
    this.jqView = $('#map-view');
    this.jqSvg = $('#svg-move');
    this.jqPath = this.jqSvg.find('#path');
    this.jqPos = this.jqSvg.find('#pos');
    this.jqMap = this.jqSvg.find('#parkMap');
    this.jqFacilities = this.jqView.find('#facility');
    this.jqSelectRange = this.jqView.find('.select-range');

    var width = this.jqSvg.width(),
        height = this.jqSvg.height();
    this.svgSize = [width, height];
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
   * Position logger: show coordinate when clicked on map
   */
  positionLogger: function() {
    this.jqView.mousedown(function(event) {
      var p = utils.getOffset(event, $(this));
      var x = p[0], y = p[1];
      x -= mapvis.zoomTranslate[0];
      y -= mapvis.zoomTranslate[1];
      x /= mapvis.zoomScale;
      y /= mapvis.zoomScale;
      x = mapvis.xScale.invert(x);
      y = mapvis.yScale.invert(y);
      x = parseFloat(x.toFixed(9));
      y = parseFloat(y.toFixed(9));
      console.log('pos: [' + x + ', ' + y + '],');
    });
  },

  /**
   * Setup map interaction.
   */
  interaction: function() {
    //this.positionLogger();

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
    this.renderFacilities();
  },
  /**
   * Highlight / unhighlight hovered person
   */
  updateHover: function(pid) {
    var r = this.posSize / this.zoomScale;
    var e = this.svgPos.select('#p' + pid);
    if (e.empty()) return;
    var x = + e.attr('x'), y = + e.attr('y');
    if ($(e.node()).prop('tagName') == 'rect') {
      e.attr('x', x - r)
       .attr('y', y - r)
       .attr('width', r * 4)
       .attr('height', r * 4);
    } else {
      e.attr('r', r * 2);
    }
    if (!tracker.targeted[pid]) {
      e.classed('pos-hover', true);
    }
    this.jqPos.find('#p' + pid).appendTo(this.jqPos);
    this.renderJqLabel(pid);
  },
  clearHover: function(pid) {
    var r = this.posSize / this.zoomScale;
    var e = this.svgPos.select('#p' + pid);
    if (e.empty()) return;

    if ($(e.node()).prop('tagName') == 'rect') {
      var x = + e.attr('x'), y = + e.attr('y');
      e.attr('x', x + r)
       .attr('y', y + r)
       .attr('width', r * 2)
       .attr('height', r * 2);
    } else {
      e.attr('r', r);
    }
    if (!tracker.targeted[pid]) {
      e.classed('pos-hover', false);
    }
    this.removeJqLabel(pid);
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
    if (vastcha15.settings.showPos == 0) return;

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
          margin)) continue;

      var r = this.posSize / scale, e;
      if (event == 1) {
        e = this.svgPos.append('circle')
          .attr('id', 'p' + pid)
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', this.posSize / scale)
          .style('stroke-width', this.posStrokeWidth / scale);
      } else {
        e = this.svgPos.append('rect')
          .attr('id', 'p' + pid)
          .attr('x', x - r)
          .attr('y', y - r)
          .attr('width', 2 * r)
          .attr('height', 2 * r)
          .style('stroke-width', this.posStrokeWidth / scale);
      }
      e.on('mouseover', function() {
        var id = d3.event.target.id;
        tracker.setHoverPid(id.substr(1));
      })
      .on('mouseout', function() {
        tracker.setHoverPid(null);
      });

      if (vastcha15.settings.showPos == 1) {
        e.style('opacity', 0.25);
      }

      if (tracker.targeted[pid]) {
        e.classed('pos-target', true);
      } else if (tracker.selectedP[pid]) {
        e.classed('pos-selectP', true);
      } else if (tracker.selected[pid]) {
        e.classed('pos-select', true);
      }
    }

    // reorder the important people so that they appear on top others
    this.jqPos.find('.pos-select').appendTo(this.jqPos);
    this.jqPos.find('.pos-selectP').appendTo(this.jqPos);
    this.jqPos.find('.pos-selectP').appendTo(this.jqPos);
    this.jqPos.find('.pos-target').appendTo(this.jqPos);
  },

  /** Show / hide facilities on the map. */
  renderFacilities: function () {
    this.clearFacilities();
    if (!vastcha15.settings.showFacilities) return;
    var facilities = meta.facilities;
    for (var key in facilities) {
      var faci = facilities[key];
      var pos = [].concat(faci.pos);
      pos[0] = this.xScale(pos[0]);
      pos[1] = this.yScale(pos[1]);
      var pScreen = utils.projectPoint(pos, this.zoomTranslate, this.zoomScale);
      if (!utils.fitRange(pScreen, [[0, this.svgSize[0]], [0, this.svgSize[1]]],
          this.renderMargin)) continue;
      var e = $('<div data-toggle="tooltip"></div>')
        .addClass('map-facility glyphicon')
        .css({
          left: pScreen[0] - 10,
          top: pScreen[1] - 10
        })
        .attr('title', faci.name + ' (' + faci.type + ')')
        .appendTo(this.jqFacilities);
      e.addClass(this.glyphiconFacilities[faci.type]);
      e.mouseenter(function(event) {
        $(this).appendTo(mapvis.jqFacilities);
      });
    }
  },
  clearFacilities: function() {
    this.jqFacilities.children().remove();
  },

  /**
   * Show pid on the map
   */
  renderJqLabel: function(pid) {
    var p = this.posData[pid];
    var x = this.xScale(p[1]),
        y = this.yScale(p[2]);
    var pScreen = utils.projectPoint([x, y], this.zoomTranslate, this.zoomScale);
    $('<div></div>')
      .text(pid)
      .css({
        left: pScreen[0] + 15,
        top: pScreen[1] - 10
      })
      .addClass('map-label')
      .appendTo(this.jqView);
  },
  removeJqLabel: function(pid) {
    this.jqView.find('.map-label:contains(' + pid + ')').remove();
  },
  renderLabel: function(pid) {
    var p = this.posData[pid];
    var x = this.xScale(p[1]),
        y = this.yScale(p[2]);
    var pScreen = utils.projectPoint([x, y], this.zoomTranslate, this.zoomScale);
    if (!utils.fitRange(pScreen,
        [[0, this.svgSize[0]], [0, this.svgSize[1]]],
        this.renderMargin)) return;
    this.svgId.append('text')
      .attr('x', pScreen[0] + 5)
      .attr('y', pScreen[1] + 5)
      .text(pid);
  },
  renderLabels: function() {
    // clear previous people
    this.clearLabels();
    if (!vastcha15.settings.showMapId) return;
    for (var pid in this.posData) {
      this.renderLabel(pid);
    }
  },

  /** Remove pids shown on the map */
  clearLabels: function() {
    this.svgId.selectAll('*').remove();
  },

  /** Render the park map behind the scene. */
  renderParkMap: function() {
    this.jqMap.prependTo(this.svg);
  },

  /** Clear the move rendering. */
  clearMove: function() {
    this.svgPath.selectAll('*').remove();
  }
};
