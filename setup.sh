##
#
# Run to setup the data
#
##

# cleanup and create folders
rm -rf data
mkdir data
mkdir data/move
mkdir data/comm

# fetch meta data
curl -L -o data/GC.meta https://www.dropbox.com/s/4bzem6yu6dweny8/GC.meta?dl=0

# fetch move data
curl -L -o data/move/park-movement-Fri.bin https://www.dropbox.com/s/du4dhtl9dfwfpuf/park-movement-Fri.bin?dl=0
curl -L -o data/move/park-movement-Sat.bin https://www.dropbox.com/s/sy12i36s811iie0/park-movement-Sat.bin?dl=0
curl -L -o data/move/park-movement-Sun.bin https://www.dropbox.com/s/w5omplnlddw8tba/park-movement-Sun.bin?dl=0

# fetch comm data
curl -L -o data/comm/comm-data-Fri.bin https://www.dropbox.com/s/rc80kpil5vypqax/comm-data-Fri.bin?dl=0
curl -L -o data/comm/comm-data-Sat.bin https://www.dropbox.com/s/7q2vcgd917pezjv/comm-data-Sat.bin?dl=0
curl -L -o data/comm/comm-data-Sun.bin https://www.dropbox.com/s/ea5w7cgc3x3sy70/comm-data-Sun.bin?dl=0

# fetch area seq data
curl -L -o data/move/area-sequence-Fri.bin https://www.dropbox.com/s/6wqhjpl7jmj1s4g/area-sequence-Fri.bin?dl=0
curl -L -o data/move/area-sequence-Sat.bin https://www.dropbox.com/s/ta6qj53f6d79shn/area-sequence-Sat.bin?dl=0
curl -L -o data/move/area-sequence-Sun.bin https://www.dropbox.com/s/alktdu56oetv970/area-sequence-Sun.bin?dl=0

# fetch move sample data
curl -L -o data/move/move-sample-Fri.bin https://www.dropbox.com/s/2qipazx720mtmdh/move-sample-Fri.bin?dl=0
curl -L -o data/move/move-sample-Sat.bin https://www.dropbox.com/s/15ltok0rs6c2dq4/move-sample-Sat.bin?dl=0
curl -L -o data/move/move-sample-Sun.bin https://www.dropbox.com/s/j2gpftbwdbbf1ke/move-sample-Sun.bin?dl=0

# fetch groups data
curl -L -o data/groups-Fri.dat https://www.dropbox.com/s/8mb1f86509fiqlb/groups-Fri.dat?dl=0
curl -L -o data/groups-Sat.dat https://www.dropbox.com/s/i75enf9ikff0ene/groups-Sat.dat?dl=0
curl -L -o data/groups-Sun.dat https://www.dropbox.com/s/iho1jcqnd00puv4/groups-Sun.dat?dl=0

# fetch faci seq data
curl -L -o data/move/faci-sequence-Fri.bin https://www.dropbox.com/s/fd3ecd56ji1xch0/faci-sequence-Fri.bin?dl=0
curl -L -o data/move/faci-sequence-Sat.bin https://www.dropbox.com/s/coqz8byesfs9h04/faci-sequence-Sat.bin?dl=0
curl -L -o data/move/faci-sequence-Sun.bin https://www.dropbox.com/s/uhbcznen0ji17l3/faci-sequence-Sun.bin?dl=0
