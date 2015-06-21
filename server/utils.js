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
    var cnt = 0;
    for (var key in e) cnt++;
    return cnt;
  }
};
