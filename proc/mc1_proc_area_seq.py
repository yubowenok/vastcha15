import time, sys
from dateutil.parser import parse
import struct
from struct import *

# return area code of coordinates
def areaOf(x,y):
    if (y < 52.06):
      if (y < 29.08):
        if (y < 29):
          ans = 4; # Coaster Alley (250124/0) [124992/0]
        elif (x < 46.06):
          ans = 3; # Wet Land (420/137) [212/64]
        else:
          ans = 4;  # Coaster Alley (6626/352) [3399/228]
      else:
        if (x < 82.89):
          ans = 3; # Wet Land (1089591/4870) [544626/2371]
        elif (y < 45):
          ans = 4; # Coaster Alley (18537/66) [9341/39]
        else:
          ans = 0; # Kiddie Land (8986/489) [4562/263]
    else:
      if (x < 51.37):
        if (y < 53):
          if (x < 48.87):
            ans = 3; # Wet Land (4295/2097) [2247/1104]
          else:
            ans = 2; # Tundra Land (1591/143) [846/51]
        else:
          ans = 2; # Tundra Land (559056/227) [279446/113]
      else:
        if (x < 70.55):
          ans = 1; # Entry Corridor (323223/2048) [161566/975]
        else:
          ans = 0; # Kiddie Land (244597/628) [122287/318]
  
    return ans;

files = [
  "MC1/park-movement-Fri.dat",
  "MC1/park-movement-Sat.dat",
  "MC1/park-movement-Sun.dat"
]

cnt = 0
#maxarea=0
for file_name in files:
  file_bin = 'MC1/area-sequence' + file_name[-8:-4] + '.bin'

  fin = open(file_name, 'r')
  fout = open(file_bin, 'wb')
  
  num_lines = int(fin.readline())
  
  data = {}
  last = {}
  
  for line in fin:
    tokens = line.split(' ')
    tm, id, event = int(tokens[0]), int(tokens[1]), int(tokens[2])
    x, y = int(tokens[3]), int(tokens[4])
    state = areaOf(x,y) + (1 - event) * 10
    if (data.has_key(id)):
      if (data[id][-1][1] != state):
        data[id].append([tm, state]);
    else:
      data[id] = [[tm, state]];
    last[id] = [tm, state];
  fin.close()  
  print >> sys.stderr, 'read '+file_name + " complete"

  num_ids = len(data)
  p = pack('i', num_ids)
  fout.write(p)

  for id in data:
    #maxarea = max(len(data[id]),maxarea)
    p = pack('hh',id, len(data[id])+1)
    fout.write(p)
    for v in data[id]:
      p = pack('ib', v[0],v[1])
      fout.write(p)
    p = pack('ib', last[id][0], last[id][1])
    fout.write(p)
  fout.close()
  print >> sys.stderr, 'write '+file_bin + " complete"

