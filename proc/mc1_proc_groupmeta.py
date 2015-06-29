import time, sys
from dateutil.parser import parse
import struct
from struct import *

grouping_file = 'MC1/grouping.dat'
meta_file = 'GC.meta'

file_out = 'grouping.meta'

fin = open(meta_file, 'r')
fout = open(file_out, 'w')

num_lines = int(fin.readline())
pidmap = []

for i in range(num_lines):
  line = fin.readline()
  tokens = line.split(' ')
  pid, rawid = int(tokens[0]), int(tokens[1])
  pidmap.append(rawid)
fin.close()  

fin = open(grouping_file, 'r')

num_groups = int(fin.readline());
fout.write( str(num_groups)+'\n');
for gid in range(num_groups):
  np = int(fin.readline());
  fout.write( str(gid)+' '+str(np)+'\n');
  line = fin.readline()
  pids = line.split(' ')
  outline = ''
  for pid in pids:
    outline = outline + str( pidmap[int(pid)]) +' '
  fout.write(outline[:-1]+'\n')
  
fin.close()
fout.close()
print >> sys.stderr, 'write '+ file_out + " complete"

