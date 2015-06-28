/**
*
* Read and process the meta data
*
**/

'use strict';

var fs = require('fs');
var fileName = '../data/GC.meta';
var lines, lineIndex = 0;

var getLine = function() {
  var line = lines[lineIndex++];
  return line;
};
var data;


/** @export */
module.exports = {

  setup: function() {
    var contents = fs.readFileSync(fileName, 'utf8');
    lines = contents.match(/[^(\r\n|\r|\n)]+/g);

    var peopleId = [],
        moveEvent = [],
        commArea = [];

    var numPeople = parseInt(getLine());
    for (var i = 0; i < numPeople; i++) {
      var id = getLine().split(' ')[1];
      peopleId.push(parseInt(id));
    }
    var numMoveEvent = parseInt(getLine());
    for (var i = 0; i < numMoveEvent; i++) {
      var e = getLine().split(' ')[1];
      moveEvent.push(e);
    }
    var numCommArea = parseInt(getLine());
    for (var i = 0; i < numCommArea; i++) {
      var a = getLine().split(' ').slice(1).join(' ');
      commArea.push(a);
    }

    data = {
      peopleId: peopleId,
      moveEvent: moveEvent,
      commArea: commArea
    };

    console.log('meta data ready');
  },

  allMeta: function() {
    return data;
  }

};
