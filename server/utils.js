/**
*
* Utility functions
*
**/

'use strict';

var fs = require('fs');


/** @export */
module.exports = {
  /**
   * lowerBound, binary search on an array
   * @return {int} The smallest index i that satisfies f(a[i], v)
   */
  lowerBound: function(a, v, f) {
    var l = 0, r = a.length - 1;
    while (l <= r) {
      var m = (l + r) >> 1;
      if (f(a[m], v))
        r = m - 1;
      else
        l = m + 1;
    }
    return l;
  },

  /**
   * lowerBound2, binary search on an index array with original array
   * @return {int} The smallest index i that satisfies f(d[a[i]], v)
   */
  lowerBound2: function(d, a, v, f) {
    var l = 0, r = a.length - 1;
    while (l <= r) {
      var m = (l + r) >> 1;
      if (f(d[a[m]], v))
        r = m - 1;
      else
        l = m + 1;
    }
    return l;
  },

  /**
   * Read the entire file into a buffer
   * @param {string} file File name
   * @return {buffer}
   */
  readFileToBuffer: function(file) {
    if (fs.existsSync(file) == false)
      return null;
    var stats = fs.statSync(file);
    var numBytes = stats.size;
    var buf = new Buffer(numBytes);
    var fd = fs.openSync(file, 'r');
    fs.readSync(fd, buf, 0, numBytes, 0);
    return buf;
  },

  /**
   * Compute the size of an Object
   * @param {Object} e
   * @return {int} Size of the object
   */
  size: function(e) {
    return Object.keys(e).length;
  },

  /**
   * Remove duplicates in an array.
   * @param {Array<*>} a
   */
  unique: function(a) {
    var e = {};
    for (var i = 0; i < a.length; i++) e[a[i]] = true;
    return Object.keys(e);
  },

  /**
   * Merge 2 sorted arrays, timestamp must be the first value of an array element
   * @param {Array} arrays
   * @return {Array} Size of the object
   */
  merge_2: function(array0, array1) {
    var result = [];
    var i = 0, j = 0;
    if (array0 == undefined) return array1;
    if (array1 == undefined) return array0;
    while (i < array0.length && j < array1.length) {
      if (array0[i][0] < array1[j][0])
        result.push(array0[i++]);
      else
        result.push(array1[j++]);
    }
    while (i < array0.length)
      result.push(array0[i++]);
    while (j < array1.length)
      result.push(array1[j++]);

    return result;
  },

  /**
   * Merge k sorted arrays, timestamp must be the first value of an array element
   * @param {Array} arrays
   * @return {Void}
   */
  merge_k: function(arrays) {
    while (arrays.length > 1) {
      var tmp = [];
      for (var i = 0; i < arrays.length; i += 2) {
        if (i + 1 < arrays.length)
          tmp.push(merge_2(arrays[i], arrays[i + 1]));
        else
          tmp.push(arrays[i]);
      }
      arrays=tmp;
    }
    return;
  }
};
