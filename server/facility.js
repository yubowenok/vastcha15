'use strict';


/** @enum {Object} */
var facilityType = {
  'None': 0,
  'Thrill Rides': 1,
  'Kiddie Rides': 2,
  'Rides for Everyone': 3,
  'Food': 4,
  'Restrooms': 5,
  'Shopping': 6,
  'Beer Gardens': 7,
  'Shows & Entertainment': 8,
  'Information & Assistance': 9
};

var facilities = {
  // Thrill Rides
  WRIGHTIRAPTOR: {
    id: 1,
    pos: [47.040927867, 10.987107363],
    name: 'Wrightiraptor Mountain',
    type: 'Thrill Rides'
  },
  GALACTOSAURUS: {
    id: 2,
    pos: [27.038528685, 14.998974024],
    name: 'Galactosaurus Rage',
    type: 'Thrill Rides'
  },
  AUVILOTOPS: {
    id: 3,
    pos: [38.067521443, 90.051070808],
    name: 'Auvilotops Express',
    type: 'Thrill Rides'
  },
  TERRORSAUR: {
    id: 4,
    pos: [78.088910747, 47.960487191],
    name: 'TerrorSaur',
    type: 'Thrill Rides'
  },
  WENDISAURUS: {
    id: 5,
    pos: [16.000909327, 65.995645523],
    name: 'Wendisaurus Chase',
    type: 'Thrill Rides'
  },
  KEIMOSAURUS: {
    id: 6,
    pos: [86.070873762, 43.853585059],
    name: 'Keimosaurus Big Spin',
    type: 'Thrill Rides'
  },
  FIREFALL: {
    id: 7,
    pos: [17.024694081, 42.996571385],
    name: 'Firefall',
    type: 'Thrill Rides'
  },
  ATMOSFEAR: {
    id: 8,
    pos: [45.05799614, 23.989115395],
    name: 'Atmosfear',
    type: 'Thrill Rides'
  },
  SWINGODON: {
    id: 81,
    pos: [69.047102022, 44.019185952],
    name: 'Flight of the Swingodon',
    type: 'Thrill Rides'
  },

  // Kiddie Rides
  NORTHLINE: {
    id: 9,
    pos: [92.045180723, 81.005882536],
    name: 'North Line',
    type: 'Kiddie Rides'
  },
  JEREDACTYL: {
    id: 10,
    pos: [81.047720755, 76.981276072],
    name: 'Jeredactyl Jump',
    type: 'Kiddie Rides'
  },
  SAUROMA: {
    id: 11,
    pos: [73.015592241, 78.939107397],
    name: 'Sauroma Bumpers',
    type: 'Kiddie Rides'
  },
  TYRANDRIENKOS: {
    id: 12,
    pos: [73.065793045, 84.034488923],
    name: 'Flying TyrAndrienkos',
    type: 'Kiddie Rides'
  },
  CYNDISAURUS: {
    id: 13,
    pos: [79.014588225, 87.021436715],
    name: 'Cyndisaurus Asteroid',
    type: 'Kiddie Rides'
  },
  BEELZEBUFO: {
    id: 14,
    pos: [75.977439631, 87.975251976],
    name: 'Beelzebufo',
    type: 'Kiddie Rides'
  },
  TOADSTOOLS: {
    id: 15,
    pos: [78.989487824, 88.97926804],
    name: 'Enchanted Toadstools',
    type: 'Kiddie Rides'
  },
  STEGOCYCLES: {
    id: 16,
    pos: [82.026636418, 79.993324265],
    name: 'Stegocycles',
    type: 'Kiddie Rides'
  },
  IGUANODON: {
    id: 17,
    pos: [83.030652482, 87.925051172],
    name: 'Blue Iguanodon',
    type: 'Kiddie Rides'
  },
  JUNGLECRUISE: {
    id: 18,
    pos: [85.013584209, 86.042521052],
    name: 'Wild Jungle Cruise',
    type: 'Kiddie Rides'
  },
  STONECUPS: {
    id: 19,
    pos: [86.996515936, 81.122842337],
    name: 'Stone Cups',
    type: 'Kiddie Rides'
  },

  // Rides for Everyone
  SCHOLTZ: {
    id: 20,
    pos: [6.039821848, 42.97798207],
    name: 'Scholtz Express',
    type: 'Rides for Everyone'
  },
  PALEOCARRIE: {
    id: 21,
    pos: [34.030679767, 68.006001628],
    name: 'Paleocarrie Carousel',
    type: 'Rides for Everyone'
  },
  JURASSIC: {
    id: 22,
    pos: [17.02885036, 66.95750794],
    name: 'Jurassic Road',
    type: 'Rides for Everyone'
  },
  RHYNASAURUS: {
    id: 23,
    pos: [16.054882089, 49.002078455],
    name: 'Rhynasaurus Rampage',
    type: 'Rides for Everyone'
  },
  KAUF: {
    id: 24,
    pos: [42.994913475, 55.972485892],
    name: 'Kauf\'s Lost Canyon Escape',
    type: 'Rides for Everyone'
  },
  MAIASAUR: {
    id: 25,
    pos: [26.034784623, 58.98236186],
    name: 'Maiasaur Madness',
    type: 'Rides for Everyone'
  },
  KRISTANODON: {
    id: 26,
    pos: [27.999913466, 66.025152043],
    name: 'Kristanodon Kaper',
    type: 'Rides for Everyone'
  },
  SQUIDOSAUR: {
    id: 27,
    pos: [48.057481283, 86.938621009],
    name: 'Squidosaur',
    type: 'Rides for Everyone'
  },
  EBERLESAURUS: {
    id: 28,
    pos: [23.047836831, 53.962281539],
    name: 'Eberiesaurus Roundup',
    type: 'Rides for Everyone'
  },
  DYKESADACTYL: {
    id: 29,
    pos: [86.998238759, 48.026727548],
    name: 'Dykesadactyl Thrill',
    type: 'Rides for Everyone'
  },
  ICHTHYOROBERTS: {
    id: 30,
    pos: [78.021453411, 37.005206355],
    name: 'Ichthyoroberts Rapids',
    type: 'Rides for Everyone'
  },
  RAPTORRACE: {
    id: 31,
    pos: [42.99152314, 77.970861066],
    name: 'Raptor Race',
    type: 'Rides for Everyone'
  },

  // Food
  THERESAUR: {
    id: 35,
    pos: [59.210409012, 45.476473805],
    name: 'Theresaur Food Stop',
    type: 'Food'
  },
  PALEO: {
    id: 36,
    pos: [35.092504186, 14.963631099],
    name: 'Paleo Shreckwiches',
    type: 'Food'
  },
  KRYSTAL: {
    id: 37,
    pos: [58.960858908, 88.915105835],
    name: 'Krystal Cook Cafe',
    type: 'Food'
  },
  SHILOBITE: {
    id: 38,
    pos: [56.958236875, 73.09870266],
    name: 'Shilobite o\'Pizza',
    type: 'Food'
  },
  CHENSATIONAL: {
    id: 39,
    pos: [87.071011173, 67.988069678],
    name: 'Chensational Sweets',
    type: 'Food'
  },
  SMOKY: {
    id: 53,
    pos: [15.050866025, 39.991034279],
    name: 'Smoky Wood BBQ',
    type: 'Food'
  },
  ICE: {
    id: 54,
    pos: [83.843850269, 78.11717529],
    name: 'Ice Age Cones',
    type: 'Food'
  },
  PLAISANTLY: {
    id: 55,
    pos: [75.858316793, 60.983474886],
    name: 'Plaisantly Popped Corn',
    type: 'Food'
  },
  FLORAL: {
    id: 56,
    pos: [42.815820329, 75.009013677],
    name: 'Floral Funnels',
    type: 'Food'
  },
  PERMAFROSTIES: {
    id: 57,
    pos: [42.020847545, 20.876665596],
    name: 'Permafrosties',
    type: 'Food'
  },
  GRANITE: {
    id: 58,
    pos: [46.6, 78.8],
    name: 'Granite Slab Pizza',
    type: 'Food'
  },
  EBERTREX: {
    id: 59,
    pos: [23.481841177, 65.949850839],
    name: 'EberTrex Fries',
    type: 'Food'
  },

  // Restrooms
  RAPTORREST: {
    id: 49,
    pos: [3.741967871, 65.971544445],
    name: 'Raptor Restroom',
    type: 'Restrooms'
  },
  TARPIT: {
    id: 50,
    pos: [51.921745043, 28.104563962],
    name: 'Tar Pit Stop',
    type: 'Restrooms'
  },
  LAVATORY: {
    id: 51,
    pos: [54.968066303, 49.839456576],
    name: 'Lavatory',
    type: 'Restrooms'
  },
  TRICERA: {
    id: 52,
    pos: [76.277838483, 72.957949196],
    name: 'TriceraStop',
    type: 'Restrooms'
  },
  DARWIN: {
    id: 65,
    pos: [21.993347962, 27.172668803],
    name: 'Darwin\'s Stop',
    type: 'Restrooms'
  },
  TYRANNOSAURUS: {
    id: 66,
    pos: [74.252760973, 21.387537603],
    name: 'Tyrannosaurus Rest',
    type: 'Restrooms'
  },
  RISCHING: {
    id: 67,
    pos: [92.045180723, 77.115320287],
    name: 'Fisching Rooms',
    type: 'Restrooms'
  },

  // Beer Gardens
  ALVAREZ: {
    id: 33,
    pos: [20.949460402, 33.163725042],
    name: 'Alvarez Beer Garden',
    type: 'Beer Gardens'
  },
  MARYANNING: {
    id: 34,
    pos: [78.921435672, 25.027095836],
    name: 'Mary Anning Beer Garden',
    type: 'Beer Gardens'
  },

  // Shopping
  MUNZASAURUS: {
    id: 40,
    pos: [41.840295002, 59.988550149],
    name: 'Munzasaurus Souvenirs',
    type: 'Shopping'
  },
  LASKONASAUR: {
    id: 41,
    pos: [57.024477232, 64.255615005],
    name: 'Laskonasaur Store',
    type: 'Shopping'
  },
  WARROCKS: {
    id: 42,
    pos: [17, 47.4],
    name: 'World of WarRocks Shop',
    type: 'Shopping'
  },
  WHITLEYS: {
    id: 43,
    pos: [44.104180879, 25.193934672],
    name: 'Whitley\'s Plushadactyl',
    type: 'Shopping'
  },
  STASKOSAURUS: {
    id: 44,
    pos: [69.04892282, 72.129635943],
    name: 'Staskosaurus Designs',
    type: 'Shopping'
  },
  DINOCHIC: {
    id: 45,
    pos: [56.927726378, 80.004463265],
    name: 'Dino Chic Clothing',
    type: 'Shopping'
  },
  PETROGLYPH: {
    id: 46,
    pos: [22.104078876, 34.243042311],
    name: 'Petroglyph Body Art',
    type: 'Shopping'
  },
  LEGENODONS: {
    id: 47,
    pos: [69.023822418, 57.998109839],
    name: 'League of Legenodons',
    type: 'Shopping'
  },
  MAGICCAVERN: {
    id: 48,
    pos: [29.15453194, 66.953866903],
    name: 'The Magic Cavern',
    type: 'Shopping'
  },

  // Shows & Entertainment
  CREIGHTON: {
    id: 32,
    pos: [31.985190972, 33.027745737],
    name: 'Creighton Pavilion',
    type: 'Shows & Entertainment'
  },
  GRINOSAURUS: {
    id: 63,
    pos: [76.009789086, 21.989947242],
    name: 'Grinosaurus Stage',
    type: 'Shows & Entertainment'
  },
  SABRETOOTH: {
    id: 64,
    pos: [87.02081037, 63.01819016],
    name: 'SabreTooth Theatre',
    type: 'Shows & Entertainment'
  },
  PRIMAL: {
    id: 61,
    pos: [68.973621615, 66.933852811],
    name: 'Primal Carnage Arcade',
    type: 'Shows & Entertainment'
  },

  // Information & Assistance
  DAILYSLAB: {
    id: 60,
    pos: [67.441116049, 90.364847768],
    name: 'Daily Slab Maps and Info',
    type: 'Information & Assistance'
  },
  LIGGEMENT: {
    id: 62,
    pos: [50.006413041, 57.008974809],
    name: 'Liggement Fix-Me-Up',
    type: 'Information & Assistance'
  }
};

