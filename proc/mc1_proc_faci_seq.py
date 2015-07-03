import time, sys
from dateutil.parser import parse
import struct
import math
from struct import *

facilityType = {
  'None': 0,
  'Thrill Rides': 1,
  'Kiddie Rides': 2,
  'Rides for Everyone': 3,
  'Food': 4,
  'Restrooms': 5,
  'Shopping': 6,
  'Shows & Entertainment': 7,
  'Information & Assistance': 8
}

facilities = [
  {
    'id': 1,
    'pos': [47.040927867, 10.987107363],
    'name': 'Wrightiraptor Mountain',
    'type': 'Thrill Rides'
  },
  {
    'id': 2,
    'pos': [27.038528685, 14.998974024],
    'name': 'Galactosaurus Rage',
    'type': 'Thrill Rides'
  },
  {
    'id': 3,
    'pos': [38.067521443, 90.051070808],
    'name': 'Auvilotops Express',
    'type': 'Thrill Rides'
  },
  {
    'id': 4,
    'pos': [78.088910747, 47.960487191],
    'name': 'TerrorSaur',
    'type': 'Thrill Rides'
  },
  {
    'id': 5,
    'pos': [16.000909327, 65.995645523],
    'name': 'Wendisaurus Chase',
    'type': 'Thrill Rides'
  },
  {
    'id': 6,
    'pos': [86.070873762, 43.853585059],
    'name': 'Keimosaurus Big Spin',
    'type': 'Thrill Rides'
  },
  {
    'id': 7,
    'pos': [17.024694081, 42.996571385],
    'name': 'Firefall',
    'type': 'Thrill Rides'
  },
  {
    'id': 8,
    'pos': [45.05799614, 23.989115395],
    'name': 'Atmosfear',
    'type': 'Thrill Rides'
  },
  {
    'id': 81,
    'pos': [69.047102022, 44.019185952],
    'name': 'Flight of the Swingodon',
    'type': 'Thrill Rides'
  },

  # Kiddie Rides
  {
    'id': 9,
    'pos': [92.045180723, 81.005882536],
    'name': 'North Line',
    'type': 'Kiddie Rides'
  },
  {
    'id': 10,
    'pos': [81.047720755, 76.981276072],
    'name': 'Jeredactyl Jump',
    'type': 'Kiddie Rides'
  },
  {
    'id': 11,
    'pos': [73.015592241, 78.939107397],
    'name': 'Sauroma Bumpers',
    'type': 'Kiddie Rides'
  },
  {
    'id': 12,
    'pos': [73.065793045, 84.034488923],
    'name': 'Flying TyrAndrienkos',
    'type': 'Kiddie Rides'
  },
  {
    'id': 13,
    'pos': [79.014588225, 87.021436715],
    'name': 'Cyndisaurus Asteroid',
    'type': 'Kiddie Rides'
  },
  {
    'id': 14,
    'pos': [75.977439631, 87.975251976],
    'name': 'Beelzebufo',
    'type': 'Kiddie Rides'
  },
  {
    'id': 15,
    'pos': [78.989487824, 88.97926804],
    'name': 'Enchanted Toadstools',
    'type': 'Kiddie Rides'
  },
  {
    'id': 16,
    'pos': [82.026636418, 79.993324265],
    'name': 'Stegocycles',
    'type': 'Kiddie Rides'
  },
  {
    'id': 17,
    'pos': [83.030652482, 87.925051172],
    'name': 'Blue Iguanodon',
    'type': 'Kiddie Rides'
  },
  {
    'id': 18,
    'pos': [85.013584209, 86.042521052],
    'name': 'Wild Jungle Cruise',
    'type': 'Kiddie Rides'
  },
  {
    'id': 19,
    'pos': [86.996515936, 81.122842337],
    'name': 'Stone Cups',
    'type': 'Kiddie Rides'
  },

  # Rides for Everyone
  {
    'id': 20,
    'pos': [6.039821848, 42.97798207],
    'name': 'Scholtz Express',
    'type': 'Rides for Everyone'
  },
  {
    'id': 21,
    'pos': [34.030679767, 68.006001628],
    'name': 'Paleocarrie Carousel',
    'type': 'Rides for Everyone'
  },
  {
    'id': 22,
    'pos': [17.02885036, 66.95750794],
    'name': 'Jurassic Road',
    'type': 'Rides for Everyone'
  },
  {
    'id': 23,
    'pos': [16.054882089, 49.002078455],
    'name': 'Rhynasaurus Rampage',
    'type': 'Rides for Everyone'
  },
  {
    'id': 24,
    'pos': [42.994913475, 55.972485892],
    'name': 'Kauf\'s Lost Canyon Escape',
    'type': 'Rides for Everyone'
  },
  {
    'id': 25,
    'pos': [26.034784623, 58.98236186],
    'name': 'Maiasaur Madness',
    'type': 'Rides for Everyone'
  },
  {
    'id': 26,
    'pos': [27.999913466, 66.025152043],
    'name': 'Kristanodon Kaper',
    'type': 'Rides for Everyone'
  },
  {
    'id': 27,
    'pos': [48.057481283, 86.938621009],
    'name': 'Squidosaur',
    'type': 'Rides for Everyone'
  },
  {
    'id': 28,
    'pos': [23.047836831, 53.962281539],
    'name': 'Eberiesaurus Roundup',
    'type': 'Rides for Everyone'
  },
  {
    'id': 29,
    'pos': [86.998238759, 48.026727548],
    'name': 'Dykesadactyl Thrill',
    'type': 'Rides for Everyone'
  },
  {
    'id': 30,
    'pos': [78.021453411, 37.005206355],
    'name': 'Ichthyoroberts Rapids',
    'type': 'Rides for Everyone'
  },
  {
    'id': 31,
    'pos': [42.99152314, 77.970861066],
    'name': 'Raptor Race',
    'type': 'Rides for Everyone'
  },

  # Food
  {
    'id': 35,
    'pos': [59.210409012, 45.476473805],
    'name': 'Theresaur Food Stop',
    'type': 'Food'
  },
  {
    'id': 36,
    'pos': [35.092504186, 14.963631099],
    'name': 'Paleo Shreckwiches',
    'type': 'Food'
  },
  {
    'id': 37,
    'pos': [58.960858908, 88.915105835],
    'name': 'Krystal Cook Cafe',
    'type': 'Food'
  },
  {
    'id': 38,
    'pos': [56.958236875, 73.09870266],
    'name': 'Shilobite o\'Pizza',
    'type': 'Food'
  },
  {
    'id': 39,
    'pos': [87.071011173, 67.988069678],
    'name': 'Chensational Sweets',
    'type': 'Food'
  },
  {
    'id': 53,
    'pos': [15.050866025, 39.991034279],
    'name': 'Smoky Wood BBQ',
    'type': 'Food'
  },
  {
    'id': 54,
    'pos': [83.843850269, 78.11717529],
    'name': 'Ice Age Cones',
    'type': 'Food'
  },
  {
    'id': 55,
    'pos': [75.858316793, 60.983474886],
    'name': 'Plaisantly Popped Corn',
    'type': 'Food'
  },
  {
    'id': 56,
    'pos': [42.815820329, 75.009013677],
    'name': 'Floral Funnels',
    'type': 'Food'
  },
  {
    'id': 57,
    'pos': [42.020847545, 20.876665596],
    'name': 'Permafrosties',
    'type': 'Food'
  },
  {
    'id': 58,
    'pos': [46.6, 78.8],
    'name': 'Granite Slab Pizza',
    'type': 'Food'
  },
  {
    'id': 59,
    'pos': [23.481841177, 65.949850839],
    'name': 'EberTrex Fries',
    'type': 'Food'
  },

  # Restrooms
  {
    'id': 49,
    'pos': [3.741967871, 65.971544445],
    'name': 'Raptor Restroom',
    'type': 'Restrooms'
  },
  {
    'id': 50,
    'pos': [51.921745043, 28.104563962],
    'name': 'Tar Pit Stop',
    'type': 'Restrooms'
  },
  {
    'id': 51,
    'pos': [54.968066303, 49.839456576],
    'name': 'Lavatory',
    'type': 'Restrooms'
  },
  {
    'id': 52,
    'pos': [76.277838483, 72.957949196],
    'name': 'TriceraStop',
    'type': 'Restrooms'
  },
  {
    'id': 65,
    'pos': [21.993347962, 27.172668803],
    'name': 'Darwin\'s Stop',
    'type': 'Restrooms'
  },
  {
    'id': 66,
    'pos': [74.252760973, 21.387537603],
    'name': 'Tyrannosaurus Rest',
    'type': 'Restrooms'
  },
  {
    'id': 67,
    'pos': [92.045180723, 77.115320287],
    'name': 'Fisching Rooms',
    'type': 'Restrooms'
  },

  # Beer Gardens
  {
    'id': 33,
    'pos': [20.949460402, 33.163725042],
    'name': 'Alvarez Beer Garden',
    'type': 'Beer Gardens'
  },
  {
    'id': 34,
    'pos': [78.921435672, 25.027095836],
    'name': 'Mary Anning Beer Garden',
    'type': 'Beer Gardens'
  },

  # Shopping
  {
    'id': 40,
    'pos': [41.840295002, 59.988550149],
    'name': 'Munzasaurus Souvenirs',
    'type': 'Shopping'
  },
  {
    'id': 41,
    'pos': [57.024477232, 64.255615005],
    'name': 'Laskonasaur Store',
    'type': 'Shopping'
  },
  {
    'id': 42,
    'pos': [17, 47.4],
    'name': 'World of WarRocks Shop',
    'type': 'Shopping'
  },
  {
    'id': 43,
    'pos': [44.104180879, 25.193934672],
    'name': 'Whitley\'s Plushadactyl',
    'type': 'Shopping'
  },
  {
    'id': 44,
    'pos': [69.04892282, 72.129635943],
    'name': 'Staskosaurus Designs',
    'type': 'Shopping'
  },
  {
    'id': 45,
    'pos': [56.927726378, 80.004463265],
    'name': 'Dino Chic Clothing',
    'type': 'Shopping'
  },
  {
    'id': 46,
    'pos': [22.104078876, 34.243042311],
    'name': 'Petroglyph Body Art',
    'type': 'Shopping'
  },
  {
    'id': 47,
    'pos': [69.023822418, 57.998109839],
    'name': 'League of Legenodons',
    'type': 'Shopping'
  },
  {
    'id': 48,
    'pos': [29.15453194, 66.953866903],
    'name': 'The Magic Cavern',
    'type': 'Shopping'
  },

  # Shows & Entertainment
  {
    'id': 32,
    'pos': [31.985190972, 33.027745737],
    'name': 'Creighton Pavilion',
    'type': 'Shows & Entertainment'
  },
  {
    'id': 63,
    'pos': [76.009789086, 21.989947242],
    'name': 'Grinosaurus Stage',
    'type': 'Shows & Entertainment'
  },
  {
    'id': 64,
    'pos': [87.02081037, 63.01819016],
    'name': 'SabreTooth Theatre',
    'type': 'Shows & Entertainment'
  },
  {
    'id': 61,
    'pos': [68.973621615, 66.933852811],
    'name': 'Primal Carnage Arcade',
    'type': 'Shows & Entertainment'
  },

  # Information & Assistance
  {
    'id': 60,
    'pos': [67.441116049, 90.364847768],
    'name': 'Daily Slab Maps and Info',
    'type': 'Information & Assistance'
  },
  {
    'id': 62,
    'pos': [50.006413041, 57.008974809],
    'name': 'Liggement Fix-Me-Up',
    'type': 'Information & Assistance'
  }
];


