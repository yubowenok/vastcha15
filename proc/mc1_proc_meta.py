import time, sys
from dateutil.parser import parse

files = [
  "MC1/park-movement-Fri.csv",
  "MC1/park-movement-Sat.csv",
  "MC1/park-movement-Sun.csv",
]

eventCounter, idCounter = 0, 0
events, ids = {}, {}

data = {}

cnt = 0

for file_name in files:
  file = open(file_name)
  first_line = True
  for line in file:
    if first_line:
      first_line = False # skip first line
      continue 
    tokens = line.split(',')
      
    id, event = int(tokens[1]), tokens[2]
    
    if event not in events:
      events[event] = eventCounter
      eventCounter += 1
    if id not in ids:
      ids[id] = idCounter
      idCounter += 1
    
    cnt += 1
    if cnt % 100000 == 0:
      print >> sys.stderr, cnt
  print >> sys.stderr, file_name + " complete"

ids_sorted = []
for key, value in ids.iteritems():
  ids_sorted.append([key, value])
events_sorted = []
for key, value in events.iteritems():
  events_sorted.append([key, value])
ids_sorted.sort(key = lambda x: x[1])
events_sorted.sort(key = lambda x: x[1])

# write meta data to a text file
file_meta = open("MC1.meta", 'w')
n = len(ids_sorted)  # number of people
file_meta.write("%d\n" % n)
for row in ids_sorted:
  file_meta.write("%d %d\n" % (row[1], row[0]))
n = len(events_sorted)  # number of events
file_meta.write("%d\n" % n)
for row in events_sorted:
  file_meta.write("%d %s\n" % (row[1], row[0]))
  
file_meta.close()
