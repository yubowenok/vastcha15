/**
*
* Utility functions
*
**/

'use strict';

var fs = require('fs');

module.exports = {

  // lowerBound, binary search on an array
  // returns the smallest index i that satisfies f(a[i], v)
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

  // lowerBound2, binary search on an index array with original array
  // returns the smallest index i that satisfies f(d[a[i]], v)
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

  // read the entire file into a buffer
  readFileToBuffer: function(file) {
    if (fs.existsSync(file) == false)
      return null;
    var stats = fs.statSync(file);
    var numBytes = stats.size;
    var buf = new Buffer(numBytes);
    var fd = fs.openSync(file, 'r');
    fs.readSync(fd, buf, 0, numBytes, 0);
    return buf;
  }
};
