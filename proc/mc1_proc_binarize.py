import time, sys
from dateutil.parser import parse
import struct
from struct import *

files = [
  "MC1/park-movement-Fri.dat",
  "MC1/park-movement-Sat.dat",
  "MC1/park-movement-Sun.dat"
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
    tm, id, event = int(tokens[0]), int(tokens[1]), int(tokens[2])
    x, y = int(tokens[3]), int(tokens[4])
    p = pack('ihbbb', tm, id, event, x, y)
    
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
  b = fin.read(struct.calcsize('ihbbb'))
  line = unpack('ihbbb', b)
  print num_lines, line
  fin.close()