
'use strict';

var msgvis = {

  /** @enum {number} */
  Layouts: {
    MAP_LAYOUT: 0,
    FORCE_LAYOUT: 1
  },

  /** @const */
  svgSize: [0, 0],
  nodeSize: 4,
  nodeStrokeWidth: 2,
  renderMargin: 10,

  /** Interaction state */
  zoomScale: 1.0,
  zoomTranslate: [0, 0],

  /** Directed weighted graph representing communication volume. */
  volumeData: {},
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

  /** Setup the context */
  context: function() {
    this.svg = d3.select('#svg-comm > g');
    this.svgNode = this.svg.select('#node');
    this.svgEdge = this.svg.select('#edge');
    this.svgId = d3.select('#svg-comm #comm-ids');

    this.jqView = $('#comm-view');
    this.jqSvg = $('#svg-comm');
    this.jqNode = this.jqSvg.find('#node');
    this.jqEdge = this.jqSvg.find('#edge');
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
          pos: [0, 0]
        };
        this.newForce = true;
      }
      this.nodesD3.push(this.nodes[pid]);
    }

    // Convert the edges so that they link to the node objects.
    // At this point every endpoint of an edge must already
    // have a node object created.
    this.edges = [];
    for (var i = 0; i < edges.length; i++) {
      this.edges.push({
        source: this.nodes[edges[i][0]],
        target: this.nodes[edges[i][1]],
        weight: edges[i][2]
      });
    }

    this.nodeIds = pids;
  },

  /**
   * Setup ui for msgvis.
   */
  ui: function() {
    $('#check-volume').click(function(event) {
      var state = !vastcha15.settings.showMessageVolume;
      vastcha15.settings.showMessageVolume = state;
      if (!state) {
        msgvis.clearVolumes();
        $(this).removeClass('label-primary');
      } else {
        vastcha15.getAndRenderMessageVolumes();
        $(this).addClass('label-primary');
      }
    });

    $('#check-layout').click(function(event) {
      var state = vastcha15.settings.msgLayout;
      state = (state + 1) % 2;
      vastcha15.settings.msgLayout = state;
      if (!state) {
        $(this).text('Map Layout');
      } else {
        $(this).text('Force Layout');
      }
      msgvis.render();
    });

    $('#check-nodeid').click(function(event) {
      var state = !vastcha15.settings.showNodeId;
      vastcha15.settings.showNodeId = state;
      if (!state) {
        msgvis.clearLabels();
        $(this).removeClass('label-primary');
      } else {
        msgvis.renderLabels();
        $(this).addClass('label-primary');
      }
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
    var r = this.nodeSize / this.zoomScale;
    var e = this.svgNode.select('#p' + pid);
    var isTarget = tracker.targeted[pid];
    if (!e.empty()) {
      var p = this.nodes[pid].pos;
      e.attr('r', r * 2);
      if (!isTarget) {
        e.classed('node-hover', true);
      }
    }
    this.jqNode.find('#p' + pid).appendTo(this.jqNode);
    this.renderJqLabel(pid);
  },
  clearHover: function(pid) {
    var r = this.nodeSize / this.zoomScale;
    var e = this.svgNode.select('#p' + pid);
    var isTarget = tracker.targeted[pid];
    if (!e.empty()) {
      e.attr('r', r);
      if (!isTarget) {
        e.classed('node-hover', false);
      }
    }
    this.removeJqLabel(pid);
  },

  /**
   * Wrapper of render functions
   */
  render: function() {
    this.renderVolumes();
  },

  /**
   * Get the positions for each node.
   */
  getPositions: function() {
    if (vastcha15.settings.msgLayout ==
       this.Layouts.MAP_LAYOUT) {
      this.getMapPositions();
    } else if (vastcha15.settings.msgLayout ==
       this.Layouts.FORCE_LAYOUT) {
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
    var n = meta.mapPid.length, r = 200;
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
        .linkStrength(0.1)
        .friction(0.9)
        .linkDistance(20)
        .charge(-30)
        .gravity(0.1)
        .theta(0.8)
        .alpha(0.1)
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
    this.renderVolumeNodes();
    this.renderLabels();
  },
  renderVolumeNodes: function() {
    this.svgNode.selectAll('*').remove();
    if (!vastcha15.settings.showMessageVolume) return;
    var margin = this.renderMargin;
    var scale = this.zoomScale,
        translate = this.zoomTranslate;

    for (var pid in this.nodeIds) {
      var p = this.nodes[pid].pos;
      if (this.fitScreen(p, true) == null) continue;
      var x = p[0], y = p[1];

      var r = this.nodeSize / scale, e;
      e = this.svgNode.append('circle')
        .attr('id', 'p' + pid)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', this.nodeSize / scale)
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
        tracker.toggleSelect(id);
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
      }
    }

    // Reorder based on select/target status
    this.jqNode.find('.pos-select').appendTo(this.jqNode);
    this.jqNode.find('.pos-selectP').appendTo(this.jqNode);
    this.jqNode.find('.pos-target').appendTo(this.jqPos);
  },
  renderVolumeEdges: function() {
    this.svgEdge.selectAll('*').remove();
    if (!vastcha15.settings.showMessageVolume) return;
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
      d = utils.multiplyVector(d, utils.distVector(pa, pb) * 0.1)
      m = utils.addVector(m, d);

      var points = [pa, m, pb];
      var e = this.svgEdge.append('path')
        .attr('d', line(points))
        .style('stroke-width', 0.1 * w);
    }
  },

  /** Clear the volume graph */
  clearVolumes: function() {
    this.svgNode.selectAll('*').remove();
    this.svgEdge.selectAll('*').remove();
  },

  /**
   * Show pid on the map
   */
  renderJqLabel: function(pid) {
    if (this.nodes[pid] == undefined ||
        this.nodes[pid].pos == undefined) return;
    var p = this.nodes[pid].pos;
    p = this.fitScreen(p);
    if (p == null) return;
    $('<div></div>')
      .text(pid)
      .css({
        left: p[0] + 15,
        top: p[1] - 10
      })
      .addClass('node-label')
      .appendTo(this.jqView);
  },
  removeJqLabel: function(pid) {
    this.jqView.find('.node-label:contains(' + pid + ')').remove();
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
    if (!vastcha15.settings.showNodeId) return;
    for (var pid in this.nodeIds) {
      this.renderLabel(pid);
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
