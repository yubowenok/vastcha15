'use strict';


/** @enum {Object} */
var facilities = {
  // Thrill Rides
  WRIGHTIRAPTOR: {
    id: 1,
    pos: [47.6, 11.8],
    name: 'Wrightiraptor Mountain',
    type: 'Thrill Rides'
  },
  GALACTOSAURUS: {
    id: 2,
    pos: [27.4, 16],
    name: 'Galactosaurus Rage',
    type: 'Thrill Rides'
  },
  AUVILOTOPS: {
    id: 3,
    pos: [38.4, 90.4],
    name: 'Auvilotops Express',
    type: 'Thrill Rides'
  },
  TERRORSAUR: {
    id: 4,
    pos: [78.4, 48.6],
    name: 'TerrorSaur',
    type: 'Thrill Rides'
  },
  WENDISAURUS: {
    id: 5,
    pos: [16.6, 66.2],
    name: 'Wendisaurus Chase',
    type: 'Thrill Rides'
  },
  KEIMOSAURUS: {
    id: 6,
    pos: [86.4, 44.8],
    name: 'Keimosaurus Big Spin',
    type: 'Thrill Rides'
  },
  FIREFALL: {
    id: 7,
    pos: [17.6, 43.8],
    name: 'Firefall',
    type: 'Thrill Rides'
  },
  ATMOSFEAR: {
    id: 8,
    pos: [45.6, 24.8],
    name: 'Atmosfear',
    type: 'Thrill Rides'
  },
  SWINGODON: {
    id: 81,
    pos: [69.4, 44.4],
    name: 'Flight of the Swingodon',
    type: 'Thrill Rides'
  },

  // Kiddie Rides
  NORTHLINE: {
    id: 9,
    pos: [92.6, 81.6],
    name: 'North Line',
    type: 'Kiddie Rides'
  },
  JEREDACTYL: {
    id: 10,
    pos: [81.4, 77.4],
    name: 'Jeredactyl Jump',
    type: 'Kiddie Rides'
  },
  SAUROMA: {
    id: 11,
    pos: [73.2, 79.6],
    name: 'Sauroma Bumpers',
    type: 'Kiddie Rides'
  },
  TYRANDRIENKOS: {
    id: 12,
    pos: [73.6, 84.4],
    name: 'Flying TyrAndrienkos',
    type: 'Kiddie Rides'
  },
  CYNDISAURUS: {
    id: 13,
    pos: [79.4, 87.4],
    name: 'Cyndisaurus Asteroid',
    type: 'Kiddie Rides'
  },
  BEELZEBUFO: {
    id: 14,
    pos: [76.2, 88.6],
    name: 'Beelzebufo',
    type: 'Kiddie Rides'
  },
  TOADSTOOLS: {
    id: 15,
    pos: [79.2, 89.6],
    name: 'Enchanted Toadstools',
    type: 'Kiddie Rides'
  },
  STEGOCYCLES: {
    id: 16,
    pos: [82.4, 80.6],
    name: 'Stegocycles',
    type: 'Kiddie Rides'
  },
  IGUANODON: {
    id: 17,
    pos: [83.4, 88.4],
    name: 'Blue Iguanodon',
    type: 'Kiddie Rides'
  },
  JUNGLECRUISE: {
    id: 18,
    pos: [85.6, 86.6],
    name: 'Wild Jungle Cruise',
    type: 'Kiddie Rides'
  },
  STONECUPS: {
    id: 19,
    pos: [87.6, 81.6],
    name: 'Stone Cups',
    type: 'Kiddie Rides'
  },

  // Rides for Everyone
  SCHOLTZ: {
    id: 20,
    pos: [6.6, 43.8],
    name: 'Scholtz Express',
    type: 'Rides for Everyone'
  },
  PALEOCARRIE: {
    id: 21,
    pos: [35.2, 68],
    name: 'Paleocarrie Carousel',
    type: 'Rides for Everyone'
  },
  JURASSIC: {
    id: 22,
    pos: [17.6, 67.8],
    name: 'Jurassic Road',
    type: 'Rides for Everyone'
  },
  RHYNASAURUS: {
    id: 23,
    pos: [16.4, 49.6],
    name: 'Rhynasaurus Rampage',
    type: 'Rides for Everyone'
  },
  KAUF: {
    id: 24,
    pos: [43.6, 56.4],
    name: 'Kauf\'s Lost Canyon Escape',
    type: 'Rides for Everyone'
  },
  MAIASAUR: {
    id: 25,
    pos: [26.6, 59.6],
    name: 'Maiasaur Madness',
    type: 'Rides for Everyone'
  },
  KRISTANODON: {
    id: 26,
    pos: [28.6, 66.2],
    name: 'Kristanodon Kaper',
    type: 'Rides for Everyone'
  },
  SQUIDOSAUR: {
    id: 27,
    pos: [48.4, 87.4],
    name: 'Squidosaur',
    type: 'Rides for Everyone'
  },
  EBERLESAURUS: {
    id: 28,
    pos: [23.6, 54.4],
    name: 'Eberiesaurus Roundup',
    type: 'Rides for Everyone'
  },
  DYKESADACTYL: {
    id: 29,
    pos: [87.2, 48.8],
    name: 'Dykesadactyl Thrill',
    type: 'Rides for Everyone'
  },
  ICHTHYOROBERTS: {
    id: 30,
    pos: [78.6, 37.6],
    name: 'Ichthyoroberts Rapids',
    type: 'Rides for Everyone'
  },
  RAPTORRACE: {
    id: 31,
    pos: [43.6, 78.4],
    name: 'Raptor Race',
    type: 'Rides for Everyone'
  },

  // Food
  THERESAUR: {
    id: 35,
    pos: [58.8, 46.4],
    name: 'Theresaur Food Stop',
    type: 'Food'
  },
  PALEO: {
    id: 36,
    pos: [35.6, 16.2],
    name: 'Paleo Shreckwiches',
    type: 'Food'
  },
  KRYSTAL: {
    id: 37,
    pos: [59.6, 89.2],
    name: 'Krystal Cook Cafe',
    type: 'Food'
  },
  SHILOBITE: {
    id: 38,
    pos: [57.6, 73.0],
    name: 'Shilobite o\'Pizza',
    type: 'Food'
  },
  CHENSATIONAL: {
    id: 39,
    pos: [87.4, 68.0],
    name: 'Chensational Sweets',
    type: 'Food'
  },
  SMOKY: {
    id: 53,
    pos: [16, 40.8],
    name: 'Smoky Wood BBQ',
    type: 'Food'
  },
  ICE: {
    id: 54,
    pos: [84.4, 78.8],
    name: 'Ice Age Cones',
    type: 'Food'
  },
  PLAISANTLY: {
    id: 55,
    pos: [76.2, 61.4],
    name: 'Plaisantly Popped Corn',
    type: 'Food'
  },
  FLORAL: {
    id: 56,
    pos: [43.2, 75.6],
    name: 'Floral Funnels',
    type: 'Food'
  },
  PERMAFROSTIES: {
    id: 57,
    pos: [42.2, 20.8],
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
    pos: [24.4, 66.8],
    name: 'EberTrex Fries',
    type: 'Food'
  },

  // Restrooms
  RAPTORREST: {
    id: 49,
    pos: [4.6, 66.8],
    name: 'Raptor Restroom',
    type: 'Restrooms'
  },
  TARPIT: {
    id: 50,
    pos: [52.6, 28.6],
    name: 'Tar Pit Stop',
    type: 'Restrooms'
  },
  LAVATORY: {
    id: 51,
    pos: [55.2, 50.2],
    name: 'Lavatory',
    type: 'Restrooms'
  },
  TRICERA: {
    id: 52,
    pos: [76.2, 73.6],
    name: 'TriceraStop',
    type: 'Restrooms'
  },
  DARWIN: {
    id: 65,
    pos: [22.6, 27.8],
    name: 'Darwin\'s Stop',
    type: 'Restrooms'
  },
  TYRANNOSAURUS: {
    id: 66,
    pos: [74.2, 21.4],
    name: 'Tyrannosaurus Rest',
    type: 'Restrooms'
  },
  RISCHING: {
    id: 67,
    pos: [92, 77.6],
    name: 'Fisching Rooms',
    type: 'Restrooms'
  },

  // Beer Gardens
  ALVAREZ: {
    id: 33,
    pos: [21.6, 32.8],
    name: 'Alvarez Beer Garden',
    type: 'Beer Gardens'
  },
  MARYANNING: {
    id: 34,
    pos: [78.4, 25.2],
    name: 'Mary Anning Beer Garden',
    type: 'Beer Gardens'
  },

  // Shopping
  MUNZASAURUS: {
    id: 40,
    pos: [42.4, 60.6],
    name: 'Munzasaurus Souvenirs',
    type: 'Shopping'
  },
  LASKONASAUR: {
    id: 41,
    pos: [58.0, 64.4],
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
    pos: [44.6, 26.2],
    name: 'Whitley\'s Plushadactyl',
    type: 'Shopping'
  },
  STASKOSAURUS: {
    id: 44,
    pos: [69.2, 73.0],
    name: 'Staskosaurus Designs',
    type: 'Shopping'
  },
  DINOCHIC: {
    id: 45,
    pos: [58.0, 80.6],
    name: 'Dino Chic Clothing',
    type: 'Shopping'
  },
  PETROGLYPH: {
    id: 46,
    pos: [22.8, 35.2],
    name: 'Petroglyph Body Art',
    type: 'Shopping'
  },
  LEGENODONS: {
    id: 47,
    pos: [69.4, 58.8],
    name: 'League of Legenodons',
    type: 'Shopping'
  },
  MAGICCAVERN: {
    id: 48,
    pos: [30.6, 67.6],
    name: 'The Magic Cavern',
    type: 'Shopping'
  },

  // Shows & Entertainment
  CREIGHTON: {
    id: 32,
    pos: [32.6, 33.8],
    name: 'Creighton Pavilion',
    type: 'Shows & Entertainment'
  },
  GRINOSAURUS: {
    id: 63,
    pos: [76.2, 22.6],
    name: 'Grinosaurus Stage',
    type: 'Shows & Entertainment'
  },
  SABRETOOTH: {
    id: 64,
    pos: [87.6, 63.6],
    name: 'SabreTooth Theatre',
    type: 'Shows & Entertainment'
  },
  PRIMAL: {
    id: 61,
    pos: [69.2, 67.0],
    name: 'Primal Carnage Arcade',
    type: 'Shows & Entertainment'
  },

  // Information & Assistance
  DAILYSLAB: {
    id: 60,
    pos: [67.8, 90.6],
    name: 'Daily Slab Maps and Info',
    type: 'Information & Assistance'
  },
  LIGGEMENT: {
    id: 62,
    pos: [50.4, 57.6],
    name: 'Liggement Fix-Me-Up',
    type: 'Information & Assistance'
  }
};

/** @export */
module.exports = {
  test: function() {
    for (var key in facilities) {
      if (facilities[key].pos == undefined) {
        console.error('no pos for', key);
      }
    }
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
   * @returns {facilities}
   */
  allFacilities: function() {
    return facilities;
  }
};