FACI_RADIUS = 3

def getFacility(x, y):
  minDist, ans = 1E9, 0
  for i in range(len(facilities)):
    faci = facilities[i]
    pos = faci['pos'];
    dx, dy = x - pos[0], y - pos[1]
    d = math.sqrt(dx * dx + dy * dy)
    if d < FACI_RADIUS and d < minDist:
      minDist = d
      ans = faci['id']
  return ans


files = [
  "MC1/park-movement-Fri.dat",
  "MC1/park-movement-Sat.dat",
  "MC1/park-movement-Sun.dat"
]

cnt = 0
#maxarea=0
for file_name in files:
  file_bin = 'MC1/faci-sequence' + file_name[-8:-4] + '.bin'

  fin = open(file_name, 'r')
  fout = open(file_bin, 'wb')

  num_lines = int(fin.readline())

  data = {}
  last = {}

  count_lines = 0
  proc_lines = 0

  for line in fin:
    count_lines = count_lines + 1
    proc_lines = proc_lines + 1
    if count_lines == 100000:
      count_lines = 0
      print >> sys.stderr, '%d/%d lines' % (proc_lines , num_lines)

    tokens = line.split(' ')
    tm, id, event = int(tokens[0]), int(tokens[1]), int(tokens[2])
    x, y = int(tokens[3]), int(tokens[4])

    state = getFacility(x, y);

    if (data.has_key(id)):
      if (data[id][-1][1] != state):
        data[id].append([tm, state]);
    else:
      data[id] = [[tm, state]];
    last[id] = [tm, state];
  fin.close()
  print >> sys.stderr, 'read ' + file_name + " complete"

  num_ids = len(data)
  p = pack('i', num_ids)
  fout.write(p)

  for id in data:
    #maxarea = max(len(data[id]),maxarea)
    p = pack('hh', id, len(data[id])+1)
    fout.write(p)
    for v in data[id]:
      p = pack('ib', v[0], v[1])
      fout.write(p)
    p = pack('ib', last[id][0], last[id][1])
    fout.write(p)
  fout.close()
  print >> sys.stderr, 'write ' + file_bin + " complete"

