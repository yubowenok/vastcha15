
'use strict';

var msgvis = {
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
  pos: {},

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

    this.interaction();
  },

  /**
   * Set the communication volume data.
   * @param {Object<pid, Object<pid, number>>} data
   */
  setVolumeData: function(data) {
    this.volumeData = data;
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
      var p = this.pos[pid];
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
    this.pos = {};
    var pids = {};
    for (var a in this.volumeData) {
      var edges = this.volumeData[a];
      pids[a] = true;
      for (var b in edges) {
        pids[b] = true;
      }
    }
    var n = meta.mapPid.length, r = 200;
    for (var pid in pids) {
      var p = mapvis.posData[pid];
      var theta = pid / n * 2 * Math.PI;
      if (p == undefined) {
        p = [r * Math.cos(theta) + 50,
             r * Math.sin(theta) + 50];
      }
      p = mapvis.projectScreen(p);
      this.pos[pid] = p;
    }
  },
  /**
   * Render the message volumes into a graph.
   */
  renderVolumes: function() {
    this.getPositions();
    this.renderVolumeEdges();
    this.renderVolumeNodes();
  },
  renderVolumeNodes: function() {
    this.svgNode.selectAll('*').remove();
    if (!vastcha15.settings.showMessageVolume) return;
    var margin = this.renderMargin;
    var scale = this.zoomScale,
        translate = this.zoomTranslate;

    for (var pid in this.pos) {
      var p = this.pos[pid]
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
    var line = d3.svg.line().interpolate('linear');
    for (var a in data) {
      var edges = data[a];
      var pa = this.pos[a];
      var fita = this.fitScreen(pa);
      for (var b in edges) {
        var w = edges[b];
        var pb = this.pos[b];
        var fitb = this.fitScreen(pb);

        // render an edge from pa to pb
        var points = [pa, pb];
        var e = this.svgEdge.append('path')
          .attr('d', line(points))
          .style('stroke-width', 0.1 * w);
      }
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
    var p = this.pos[pid];
    if (p == undefined) return;
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
  },
};
