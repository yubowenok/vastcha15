# must run after mc1_proc_meta.py

import time, sys
from dateutil.parser import parse

files = [
  "MC2/comm-data-Fri.csv",
  "MC2/comm-data-Sat.csv",
  "MC2/comm-data-Sun.csv",
]

locationCounter, idCounter = 0, 0
ids, locations, events = {}, {}, {}

# get meta data
file_meta = open("MC1.meta", 'r')
num_people = int(file_meta.readline())
for i in range(num_people):
  tokens = file_meta.readline().rstrip('\n').split(' ')
  index, id = int(tokens[0]), int(tokens[1])
  ids[id] = index
num_events = int(file_meta.readline())
for i in range(num_events):
  tokens = file_meta.readline().rstrip('\n').split(' ')
  index, event = int(tokens[0]), tokens[1]
  events[event] = index
file_meta.close()

idCounter = len(ids)

cnt = 0

for file_name in files:
  file = open(file_name)
  first_line = True
  for line in file:
    if first_line:
      first_line = False # skip first line
      continue 
    tokens = line.split(',')
      
    id1, id2, location = int(tokens[1]), tokens[2], tokens[3].rstrip('\n')
    if id2 == "external":
      id2 = 9999999  # not used in data
    else:
      id2 = int(id2)
    
    if location not in locations:
      locations[location] = locationCounter
      locationCounter += 1
    if id1 not in ids:
      ids[id1] = idCounter
      idCounter += 1
    if id2 not in ids:
      ids[id2] = idCounter
      idCounter += 1
      
    cnt += 1
    if cnt % 100000 == 0:
      print >> sys.stderr, cnt
  print >> sys.stderr, file_name + " complete"

# ids
ids_sorted = []
for key, value in ids.iteritems():
  ids_sorted.append([key, value])
# events
events_sorted = []
for key, value in events.iteritems():
  events_sorted.append([key, value])
# locations
locations_sorted = []
for key, value in locations.iteritems():
  locations_sorted.append([key, value])
# sorting
ids_sorted.sort(key = lambda x: x[1])
events_sorted.sort(key = lambda x: x[1])
locations_sorted.sort(key = lambda x: x[1])

# write meta data to a text file
file_meta = open("GC.meta", 'w')

n = len(ids_sorted)  # number of people
file_meta.write("%d\n" % n)
for row in ids_sorted:
  file_meta.write("%d %d\n" % (row[1], row[0]))
n = len(events_sorted)  # number of events
file_meta.write("%d\n" % n)
for row in events_sorted:
  file_meta.write("%d %s\n" % (row[1], row[0]))
n = len(locations_sorted)  # number of locations
file_meta.write("%d\n" % n)
for row in locations_sorted:
  file_meta.write("%d %s\n" % (row[1], row[0]))
  
file_meta.close()
