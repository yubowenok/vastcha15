import time, sys
from dateutil.parser import parse

# get meta data
ids, events, locations = {}, {}, {} # mapping
file_meta = open("GC.meta", 'r')
num_people = int(file_meta.readline())
for i in range(num_people):
  tokens = file_meta.readline().rstrip('\n').split(' ')
  index, id = int(tokens[0]), int(tokens[1])
  ids[id] = index
num_events = int(file_meta.readline())
for i in range(num_events):
  file_meta.readline()
num_locations = int(file_meta.readline())
for i in range(num_locations):
  tokens = file_meta.readline().rstrip('\n').split(' ')
  index, location = int(tokens[0]), tokens[1] + ' ' + tokens[2]
  locations[location] = index
  
print locations

files = [
  ["MC2/comm-data-Fri.csv", "2014-6-06 00:00:00"],
  ["MC2/comm-data-Sat.csv", "2014-6-07 00:00:00"],
  ["MC2/comm-data-Sun.csv", "2014-6-08 00:00:00"]
]

cnt = 0

for file_info in files:
  file_name, base_tm = file_info[0], file_info[1]
  file_dat = file_name[0:-4] + '.dat'
  
  base_tmstamp = int(time.mktime(parse(base_tm).timetuple()))

  fin = open(file_name, 'r')
  fout = open(file_dat, 'w')
  
  data = []
  
  first_line = True
  for line in fin:
    if first_line:
      first_line = False # skip first line
      continue 
    tokens = line.rstrip('\n').split(',')
      
    tm, id1, id2, location = tokens[0], int(tokens[1]), tokens[2], tokens[3]
    if id2 == "external":
      id2 = 9999999
    else:
      id2 = int(id2)
    
    # manually compute the hh:mm:ss seconds and add it to base, parse(tm) is very slow
    hh, mm, ss = int(tm[10:12]), int(tm[13:15]), int(tm[16:18])
    tmstamp = base_tmstamp + hh * 3600 + mm * 60 + ss
    
    data.append([
      tmstamp, 
      ids[id1],
      ids[id2],
      locations[location]
    ])
    cnt += 1
    if cnt % 100000 == 0:
      print >> sys.stderr, cnt
  
  fout.write("%d\n" % len(data))
  for row in data:
    fout.write(' '.join(str(x) for x in row))
    fout.write('\n')
  
  fin.close()
  fout.close()
  print >> sys.stderr, file_name + " complete"