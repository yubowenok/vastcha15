
'use strict';

var msgvis = {

  /** @enum {number} */
  Layouts: {
    MAP_LAYOUT: 0,
    FORCE_LAYOUT: 1
  },

  /** @const {Array<string>} */
  VolSizeNames: [
    'none',
    'send',
    'receive',
    'both'
  ],
  DirectionNames: [
    'send',
    'receive',
    'both'
  ],

  /** @const */
  svgSize: [0, 0],
  nodeSize: 4,
  nodeStrokeWidth: 2,
  renderMargin: 10,
  NODE_SIZE_RATIO: 0.02,
  CHARGE_FACTOR: 2.0,
  MIN_EDGE_WIDTH: 0.5,
  // The factor of how far the curve is to its staright segment
  EDGE_CURVE_SHIFT: 0.05,
  // Force parameters
  FORCE_FRICTION: 0.8,
  FORCE_LINK_DISTANCE: 30,
  FORCE_LINK_STRENGTH: 0.5,
  FORCE_ALPHA: 0.1,

  /** Interaction state */
  zoomScale: 1.0,
  zoomTranslate: [0, 0],

  /** Directed weighted graph representing communication volume. */
  volumeData: {},
  /** @type {Object<number, number>} Node sizes */
  sizeData: {},

  nodeIds: {},
  // Nodes in the view, for fetching node info.
  // There may be empty entries in the array.
  nodes: [],
  // Nodes array specifically for d3.
  // There cannot be empty entries in the array.
  nodesD3: [],
  edges: [], // edges, for d3 force
  force: null, // d3 force
  newForce: true,

  /** Settings */
  showLabels: false,
  showSizes: true,
  show: true,
  layout: 1,
  volSize: 1,
  direction: 0,
  showHeatmap: false,
  showEdge: true,
  selonly: true,

  /** Setup the context */
  context: function() {
    this.svg = d3.select('#comm-svg > g');
    this.svgNode = this.svg.select('#node');
    this.svgEdge = this.svg.select('#edge');
    this.svgId = d3.select('#comm-svg #comm-ids');

    this.jqView = $('#comm-view');
    this.jqSvg = $('#comm-svg');
    this.jqNode = this.jqSvg.find('#node');
    this.jqEdge = this.jqSvg.find('#edge');
    this.jqHeatmap = this.jqView.find('#heatmap');
    this.jqHeader = $('#comm-panel > .panel-heading');
    this.jqSelectRange = this.jqView.find('.select-range');

    var width = this.jqSvg.width(),
        height = this.jqSvg.height();
    this.svgSize = [width, height];

    this.ui();
    this.interaction();
  },

  /**
   * Set the communication volume data.
   * @param {Object<pid, Object<pid, number>>} data
   */
  setVolumeData: function(data) {
    this.volumeData = data;
    var pids = {};
    var edges = [];
    for (var a in data) {
      var es = data[a];
      pids[a] = true;
      for (var b in es) {
        pids[b] = true;
        edges.push([a, b, es[b]]);
      }
    }

    // Some nodes may not be present in this.nodes.
    // So we create them first.
    this.nodesD3 = [];
    for (var pid in pids) {
      if (this.nodes[pid] == undefined) {
        this.nodes[pid] = {
          pid: pid,
          pos: [0, 0],
          x: Math.random() * this.svgSize[0],
          y: Math.random() * this.svgSize[1],
          size: 1
        };
        if (this.sizeData[pid] != null) {
          this.nodes[pid].size = this.sizeData[pid];
        }
      }

      if (this.selonly) {
        if (!tracker.selected[pid] &&
            !tracker.targeted[pid]) continue;
      }

      this.nodesD3.push(this.nodes[pid]);
    }

    // Convert the edges so that they link to the node objects.
    // At this point every endpoint of an edge must already
    // have a node object created.
    this.edges = [];
    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];

      if (this.selonly) {
        if (!tracker.selected[edge[0]] &&
            !tracker.targeted[edge[0]]) continue;
        if (!tracker.selected[edge[1]] &&
            !tracker.targeted[edge[1]]) continue;
      }

      this.edges.push({
        source: this.nodes[edge[0]],
        target: this.nodes[edge[1]],
        weight: edge[2]
      });
    }

    this.nodeIds = pids;
    this.newForce = true;
  },

  /**
   * Set the size data used for showing nodes.
   * Data comes from segmented volume queries, which shall
   * contain exactly 1 segment for each pid.
   */
  setSizeData: function(data) {
    this.sizeData = {};
    for (var pid in data) {
      var vol = data[pid][0][1];
      if (vol == 0) continue;
      this.sizeData[pid] = vol;
      if (this.nodes[pid] != null) {
        this.nodes[pid].size = vol;
      }
    }
    if (this.layout == this.Layouts.FORCE_LAYOUT && this.force) {
      this.force.start();
    }
  },

  /**
   * Set the show state
   * @param {boolean} state
   *   If not given, toggle the state.
   */
  setShow: function(state) {
    if (state == undefined) state = !this.show;
    this.show = state;
    if (!state) {
      this.clearVolumes();
      $(this).removeClass('label-primary')
        .addClass('label-default')
        .text('Off');
    } else {
      vastcha15.getAndRenderMessageVolumes();
      $(this).addClass('label-primary')
        .removeClass('label-default')
        .text('On');
      this.clear();
    }
  },

  /**
   * Setup ui for msgvis.
   */
  ui: function() {
    this.jqHeader.find('#check-volume').click(function(event) {
      msgvis.setShow();
    });

    this.jqHeader.find('#check-layout').click(function(event) {
      var state = msgvis.layout;
      state = (state + 1) % 2;
      msgvis.layout = state;
      if (!state) {
        $(this).text('Map');
        msgvis.jqView.find('#parkmap').css('opacity', 0.1);
      } else {
        $(this).text('Force');
        msgvis.jqView.find('#parkmap').css('opacity', 0.0);
      }
      msgvis.render();
    });

    this.jqHeader.find('#check-nodeid').click(function(event) {
      var state = !msgvis.showLabels;
      msgvis.showLabels = state;
      if (!state) {
        msgvis.clearLabels();
        $(this).removeClass('label-primary')
          .addClass('label-default');
      } else {
        msgvis.renderLabels();
        $(this).addClass('label-primary')
          .removeClass('label-default');
      }
    });

    this.jqHeader.find('#check-volsize').click(function(event) {
      var state = msgvis.volSize;
      state = (state + 1) % msgvis.VolSizeNames.length;
      msgvis.volSize = state;
      if (!state) {
        msgvis.clearSizes();
        $(this).removeClass('label-primary')
          .addClass('label-default')
          .text('Size');
      } else {
        vastcha15.getAndRenderVolumeSizes();
        $(this).addClass('label-primary')
          .removeClass('label-default')
          .text('Size: ' +
                utils.camelize(msgvis.VolSizeNames[state]));
      }
    });

    this.jqHeader.find('#check-voldir').click(function(event) {
      var state = msgvis.direction;
      state = (state + 1) % msgvis.DirectionNames.length;
      msgvis.direction = state;
      vastcha15.getAndRenderMessageVolumes();
      $(this).text('Edge: ' +
            utils.camelize(msgvis.DirectionNames[state]));
    });

    this.jqHeader.find('#check-edge').click(function(event) {
      var state = !msgvis.showEdge;
      msgvis.showEdge = state;
      $(this).toggleClass('label-primary')
        .toggleClass('label-default');
      msgvis.render();
    });

    this.jqHeader.find('#check-selonly').click(function(event) {
      var state = !msgvis.selonly;
      msgvis.selonly = state;
      $(this).toggleClass('label-primary')
        .toggleClass('label-default')
      msgvis.setVolumeData(msgvis.volumeData);
      msgvis.render();
    });

    this.jqHeader.find('#check-heatmap').click(function(event) {
      var state = !msgvis.showHeatmap;
      msgvis.showHeatmap = state;
      $(this).toggleClass('label-primary')
        .toggleClass('label-default');
      msgvis.render();
    });
  },

  /**
   * Setup the interaction
   */
  interaction: function() {
    // TODO(bowen)
    var zoomHandler = function() {
      var translate = d3.event.translate,
          scale = d3.event.scale,
          w = msgvis.svgSize[0],
          h = msgvis.svgSize[1];

      msgvis.zoomTranslate = translate;
      msgvis.zoomScale = scale;

      msgvis.zoom.translate(translate);
      msgvis.svg.select('g').attr('transform',
          'translate(' + translate + ') ' +
          'scale(' + scale + ')'
      );

      msgvis.render();
    };

    this.zoom = d3.behavior.zoom()
      .scaleExtent([0.1, 8])
      .on('zoom', zoomHandler);
    this.svg.call(this.zoom);
  },

  /**
   * Highlight / unhighlight hovered person
   */
  updateHover: function(pid) {
    if (!this.show) return;
    var r = this.nodeSize / this.zoomScale;
    var e = this.svgNode.select('#p' + pid);
    var isTarget = tracker.targeted[pid];
    if (!e.empty()) {
      e.attr('r', this.getNodeSize(pid) * 1.1);
      if (!isTarget) {
        e.classed('node-hover', true);
      }
    }
    var edgeHoverClass = tracker.targeted[pid] ?
        'edge-hover-target' : 'edge-hover';
    this.svgEdge.selectAll('.edge-hover, .edge-hover-target')
      .classed('edge-hover', false)
      .classed('edge-hover-target', false);
    for (var i = 0; i < this.edges.length; i++) {
      var edge = this.edges[i];
      if (edge.source.pid == pid || edge.target.pid == pid) {
        this.svgEdge.select('#e' + edge.source.pid + '-' + edge.target.pid)
        .classed(edgeHoverClass, true);
      }
    }
    this.jqEdge.find('.edge-hover, .edge-hover-target').appendTo(this.jqEdge);
    this.jqNode.find('#p' + pid).appendTo(this.jqNode);
    this.renderJqLabel(pid);
  },
  clearHover: function(pid) {
    var e = this.svgNode.select('#p' + pid);
    if (!e.empty()) {
      e.attr('r', this.getNodeSize(pid));
      e.classed('node-hover', false);
    }
    this.svgEdge.selectAll('.edge-hover, .edge-hover-target')
      .classed('edge-hover', false)
      .classed('edge-hover-target', false);
    this.removeJqLabel();
  },

  /**
   * Wrapper of render functions
   */
  render: function() {
    this.renderVolumes();
  },

  /**
   * Clear everything rendered
   */
  clear: function() {
    this.svgNode.selectAll('*').remove();
    this.svgEdge.selectAll('*').remove();
    this.svgId.selectAll('*').remove();
    this.jqHeatmap.children().remove();
  },

  /**
   * Get the positions for each node.
   */
  getPositions: function() {
    if (this.layout == this.Layouts.MAP_LAYOUT) {
      this.getMapPositions();
    } else if (this.layout == this.Layouts.FORCE_LAYOUT) {
      this.getForcePositions();
    }
  },
  /**
   * Get the map positions from mapvis.
   */
  getMapPositions: function() {
    if (this.force) {
      // Stop the force when layout is switched.
      this.force.stop();
    }
    var n = meta.mapPid.length, r = 75;
    for (var pid in this.nodeIds) {
      var p = mapvis.posData[pid];
      var theta = pid / n * 2 * Math.PI;
      if (p == undefined) {
        p = [r * Math.cos(theta) + 50,
             r * Math.sin(theta) + 50];
      }
      p = mapvis.projectScreen(p);
      this.nodes[pid].pos = p;
    }
  },
  /**
   * Get the positions from a force layout (this.force).
   */
  getForcePositions: function() {
    if (this.newForce) {
      if (this.force) this.force.stop();
      this.force = d3.layout.force()
        .nodes(this.nodesD3)
        .links(this.edges)
        .size(this.svgSize)
        .linkStrength(this.FORCE_LINK_STRENGTH)
        .friction(this.FORCE_FRICTION)
        .linkDistance(this.FORCE_LINK_DISTANCE)
        .charge(function(d) {
          return -d.size * msgvis.CHARGE_FACTOR;
        })
        .alpha(this.FORCE_ALPHA)
        .on('tick', function() {
            msgvis.render();
          });
      this.force.start();
      this.newForce = false;
    } else {
      for (var pid in this.nodeIds) {
        var node = this.nodes[pid];
        node.pos = [node.x, node.y];
      }
    }
  },
  /**
   * Render the message volumes into a graph.
   */
  renderVolumes: function() {
    this.getPositions();
    this.renderVolumeEdges();
    if (!this.showHeatmap) {
      this.renderVolumeNodes();
    }
    this.renderVolumeSizes();
    this.renderLabels();
  },

  /**
   * Render nodes.
   */
  renderVolumeNodes: function() {
    this.svgNode.selectAll('*').remove();
    this.jqHeatmap.children().remove();
    if (!this.show) return;
    var margin = this.renderMargin;
    var scale = this.zoomScale,
        translate = this.zoomTranslate;

    for (var pid in this.nodeIds) {
      if (this.selonly &&
          !tracker.selected[pid] && !tracker.targeted[pid])
        continue;
      var p = this.nodes[pid].pos;
      if (this.fitScreen(p, true) == null) continue;
      var x = p[0], y = p[1];

      var e = this.svgNode.append('circle')
        .attr('id', 'p' + pid)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', this.getNodeSize(pid))
        .style('stroke-width', this.nodeStrokeWidth / scale);
      e.on('mouseover', function() {
        var id = d3.event.target.id.substr(1);
        tracker.setHoverPid(id);
      })
      .on('mouseout', function() {
            tracker.setHoverPid(null);
          })
      .on('mousedown', function() {
            var id = d3.event.target.id.substr(1);
            tracker.toggleTarget(id);
          });

      if (vastcha15.settings.showPos == 1) {
        e.style('opacity', 0.25);
      }

      if (tracker.targeted[pid]) {
        e.classed('node-target', true);
      } else if (tracker.selectedP[pid]) {
        e.classed('node-selectP', true);
      } else if (tracker.selected[pid]) {
        e.classed('node-select', true);
      } else {
        e.classed('node-nonselect', true);
      }
      if (pid == tracker.hoverPid && !tracker.targeted[pid]) {
        e.classed('node-hover', true);
      }
    }

    // Reorder based on select/target status
    this.jqNode.find('.node-select').appendTo(this.jqNode);
    this.jqNode.find('.node-selectP').appendTo(this.jqNode);
    this.jqNode.find('.node-target').appendTo(this.jqPos);
  },

  /**
   * Render volume nodes in heatmap.
   */
  renderHeatmap_: function() {
    this.svgNode.selectAll('*').remove();
    this.jqHeatmap.children().remove();
    this.jqHeatmap.css({
      width: this.svgSize[0],
      height: this.svgSize[1],
      display: ''
    });
    var heatmap = h337.create({
      container: this.jqHeatmap[0]
    });
    var list = [];
    for (var i = 0; i < this.nodesD3.length; i++) {
      var node = this.nodesD3[i];
      var p = node.pos;
      p = utils.projectPoint(p, this.zoomTranslate, this.zoomScale);
      if (p == null) continue;
      var pid = node.pid;
      var value = this.sizeData[pid];
      if (value == undefined) continue; // value is zero
      list.push({
        x: p[0],
        y: p[1],
        value: value,
        radius: 25
      });
    }
    heatmap.setData({
      data: list,
      max: 50 / this.zoomScale
    });
    this.jqHeatmap
      .css({
          top: '0px',
          position: 'absolute'
        });
  },

  /**
   * Edge width function.
   */
  edgeWidth: function(w) {
    return this.MIN_EDGE_WIDTH + Math.log(w);
  },

  /**
   * Render edges.
   */
  renderVolumeEdges: function() {
    this.svgEdge.selectAll('*').remove();
    if (!this.show || !this.showEdge) return;
    var data = this.volumeData;
    var line = d3.svg.line().interpolate('basis');

    for (var i = 0; i < this.edges.length; i++) {
      var edge = this.edges[i];
      var pa = edge.source.pos,
          pb = edge.target.pos,
          w = edge.weight;

      if (pa == null || pb == null) {
        console.log('null positions detected');
      }

      // Some people may be at exactly the same point...
      if (utils.equalVector(pa, pb)) continue;

      // Render an edge from pa to pb
      var m = utils.middlePoint(pa, pb);
      var d = utils.subtractVector(pb, pa);
      d = utils.perpVector(d);
      d = utils.normalizeVector(d);
      d = utils.multiplyVector(d, utils.distVector(pa, pb) *
                              msgvis.EDGE_CURVE_SHIFT);
      m = utils.addVector(m, d);

      var points = [pa, m, pb];
      var e = this.svgEdge.append('path')
        .attr('id', 'e' + edge.source.pid + '-' + edge.target.pid)
        .attr('d', line(points))
        .style('stroke-width', this.edgeWidth(w) / this.zoomScale);

      if (edge.source.pid == tracker.hoverPid ||
          edge.target.pid == tracker.hoverPid) {
        if (tracker.targeted[tracker.hoverPid]) {
          e.classed('edge-hover-target', true);
        } else {
          e.classed('edge-hover', true);
        }
      }
    }
  },

  /**
   * Get the current node size for a given pid.
   * @param {number} pid
   */
  getNodeSize: function(pid) {
    var r = this.nodeSize / this.zoomScale;
    if (this.showSizes) {
      if (this.sizeData[pid] != undefined)
        return r + this.sizeData[pid] * this.NODE_SIZE_RATIO;
    }
    return r;
  },

  /**
   * Set node size based on volumeSize data.
   * This only affects nodes already drawn.
   */
  renderVolumeSizes: function() {
    if (!this.showSizes) return;
    if (this.showHeatmap) {
      this.renderHeatmap_();
      return;
    }
    for (var pid in this.sizeData) {
      this.svgNode.select('#p' + pid)
        .attr('r', this.getNodeSize(pid));
    }
  },

  /** Clear the volume graph */
  clearVolumes: function() {
    this.svgNode.selectAll('*').remove();
    this.svgEdge.selectAll('*').remove();
  },

  /**
   * Reset all node sizes to default values.
   */
  clearSizes: function() {
    var r = this.nodeSize / this.zoomScale;
    this.svgNode.selectAll('circle')
      .attr('r', r);
  },

  /**
   * Show pid on the map
   */
  renderJqLabel: function(pid) {
    if (this.nodes[pid] == undefined ||
        this.nodes[pid].pos == undefined) return;
    if (this.selonly &&
        !tracker.selected[pid] && !tracker.targeted[pid]) return;
    var p = this.nodes[pid].pos;
    p = this.fitScreen(p);
    if (p == null) return;
    $('<div></div>')
      .text(pid)
      .css({
          left: p[0] + 15,
          top: p[1] - 10
        })
      .addClass('vis-label')
      .appendTo(this.jqView)
      .click(function() {
          $(this).remove();
        });
  },
  removeJqLabel: function() {
    this.jqView.find('.vis-label').remove();
  },

  /**
   * Render svg labels.
   */
  renderLabel: function(pid) {
    if (this.nodes[pid] == undefined ||
        this.nodes[pid].pos == undefined) return;
    var p = this.nodes[pid].pos;
    var pScreen = this.fitScreen(p);
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
    for (var i = 0; i < this.nodesD3.length; i++) {
      this.renderLabel(this.nodesD3[i].pid);
    }
  },

  /** Remove pids shown on the map */
  clearLabels: function() {
    this.svgId.selectAll('*').remove();
  },

  /**
   * Check if a projected point fits the screen under the current zoom.
   * @param {Array<number>} p A point
   * @param {boolean} checkInside Check if the point is inside the range.
   * @return {Array<number>|null}
   *   Return a zoomed point if the point fits in screen (when checkInside
   *   is true). Otherwise return null.
   */
  fitScreen: function(p, checkInside) {
    var pScreen = utils.projectPoint(p,
        this.zoomTranslate, this.zoomScale);
    if (checkInside && !utils.fitRange(pScreen,
        [[0, this.svgSize[0]], [0, this.svgSize[1]]],
        this.renderMargin)) return null;
    return pScreen;
  }
};
