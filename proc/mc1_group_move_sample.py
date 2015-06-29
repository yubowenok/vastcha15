import time, sys
from dateutil.parser import parse
import struct
from struct import *

grouping_file = 'MC1/grouping.dat'

files = [
  "MC1/move-sample-Fri.dat",
  "MC1/move-sample-Sat.dat",
  "MC1/move-sample-Sun.dat"
]


fin = open(grouping_file, 'r')
num_groups = int(fin.readline());
groups = []
for gid in range(num_groups):
  np = int(fin.readline());
  line = fin.readline()
  pids = line.split(' ')
  g=[]
  for pid in pids:
    g.append(int(pid))
  groups.append(g)
  
  
fin.close()


for file_name in files:
  file_out = file_name[:4]+'grouped-'+file_name[4:]

  fin = open(file_name, 'r')
  fout = open (file_out, 'w')

  data=[0]*15000
  num_pids = int(fin.readline())
  for i in range(num_pids):
    line = fin.readline()
    tokens = line.split(' ')
    pid, num_act = int(tokens[0]), int(tokens[1])
    dataP=[]
    for j in range(num_act):
      line = fin.readline()
      tokens = line.split(' ')
      tm, event = int(tokens[0]), int(tokens[1])
      x, y = int(tokens[2]), int(tokens[3])
      dataP.append([tm, event, x, y])
    data[pid] = dataP
  print >> sys.stderr, 'Read'+file_name + " complete"
  fin.close()

  num_gids=0
  for g in groups:
    np = len(g)
    if data[g[0]]!=0:
      num_gids+=1
  
  fout.write(str(num_gids)+'\n')
  gid=0
  for g in groups:
    if data[g[0]]!=0:
      fout.write(str(gid)+' '+str(len(data[g[0]])) +'\n')
      for dg in data[g[0]]:
        fout.write(str(dg[0])+' '+str(dg[1])+' '+str(dg[2])+' '+str(dg[3])+'\n')   
    gid+=1
  fout.close()
  print >> sys.stderr, 'Write'+file_out + " complete"
  