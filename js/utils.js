/**
 * Utility functions
 */

'use strict';

var utils = {
  /**
   * Generate an array of random numbers between [0, 1)
   * @param {int} length
   * @param {[Number, Number]} range
   * @param {boolean} needInt
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
  }
};
