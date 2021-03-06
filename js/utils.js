/**
 * Utility functions
 */

'use strict';

var utils = {
  /** @enum  */
  ArrowKeys: {
    37: true,
    38: true,
    39: true,
    40: true
  },
  /** @enum {number} */
  KeyCodes: {
    CTRL: 17,
    SHIFT: 16,
    ENTER: 13,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
  },

  /** @const {number} */
  MILLIS: 1000,

  /**
   * Project a point by applying translate and scale.
   * @param {[number, number]} p
   * @param {[number, number]} translate
   * @param {number} scale
   * @return {[number, number]} Projected point
   */
  projectPoint: function(p, translate, scale) {
    return [p[0] * scale + translate[0],
            p[1] * scale + translate[1]];
  },

  /**
   * Check if a point fits within given ranges.
   * @param {array<number>} p
   * @param {array<[number, number]>} ranges
   * @param {number} margin If given, tolerance is applied
   * @return {boolean} Whether the point fits
   */
  fitRange: function(p, ranges, margin) {
    if (margin == undefined) margin = 0;
    for (var i = 0; i < p.length; i++) {
      var v = p[i];
      if (v < ranges[i][0] - margin || v > ranges[i][1] + margin)
        return false;
    }
    return true;
  },


  /**
   * Generate an array of random numbers between [0, 1).
   * @param {int} length
   * @param {[Number, Number]} range
   * @param {boolean} needInt
   * @return {Array} Array of random numberes
   */
  randArray: function(length, range, needInt) {
    var result = [];
    if (range == undefined) range = [0, 1];
    for (var i = 0; i < length; i++) {
      var val = Math.random() * (range[1] - range[0]) + range[0];
      if (needInt) val = parseInt(val);
      result.push(val);
    }
    return result;
  },


  /**
   * Compute the size of an Object.
   * @param {Object} e
   * @return {int} size of object
   */
  size: function(e) {
    var cnt = 0;
    for (var key in e) cnt++;
    return cnt;
  },


  /**
   * Get event offset corresponding to parent element
   * @param {jQuery event} event
   * @param {jQuery selection} jqthis This object that triggers the event
   */
  getOffset: function(event, jqthis) {
    var offset = jqthis.offset();
    return [event.pageX - offset.left, event.pageY - offset.top];
  },

  /**
   * Make uppercase the first letter
   * @param {string} s
   * @return {string}
   */
  camelize: function(s) {
    return s.substr(0,1).toUpperCase() + s.slice(1);
  },

  /**
   * Convert Array<[time, #, eventType, x, y]>
   * to Map<#, Array<[time, eventType, x, y]>>
   * TODO(bowen): expect server to do this
   * @return {Object} Data grouped by pid
   */
  groupMoveByPid: function(data) {
    var result = {};
    for (var i = 0; i < data.length; i++) {
      var id = data[i][1],
          a = [data[i][0], data[i][2], data[i][3], data[i][4]];
      if (result[id] == undefined) {
        result[id] = [a];
      } else {
        result[id].push(a);
      }
    }
    return result;
  },

  /**
   * Return a darker color of the input color
   * @param {string} color Hex color
   */
  darkerColor: function(color) {
    var d3color = d3.rgb(color);
    return d3color.darker().toString();
  },

  /**
   * Get the middle point of two points.
   * @param {Array<number>} pa
   * @param {Array<number>} pb
   */
  middlePoint: function(pa, pb) {
    return [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
  },
  /**
   * Rotate a vector by 90 degrees counter-clockwise.
   * @param {Array<number>} p
   */
  perpVector: function(p) {
    return [p[1], -p[0]];
  },
  /**
   * Get the length of a vector.
   * @param {[[Type]]} p [[Description]]
   */
  lenVector: function(p) {
    return Math.sqrt(p[0] * p[0] + p[1] * p[1]);
  },
  /**
   * Normalize a vector.
   * @param {Array<number>} p
   */
  normalizeVector: function(p) {
    var len = this.lenVector(p);
    return this.multiplyVector(p, 1 / len);
  },
  /**
   * Compute the distance between two points
   * @param {Array<number>} pa
   * @param {Array<number>} pb
   */
  distVector: function(pa, pb) {
    return this.lenVector(this.subtractVector(pa, pb));
  },
  /**
   * Add two vectors.
   * @param {Array<number>} pa
   * @param {Array<number>} pb
   */
  addVector: function(pa, pb) {
    return [pa[0] + pb[0], pa[1] + pb[1]];
  },
  /**
   * Subtract a vector from another
   * @param {Array<number>} pa
   * @param {Array<number>} pb
   */
  subtractVector: function(pa, pb) {
    return [pa[0] - pb[0], pa[1] - pb[1]];
  },
  /**
   * Multiply a vector by a constant.
   * @param {Array<number>} p
   * @param {number}        k
   */
  multiplyVector: function(p, k) {
    return [p[0] * k, p[1] * k];
  },
  /**
   * Check whether two vectors are equal.
   * @param {Array<number>} pa
   * @param {Array<number>} pb
   */
  equalVector: function(pa, pb) {
    return pa[0] == pb[0] && pa[1] == pb[1];
  },

  /**
   * Get a random color from d3.
   * @param {number} seed An integer.
   */
  randomColor: function(seed) {
    var colors = d3.scale.category20().range();
    var index;
    if (seed == undefined)
      index = Math.floor(Math.random() * colors.length);
    else
      index = seed % colors.length;
    return colors[index];
  }
};
