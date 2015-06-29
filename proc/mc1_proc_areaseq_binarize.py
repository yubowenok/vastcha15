import time, sys
from dateutil.parser import parse
import struct
from struct import *

files = [
  "MC1/grouped-area-sequence-Fri.dat",
  "MC1/grouped-area-sequence-Sat.dat",
  "MC1/grouped-area-sequence-Sun.dat"
]

cnt = 0

for file_name in files:
  file_bin = file_name[0:-4] + '.bin'

  fin = open(file_name, 'r')
  fout = open(file_bin, 'wb')
  
  num_pids = int(fin.readline())
  p = pack('i', num_pids)
  fout.write(p)
  
  data = []
  
  for i in range(num_pids):
    line = fin.readline()
    tokens = line.split(' ')
    pid, num_act = int(tokens[0]), int(tokens[1])
    p = pack('hh', pid, num_act)
    fout.write(p)
    for j in range(num_act):
      line = fin.readline()
      tokens = line.split(' ')
      tm, area = int(tokens[0]), int(tokens[1])
      p = pack('ib', tm, area)
      fout.write(p)
    if i % 500 == 0:
      print >> sys.stderr, i
  fin.close()
  fout.close()
  print >> sys.stderr, file_name + " complete"
  
