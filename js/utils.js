/**
 * Utility functions
 */

'use strict';

var utils = {
  /** @enum {number} */
  KeyCodes: {
    CTRL: 17,
    ENTER: 13
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
    var parentOffset = jqthis.parent().offset();
    if (parentOffset == null) console.error('no parent found in getOffset');
    return [event.pageX - parentOffset.left, event.pageY - parentOffset.top];
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
  }
};
