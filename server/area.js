/**
*
* Function map from (x,y) to area code
*
**/

'use strict';


/** @export */
module.exports = {
  areaName: ['Kiddie Land', 'Entry Corridor', 'Tundra Land',
            'Wet Land', 'Coaster Alley'],

  /**
   * Return the area for input coordinates(x,y)
   * @param {int} x,y
   * @return {int} area code
   */
  areaOf: function(x, y) {
    var ans;

    // Human eye classification
    // if (y<30 ) ans = 4; //Coaster Alley
    // else if (y<=54  && x<82) ans = 3; //Wet Land
    // else if (x<51) ans = 2; //Tundra Land
    // else if (x>=72) ans = 0; //Kiddie Land
    // else ans = 1; //Entry Corridor

    // Decision tree, accuracy 99.559%
    if (y < 52.06) {
      if (y < 29.08) {
        if (y < 29) ans = 4;// Coaster Alley (250124/0) [124992/0]
        else if (x < 46.06) ans = 3;// Wet Land (420/137) [212/64]
        else ans = 4;  // Coaster Alley (6626/352) [3399/228]
      } else {
        if (x < 82.89) ans = 3; // Wet Land (1089591/4870) [544626/2371]
        else if (y < 45) ans = 4; // Coaster Alley (18537/66) [9341/39]
        else ans = 0; // Kiddie Land (8986/489) [4562/263]
      }
    } else {
      if (x < 51.37)
        if (y < 53)
            if (x < 48.87) ans = 3; // Wet Land (4295/2097) [2247/1104]
            else ans = 2; // Tundra Land (1591/143) [846/51]
        else ans = 2; // Tundra Land (559056/227) [279446/113]
      else {
        if (x < 70.55) ans = 1; // Entry Corridor (323223/2048) [161566/975]
        else ans = 0; // Kiddie Land (244597/628) [122287/318]
      }
    }
    return ans;
  }
};