var filePrefix = '../data/move/faci-sequence-',
    days = {'Fri': 0, 'Sat': 1, 'Sun': 2};

var pids = {},
    pidData = {};

var utils = require('./utils.js'),
    meta = require('./meta.js'),
    group = require('./group.js');



var getFaciType = [0];

/*
tableData = {
  dimensions: [d1Name, d2Name, ...],
  data: {
    pid1: [v1, v2, ...],
    pid2: ...
  }
}
*/
var faciTable = {};
var similarGroup = {};


/**
 * Data are in the form of
 * {
 *   day: {
 *       fid: [ [time, num_people, num_people_checkin], ..., ],
 *       ...
 *   },
 *   ...
 * }
 */
var faciStat = {};
var tmG = function(a, v) {
  return a[0] > v; // get timestamp, stored as the first element in the array
};


/** @export */
module.exports = {

  setup: function() {

    for (var key in facilities) {
      var f = facilities[key];
      getFaciType[f.id] = facilityType[f.type];
    }

    for (var day in days) {
      // Read faci sequence data
      var fileName = filePrefix + day + '.bin';
      console.log('getting', fileName);

      var tableData = {
        dimensions: ['None',
          'Thrill Rides',
          'Kiddie Rides',
          'Rides for Everyone',
          'Food',
          'Restrooms',
          'Shopping',
          'Beer Gardens',
          'Shows & Entertainment',
          'Information & Assistance'],
        data: {}
      };
      faciStat[day] = {};

      var faciDelta = {};
      var faciDeltaCK = {};
      for (var key in facilities) {

        faciDelta[facilities[key].id] = {};
        faciDeltaCK[facilities[key].id] = {};
      }
      faciDelta[0] = {};
      faciDeltaCK[0] = {};

      var offset = 0;
      var buf = utils.readFileToBuffer(fileName);
      var n = buf.readInt32LE(offset);
      offset += 4;

      var dayData = {};
      for (var i = 0; i < n; i++) {
        var id = buf.readInt16LE(offset);
        offset += 2;
        var numFaci = buf.readInt16LE(offset);
        offset += 2;
        dayData[id] = new Array(numFaci);

        var faciTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var j = 0; j < numFaci; j++) {
          var tmstamp = buf.readInt32LE(offset);
          offset += 4;
          var faciId = buf.readInt8(offset);
          offset++;
          var event = buf.readInt8(offset);
          offset++;

          if (j > 0) {
            var lastTime = dayData[id][j - 1][0],
                lastFaciId = dayData[id][j - 1][1];
            faciTime[getFaciType[lastFaciId]] += tmstamp - dayData[id][j - 1][0];
          }

          if (j == 0) {
            if (faciDelta[faciId][tmstamp] == undefined) faciDelta[faciId][tmstamp] = 0;
            if (faciDeltaCK[faciId][tmstamp] == undefined) faciDeltaCK[faciId][tmstamp] = 0;
            faciDelta[faciId][tmstamp]++;
            if (event == 0)
              faciDeltaCK[faciId][tmstamp]++;
          }
          else {

            if (faciId == dayData[id][j - 1][1]) { // same facility
              if (event != dayData[id][j - 1][2]) {
                var delta = dayData[id][j - 1][2] - event;
                if (faciDeltaCK[faciId][tmstamp] == undefined) faciDeltaCK[faciId][tmstamp] = 0;
                faciDeltaCK[faciId][tmstamp] += delta;
              }
            }
            else { // different facility
              var prevFaciID = dayData[id][j - 1][1];
              if (faciDelta[prevFaciID][tmstamp - 1] == undefined)
                faciDelta[prevFaciID][tmstamp - 1] = 0;
              faciDelta[prevFaciID][tmstamp - 1]--;
              if (faciDelta[faciId][tmstamp] == undefined) faciDelta[faciId][tmstamp] = 0;
              faciDelta[faciId][tmstamp]++;

              if (dayData[id][j - 1][2] == 0) { // if was checked in
                if (faciDeltaCK[prevFaciID][tmstamp - 1] == undefined)
                  faciDeltaCK[prevFaciID][tmstamp - 1] = 0;
                faciDeltaCK[prevFaciID][tmstamp - 1]--;
              }
              if (event == 0) { // if now is checking in
                if (faciDeltaCK[faciId][tmstamp] == undefined)
                  faciDeltaCK[faciId][tmstamp] = 0;
                faciDeltaCK[faciId][tmstamp]++;
              }
            }

            if (j == numFaci - 1) { // remove for tmstamp+1 if it is the last one
              if (faciDelta[faciId][tmstamp + 1] == undefined)
                faciDelta[faciId][tmstamp + 1] = 0;
              faciDelta[faciId][tmstamp + 1]--;
              if (event == 0) { // if was checked in
                if (faciDeltaCK[faciId][tmstamp + 1] == undefined)
                  faciDeltaCK[faciId][tmstamp + 1] = 0;
                faciDeltaCK[faciId][tmstamp + 1]--;
              }
            }

          }
          dayData[id][j] = [tmstamp, faciId, event];
        }
        var totalTime = dayData[id][dayData[id].length - 1][0] - dayData[id][0][0];
        for (var fid in faciTime)
          faciTime[fid] = faciTime[fid] / totalTime * 100;
        tableData.data[id] = faciTime;
      }


      // faciStat, people number
      for (var key in facilities) {
        var fid = facilities[key].id;
        var timepoint = Object.keys(faciDelta[fid]);
        timepoint.concat(Object.keys(faciDeltaCK[fid]));
        utils.unique(timepoint);

        var n = 0, nck = 0;
        faciStat[day][fid] = [];
        timepoint.sort();

        for (var t in timepoint) {
          var time = timepoint[t];
          if (faciDelta[fid][time] == undefined)
            faciDelta[fid][time] = 0;
          if (faciDeltaCK[fid][time] == undefined)
            faciDeltaCK[fid][time] = 0;
          n += faciDelta[fid][time];
          nck += faciDeltaCK[fid][time];
          faciStat[day][fid].push([time, n, nck]);
        }

      }

      pidData[day] = dayData;
      faciTable[day] = tableData;
      pids[day] = Object.keys(dayData);
    }
    console.log('faci data ready');
  },


  RMSE: function(arr1, arr2) {
    var result = 0;
    for (var i in arr1) {
      result += (arr1[i] - arr2[i]) * (arr1[i] - arr2[i]);
    }
    result /= arr1.length;
    return Math.sqrt(result);
  },


  /**
   * Return the facility sequence for given pids
   * @param   {string} day
   * @param   {string} pid Comma separated pids
   * @return {Object}
   */
  queryPidFaciSequence: function(day, pid) {
    if (pid == undefined) {
      //pid = pids[day];
      pid = group.getAllGids(day);
    } else {
      if (pid == '') return {};
      pid = pid.split(',');
    }
    var result = {};
    for (var i = 0; i < pid.length; i++) {
      var id = pid[i];
      var leader = group.getLeader(day, id);
      if (leader == null) continue;
      var seq = pidData[day][leader];
      if (seq == undefined) continue;
      result[id] = seq;
    }
    return result;
  },


  /**
   * Return the top similar cnt (default 20) groups (gid) for a given pid
   * @param   {string} day
   * @param   {string} pid
   * @return {[[gid1, diff1],[gid2, diff2], ...]}
   */
  queryPidSimilarGroups: function(day, id, cnt, start) {

    if (cnt == undefined) cnt = 20;
    else cnt = parseInt(cnt);
    if (start == undefined) start = 0;
    else start = parseInt(start);


    var pid = group.getAllGids(day);
    var gid = group.getGroup(day, id),
        lid = group.getLeader(day, gid);

    if (lid == null) return [];

    var array = [];
    for (var j in pid) {
      var jd = pid[j],
          ljd = group.getLeader(day, jd);
      if (ljd == lid) continue;

      var diff = this.RMSE(faciTable[day].data[lid], faciTable[day].data[ljd]);
      array.push([jd, diff]);
    }
    array.sort(function(x, y) {
      if (x[1] > y[1]) return 1;
      else if (x[1] < y[1]) return -1;
      else return 0;
    });
    var result = [];
    var cc = 0;
    for (var i in array) {
      if (i < start) continue;
      if (cc >= cnt) break;
      cc++;
      result.push(array[i][0]);
    }
    return result;
  },


  /**
   * Find the facility that are closest to a given point.
   * You may want to determine whether the dist is small enough
   * so that the person can be considered to be 'at' the faciclity.
   * @param {Array<number>} Point [x, y]
   * @return {{
   *   id: number,
   *   pos: [number, number],
   *   name: string,
   *   type: string,
   *   dist: number
   * }}
   */
  closestFacility: function(p) {
    var minDist = Infinity,
        minKey;
    for (var key in facilities) {
      var f = facilities[key];
      var dx = p[0] - f.pos[0],
          dy = p[1] - f.pos[1];
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        minKey = key;
      }
    }
    // We modify the var facilities, but it would be okay...
    var fac = facilities[key];
    var result = {
      id: fac.id,
      pos: fac.pos,
      name: fac.name,
      type: fac.type,
      dist: minDist
    };
    return result;
  },


  /**
   * Return all facilities as an enum
   * @return {facilities}
   */
  allFacilities: function() {
    return facilities;
  },


  queryPidFaciExactTime: function(day, pid, tmExact) {
    var dayData = pidData[day][pid];
    if (dayData == undefined) return 0;
    var l = utils.lowerBound(dayData, tmExact, tmG);
    if (l == 0) return 0;
    else return dayData[l - 1][1];
  },

  getFaciTable: function(day, pid) {
    var result = {
      dimensions: ['None',
        'Thrill Rides',
        'Kiddie Rides',
        'Rides for Everyone',
        'Food',
        'Restrooms',
        'Shopping',
        'Beer Gardens',
        'Shows & Entertainment',
        'Information & Assistance'],
      data: {}
    };
    if (pid == undefined) {
      //pid = pids[day];
      pid = group.getAllGids(day);
    } else {
      if (pid == '') return result;
      pid = pid.split(',');
    }

    for (var i = 0; i < pid.length; i++) {
      var id = pid[i];
      var leader = group.getLeader(day, id);
      if (leader == null) continue;
      var row = faciTable[day].data[leader];
      if (row == undefined) continue;
      result.data[id] = row;
    }
    return result;
  },

  queryPeopleFlow: function(day, fid, tmStart, tmEnd, numSeg) {
    // query people flow at facilities
    // example query:
    // ?queryType=pplflow&fid=32&day=Fri&tmStart=1402071540&tmEnd=1402079159&numSeg=1000
    if (fid == undefined) {
      fid = [];
      for (var key in facilities)
        fid.push(facilities[key].id);
    } else {
      if (fid == '') return {};
      fid = fid.split(',');
    }

    var getWhole = 0;
    if (numSeg == undefined) getWhole = 1;
    else if (isNaN(numSeg)) numSeg = 1;
    else numSeg = parseInt(numSeg);

    var result = {},
        tmStep = parseInt((tmEnd - tmStart + 1) / numSeg);
    if (tmStep == 0) tmStep = 1;

    for (var i in fid) {
      var id = fid[i],
          p = 0;

      var array = faciStat[day][id];
      if (array == undefined) continue;
      result[id] = [];
      if (getWhole) {
        result[id] = array;
        continue;
      }
      for (var s = tmStart; s <= tmEnd; s += tmStep) {
        while (p < array.length && array[p][0] <= s) p++;

        if (p == 0) result[id].push([s, 0, 0]);
        else result[id].push([s, array[p - 1][1], array[p - 1][2]]);
      }

    }
    return result;
  },

  test_: function() {
    for (var key in facilities) {
      if (facilities[key].pos == undefined) {
        console.error('no pos for', key);
      }
    }
  }
};
