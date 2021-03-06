
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

  /** Settings */
  // 0: hide, 1: transparent map, 2: show
  showMap: 2,
  // 0: hide, 1: transparent pos, 2: show
  showPos: 2,
  showFacitlies: false,
  showMove: false,
  showLabels: false,

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
  mapNames: ['Map', 'TransMap', 'Map'],
  posNames: ['Pos', 'TransPos', 'Pos', 'Heatmap'],
  mouseMode: 0, // mouseModes.NONE
  startPos: [0, 0],
  endPos: [0, 0],
  selectRange: [[0, 0], [0, 0]],

  /**
   * Compute the context of the rendering
   * upon initialization or screen resize.
   * @this {mapvis}
   */
  context: function() {
    this.svg = d3.select('#map-svg > g');
    this.svgPath = this.svg.select('#path');
    this.svgPos = this.svg.select('#pos');
    this.svgId = d3.select('#map-svg > #map-ids');
    this.jqPanel = $('#map-panel');
    this.jqView = $('#map-view');
    this.jqSvg = $('#map-svg');
    this.jqPath = this.jqSvg.find('#path');
    this.jqPos = this.jqSvg.find('#pos');
    this.jqMap = this.jqSvg.find('#parkMap');
    this.jqHeatmap = this.jqView.find('#heatmap');
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

    this.ui();
    this.interaction();
  },


  /**
   * Setter functions for rendering options.
   * @param {boolean} state
   */
  setShowMap: function(state) {
    var oldState = this.showMap;
    if (state == undefined)
      state = (oldState + 1) % this.mapNames.length;
    this.showMap = state;
    if (!state) {
      this.btnMap
        .removeClass('label-primary')
        .addClass('label-default');
    } else {
      this.btnMap
        .removeClass('label-default')
        .addClass('label-primary');;
    }
    this.btnMap.text(this.mapNames[state]);
    this.svg.select('#parkmap')
      .classed('transparent' + state, true)
      .classed('transparent' + oldState, false);
  },
  setShowPos: function(state) {
    var oldState = this.showPos;
    if (state == undefined)
      var state = (oldState + 1) % 4;
    this.showPos = state;
    if (!state) {
      this.btnPos
        .removeClass('label-primary')
        .addClass('label-default');
      this.clearPos();
    } else {
      this.btnPos
        .removeClass('label-default')
        .addClass('label-primary');
    }
    this.btnPos.text(this.posNames[state]);
    if (state)
      vastcha15.getAndRenderPositions(true);
  },
  setShowMove: function(state) {
    if (state == undefined)
      state = !this.showMove;
    this.showMove = state;
    if (!state) {
      this.clearMoves();
      this.btnMove.removeClass('label-primary');
    } else {
      vastcha15.getAndRenderMoves();
      this.btnMove.addClass('label-primary');
    }
    if (state)
      vastcha15.getAndRenderMoves(true);
  },

  /**
   * Setup ui for mapvis.
   */
  ui: function() {
    var mapvis = this;
    this.btnMap = $('#check-trans-map')
      .click(function(event) {
        mapvis.setShowMap();
      });
    this.btnPos = $('#check-pos')
      .click(function(event) {
        mapvis.setShowPos();
      });
    this.btnMove = $('#check-move')
      .click(function(event) {
        mapvis.setShowMove();
      });

    $('#check-mapid').click(function(event) {
      var state = !mapvis.showLabels;
      mapvis.showLabels = state;
      if (!state) {
        mapvis.clearLabels();
        $(this).removeClass('label-primary');
      } else {
        mapvis.renderLabels();
        $(this).addClass('label-primary');
      }
    });

    $('#check-facility').click(function(event) {
      var state = !mapvis.showFacilities;
      mapvis.showFacilities = state;
      if (!state) {
        mapvis.clearFacilities();
        $(this).removeClass('label-primary');
      } else {
        mapvis.renderFacilities();
        $(this).addClass('label-primary');
      }
    });
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
      console.info('pos: [' + x + ', ' + y + '],');
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
      }
      mapvis.mouseMode = mouseModes.NONE;
    };

    this.jqView
      .mousedown(function(event) {
          if (!vastcha15.keys.ctrl) return true;
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
    for (var pid in data) {
      var p = this.fitScreen(this.projectScreen(data[pid]));
      if (p != null && utils.fitRange(p, this.selectRange)) {
        selected.push(pid);
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
    this.renderFacilities();
  },
  /**
   * Highlight / unhighlight hovered person
   */
  updateHover: function(pid) {
    var r = this.posSize / this.zoomScale;
    var e = this.svgPos.select('#p' + pid);
    var isTarget = tracker.targeted[pid];
    if (!e.empty()) {
      var p = this.projectScreen(this.posData[pid]);
      if ($(e.node()).prop('tagName') == 'rect') {
        e.attr('x', p[0] - r * 2)
         .attr('y', p[1] - r * 2)
         .attr('width', r * 4)
         .attr('height', r * 4);
      } else {
        e.attr('r', r * 2);
      }
      if (!isTarget) {
        e.classed('pos-hover', true);
      }
    }
    e = this.svgPath.select('#l' + pid);
    if (!e.empty()) {
      if (!isTarget) {
        e.classed('path-hover-color', true);
      }
      e.classed('path-hover', true)
       .style('stroke-width', '')
       .style('opacity', 1.0);
    }
    this.jqPos.find('#p' + pid).appendTo(this.jqPos);
    this.jqPath.find('#l' + pid).appendTo(this.jqPath);
    this.renderJqLabel(pid);
  },
  clearHover: function(pid) {
    var r = this.posSize / this.zoomScale;
    var e = this.svgPos.select('#p' + pid);
    var isTarget = tracker.targeted[pid];
    if (!e.empty()) {
      if ($(e.node()).prop('tagName') == 'rect') {
        var p = this.projectScreen(this.posData[pid]);
        e.attr('x', p[0] - r)
         .attr('y', p[1] - r)
         .attr('width', r * 2)
         .attr('height', r * 2);
      } else {
        e.attr('r', r);
      }
      if (!isTarget) {
        e.classed('pos-hover', false);
      }
    }
    e = this.svgPath.select('#l' + pid);
    if (!e.empty()) {
      if (!isTarget) {
        e.classed('path-hover-color', false);
      }
      e.classed('path-hover', false)
       .style('stroke-width', 2 / this.zoomScale)
       .style('opacity', '');
    }
    this.removeJqLabel();
  },
  /** Hover of facilities */
  updateHoverFid: function(fid) {
    if (!this.showFacilities) return;
    this.jqFacilities.find('#f' + fid)
      .addClass('map-facility-hover');
  },
  clearHoverFid: function(fid) {
    if (!this.showFacilities) return;
    this.jqFacilities.find('#f' + fid)
      .removeClass('map-facility-hover');
  },


  /**
   * Render the given move data. All previous data is cleared.
   */
  renderMoves: function() {
    // clear previous paths
    this.svgPath.selectAll('*').remove();
    if (!this.showMove) return;

    var data = this.moveData;
    this.moveData = data;
    //console.log('rendering', utils.size(data), 'moves');

    var line = d3.svg.line().interpolate('cardinal');
    for (var pid in data) {
      var points = [], as = data[pid];
      for (var i = 0; i < as.length; i++) {
        points.push([this.xScale(as[i][2]), this.yScale(as[i][3])]);
      }
      var e = this.svgPath.append('path')
          .attr('id', 'l' + pid)
          .attr('d', line(points))
          .style('stroke-width', 2 / this.zoomScale);
      if (tracker.selected[pid])
        e.classed('path-select', true);
      else if (tracker.selectedP[pid])
        e.classed('path-selectP', true);
      else if (tracker.targeted[pid])
        e.classed('path-target', true);
    }
    this.jqPath.find('.path-select').appendTo(this.jqPath);
    this.jqPath.find('.path-selectP').appendTo(this.jqPath);
    this.jqPath.find('.path-target').appendTo(this.jqPath);
  },

  /**
   * Clear position rendering.
   */
  clearPos: function() {
    this.svgPos.selectAll('*').remove();
    this.jqHeatmap.children().remove(); // clear heatmap
  },

  /**
   * Render the positions of people at the current time point (exact).
   * @this {mapvis}
   */
  renderPositions: function() {
    this.clearPos();
    //console.log('rendering', utils.size(data), 'positions');
    if (this.showPos == 0) return;
    if (this.showPos == 3) {
      this.renderHeatmap_();
      return;
    } else {
      this.jqHeatmap.css('display', 'none');
    }
    this.renderLabels();

    var data = this.posData,
        margin = this.renderMargin;
    var scale = this.zoomScale,
        translate = this.zoomTranslate;
    var groupInfo = meta.groupInfo;

    for (var pid in data) {
      var p = this.projectScreen(data[pid]);
      if (this.fitScreen(p) == null) continue;
      var event = data[pid][2];
      var x = p[0], y = p[1];

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
        var id = d3.event.target.id.substr(1);
        tracker.setHoverPid(id);
      })
      .on('mouseout', function() {
            tracker.setHoverPid(null);
          })
      .on('mousedown', function() {
            var id = d3.event.target.id.substr(1);
            tracker.toggleSelect(id);
          });

      if (this.showPos == 1) {
        var opacity = 0.25;
        if (meta.isGroup(pid))
          opacity *= meta.sizeGroup(pid);
        e.style('opacity', opacity);
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
    this.jqPos.find('.pos-target').appendTo(this.jqPos);
  },

  /**
   * Render the positions using heatmap
   * @private
   */
  renderHeatmap_: function() {
    this.jqHeatmap.css({
      width: this.svgSize[0],
      height: this.svgSize[1],
      display: ''
    });
    var heatmap = h337.create({
      container: this.jqHeatmap[0]
    });
    var data = this.posData;
    var list = [];
    for (var pid in data) {
      var p = this.projectAndFitScreen(data[pid]);
      if (p == null) continue;

      var value = 1;
      var groupInfo = meta.groupInfo;
      if (meta.isGroup(pid))
        value = meta.sizeGroup(pid);

      list.push({
        x: p[0],
        y: p[1],
        value: value,
        radius: 25
      });
    }
    heatmap.setData({
      data: list,
      max: 100, //50 / this.zoomScale
    });
    this.jqHeatmap
      .css({
          top: '0px',
          position: 'absolute'
        });
  },

  /** Show / hide facilities on the map. */
  renderFacilities: function() {
    this.clearFacilities();
    if (!this.showFacilities) return;
    var facilities = meta.facilities;
    for (var key in facilities) {
      var faci = facilities[key];
      var pos = [].concat(faci.pos);
      var p = this.projectAndFitScreen(pos);
      if (p == null) continue;
      var e = $('<div data-toggle="tooltip"></div>')
        .addClass('map-facility glyphicon')
        .addClass(this.glyphiconFacilities[faci.type])
        .css({
            left: p[0] - 10,
            top: p[1] - 10
          })
        .attr('id', 'f' + faci.id)
        .attr('title', faci.id + ': ' + faci.name + ' (' + faci.type + ')')
        .appendTo(this.jqFacilities);

      if (tracker.selectedFaci[faci.id]) {
        e.addClass('map-facility-chosen');
      }

      e.mouseenter(function(event) {
        $(this).appendTo(mapvis.jqFacilities);
      })
      e.click(function(event) {
        var fid = $(this).attr('id').substr(1);
        $(this).toggleClass('map-facility-chosen');
        tracker.toggleFaci(fid);
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
    if (p == undefined) return;
    var pScreen = this.projectAndFitScreen(p);
    if (pScreen == null) return;
    var e = $('<div></div>')
      .text(pid)
      .css({
          left: pScreen[0] + 15,
          top: pScreen[1] - 10
        })
      .addClass('vis-label')
      .appendTo(this.jqView)
      .click(function() {
        $(this).remove();
      });
    if (pScreen[0] + 15 + e.width() > this.svgSize[0]) {
      e.css('left', pScreen[0] - e.width() - 15);
    }
  },
  removeJqLabel: function() {
    this.jqView.find('.vis-label').remove();
  },
  renderLabel: function(pid) {
    var p = this.posData[pid];
    var pScreen = this.projectAndFitScreen(p);
    if (pScreen == null) return;
    this.svgId.append('text')
      .attr('x', pScreen[0] + 5)
      .attr('y', pScreen[1] + 5)
      .text(pid);
  },
  renderLabels: function() {
    // clear previous people
    this.clearLabels();
    if (!this.showLabels) return;
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
  clearMoves: function() {
    this.svgPath.selectAll('*').remove();
  },


  /**
   * Project a point to screen using the scales.
   * @param {Array<number>} p A point
   */
  projectScreen: function(p) {
    return [this.xScale(p[0]), this.yScale(p[1])];
  },
  /**
   * Check if a projected point fits the screen under the current zoom.
   * @param {Array<number>} p A point
   * @return {Array<number>|null}
   *   Return a zoomed point if the point fits in screen.
   *   Otherwise return null.
   */
  fitScreen: function(p) {
    var pScreen = utils.projectPoint(p,
        this.zoomTranslate, this.zoomScale);
    if (!utils.fitRange(pScreen,
        [[0, this.svgSize[0]], [0, this.svgSize[1]]],
        this.renderMargin)) return null;
    return pScreen;
  },
  /** Wrapper of projectScreen and fitScreen */
  projectAndFitScreen: function(p) {
    return this.fitScreen(this.projectScreen(p));
  }
};
