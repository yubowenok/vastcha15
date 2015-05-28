import time, sys
from dateutil.parser import parse
import struct
from struct import *

files = [
  "MC2/comm-data-Fri.dat",
  "MC2/comm-data-Sat.dat",
  "MC2/comm-data-Sun.dat",
]

cnt = 0

for file_name in files:
  file_bin = file_name[0:-4] + '.bin'

  fin = open(file_name, 'r')
  fout = open(file_bin, 'wb')
  
  num_lines = int(fin.readline())
  p = pack('i', num_lines)
  fout.write(p)
  
  data = []
  
  for line in fin:
    tokens = line.split(' ') 
    tm, id1, id2, location = int(tokens[0]), int(tokens[1]), int(tokens[2]), int(tokens[3])
    p = pack('ihhb', tm, id1, id2, location)
    fout.write(p)
   
    cnt += 1
    if cnt % 100000 == 0:
      print >> sys.stderr, cnt
  fin.close()
  fout.close()
  print >> sys.stderr, file_name + " complete"


# verifier
for file_name in files:
  file_bin = file_name[0:-4] + '.bin'
  fin = open(file_bin, 'rb')
  b = fin.read(4)

  num_lines = unpack('i', b)
  b = fin.read(struct.calcsize('ihhb'))
  line = unpack('ihhb', b)
  print num_lines, line
  fin.close()