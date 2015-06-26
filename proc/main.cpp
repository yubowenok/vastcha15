#include <iostream>
#include <cstdio>
#include <cmath>
#include <cstring>
#include <algorithm>
#include <string>
#include <vector>
#include <stack>
#include <queue>
#include <set>
#include <map>
#include <sstream>
#include <complex>
#include <ctime>
#include <cassert>
#include <functional>

using namespace std;

#define FILL(x,v) memset(x,v,sizeof(x))


const string file_path = "C:\\Users\\zaPray\\Dropbox\\vastcha15_data\\MC1";
const string infiles[3] = { "park-movement-Fri.dat", "park-movement-Sat.dat", "park-movement-Sun.dat" };
const string outfiles[3] = { "move-sample-Fri.dat", "move-sample-Sat.dat", "move-sample-Sun.dat" };
const double tol = 1; // tolerent

struct activity{
  int timestamp;
  char event;
  char x, y;
};

vector<activity> data[20000];
vector<activity> samp[20000];

void sampling(vector<activity> &act)
{
  vector<activity> ans;
  int n = act.size();
  if (n <= 1) return;

  int i = 0;
  ans.push_back(act[0]);
  while (i < n - 1) {
    int far = i + 1;
    for (int j = i + 2; j < n; j++)
    {
      double cost = 0;
      for (int k = i + 1; k < j; k++)
      {
        double interp_x, interp_y;
        interp_x = double(act[k].timestamp - act[i].timestamp)*act[j].x + double(act[j].timestamp - act[k].timestamp)*act[i].x;
        interp_x /= (act[j].timestamp - act[i].timestamp);
        interp_y = double(act[k].timestamp - act[i].timestamp)*act[j].y + double(act[j].timestamp - act[k].timestamp)*act[i].y;
        interp_y /= (act[j].timestamp - act[i].timestamp);
        cost += (act[k].x - interp_x)*(act[k].x - interp_x) + (act[k].y - interp_y)*(act[k].y - interp_y);
      }
      if (cost / (j - i - 1) <= tol) far = j;
    }
    i = far;
    ans.push_back(act[i]);
  }
  act = ans;
  return;
}


int main()
{
  FILE *fp;
  for (int day = 0; day < 3; day++) {
    string file = file_path + "\\" + infiles[day];
    fprintf(stderr, "Reading %s...\n",file );
    fp = fopen(file.c_str(), "r");
    int n;
    fscanf(fp, "%d", &n);
    
    set<short> pids;

    for(int i=0; i<n; i++) {
      activity a;
      short pid;
      fscanf(fp, "%d %d %d %d %d", &a.timestamp, &pid, &a.event, &a.x, &a.y);
      data[pid].push_back(a);
      pids.insert(pid);
    }

    file = file_path + "\\" + outfiles[day];
    fp = fopen(&(file[0]), "w");
    fprintf(fp, "%d\n", pids.size());
    int cnt = 0, samps = 0, origs = 0;
    for (auto pid: pids){
      samp[pid].push_back(data[pid][0]);
      vector<activity> act;
      for (int i = 1; i < data[pid].size(); i++) {
        if (data[pid][i].event == 0) {
          sampling(act);
          for (auto v : act) samp[pid].push_back(v);
          act.clear();
          samp[pid].push_back(data[pid][i]);
        }
        else {
          if (act.size() == 0)
          {
            samp[pid].push_back(samp[pid].back());
            samp[pid].back().timestamp = data[pid][i].timestamp - 1;
          }
          act.push_back(data[pid][i]);
        }
      }
        
      fprintf(fp,"%d %d\n", pid, samp[pid].size());
      for (auto p:samp[pid]) {
        fprintf(fp, "%d %d %d %d\n", p.timestamp, p.event, p.x, p.y);
      }
        
      samps += samp[pid].size();
      origs += data[pid].size();
      data[pid].clear();
      cnt++;
      if (cnt % 100 == 0)
        fprintf(stderr, "Complete %d %%...\n", (int)cnt * 100 / pids.size());
    }
    fprintf(stderr, "Day %d: sampls/orings: %d/%d.\n", day, samps, origs);
  }
    
}
