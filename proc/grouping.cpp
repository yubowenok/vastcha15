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
#define INF 1E9
#define START 1402066800
#define MAXPID 11377
#define SQR(x) (x)*(x)

const string file_path = "C:\\Users\\zaPray\\Dropbox\\vastcha15_data\\MC1";
const string infiles[3] = { "move-sample-Fri.dat", "move-sample-Sat.dat", "move-sample-Sun.dat" };
const string outfiles[3] = { "groups-Fri.dat", "groups-Sat.dat", "groups-Sun.dat" };
const double error_threshold = 10; // unlikelyhood threshold for grouping

struct activity{
  int t;
  double x, y;
  activity(){}
  activity(int _t, int _x, int _y) { t = _t; x = _x; y = _y; }
};


vector<activity> A[MAXPID];
vector<vector<int> > groups;
vector<int> pids;
int gid[MAXPID];

activity interp(activity a, activity b, int tm)
{
  activity ans;
  ans.t = tm;
  ans.x = b.x * (tm - a.t) + a.x*(b.t - tm);
  ans.x /= b.t - a.t;
  ans.y = b.y * (tm - a.t) + a.y*(b.t - tm);
  ans.y /= b.t - a.t;
  return ans;
}

double dist(activity a, activity b)
{
  return sqrt(SQR(a.x-b.x)+SQR(a.y-b.y));
}

double edit_dist(int x, int y)
{
  int i = 0, j = 0;
  int cnt=0;
  double err = 0;

  while (i < A[x].size() && j < A[y].size())
  {
    if (A[x][i].t == A[y][j].t)
    {
      err += dist(A[x][i], A[y][j]);
      cnt++;
      i++; j++;
    }
    else if (A[x][i].t < A[y][j].t) {
      if (j > 0) {
        activity tmp = interp(A[y][j - 1], A[y][j], A[x][i].t);
        err += dist(A[x][i], tmp);
        cnt++;
      }
      else {
        err += dist(A[x][i], A[y][j]);
        cnt++;
      }
      i++;
    }
    else {
      if (i > 0) {
        activity tmp = interp(A[x][i - 1], A[x][i], A[y][j].t);
        err += dist(A[y][j], tmp);
        cnt++;
      }
      else {
        err += dist(A[x][i], A[y][j]);
        cnt++;
      }
      j++;
    }
  }
  while (i < A[x].size())
  {
    activity tmp = interp(A[y][A[y].size()-2], A[y].back(), A[x][i].t);
    err += dist(A[x][i], tmp);
    cnt++;
    i++;
  }
  while (j < A[y].size())
  {
    activity tmp = interp(A[x][A[x].size() - 2], A[x].back(), A[y][j].t);
    err += dist(A[y][j], tmp);
    cnt++;
    j++;
  }

  return err / cnt;
}

void grouping() {
  groups.clear();
  int npids = pids.size();
  FILL(gid, -1);

  for (int pi = 0; pi < npids; pi++){
    int i = pids[pi];
    if (gid[i] == -1){
      vector<int> newgroup;
      newgroup.push_back(i);
      gid[i] = groups.size();
      if (A[i].size() > 1)
        for (int pj = pi + 1; pj < npids && pj < pi + 301; pj++) {
          int j = pids[pj];
          if (gid[j] == -1) {
            double error = edit_dist(i, j);
            if (i < 12 && j < 12)
              cerr <<"err: "<< error << endl;
            if (error <= error_threshold){
              newgroup.push_back(j);
              gid[j] = groups.size();
              fprintf(stderr, "pid %d -> group %d, error %.2f (to pid %d).\n",
                j, gid[j], error, i);
              fprintf(stdout, "pid %d -> group %d, error %.2f (to pid %d).\n",
                j, gid[j], error, i);
            }
            else if (error <= 2 * error_threshold) {
              fprintf(stderr, "pid %d NOT -> group %d, error %.2f (to pid %d).\n",
                j, gid[j], error, i);
              fprintf(stdout, "pid %d NOT -> group %d, error %.2f (to pid %d).\n",
                j, gid[j], error, i);
            }
          }
        }
      groups.push_back(newgroup);
      fprintf(stderr, "i=%d outer loop done\n", i);
    }
  }
  fprintf(stderr, "Grouping done. All %d groups.\n", groups.size());
}



int main()
{
  FILE *fp;

  for (int day = 0; day < 3; day++) {
    string file = file_path + "\\" + infiles[day];
    fprintf(stderr, "Reading %s...\n", file);
    fp = fopen(file.c_str(), "r");
    int n;
    fscanf(fp, "%d", &n);

    pids.clear();
    pids.resize(n);
    for (int i = 0; i < n; i++) {
      int pid, na;
      fscanf(fp, "%d %d", &pid, &na);
      pids[i] = pid;
      A[pid].clear();
      for (int j = 0; j < na; j++) {
        int t, e, x, y;
        fscanf(fp, "%d %d %d %d", &t, &e, &x, &y);
        A[pid].push_back(activity(t, x, y));
      }
    }
    fclose(fp);
    fprintf(stderr, "Reading complete\n");
    grouping();

    file = file_path + "\\" + outfiles[day];
    fp = fopen(file.c_str(), "w");
    fprintf(fp, "%d\n", groups.size());
    for (auto g : groups)
      for (int i = 0; i<g.size(); i++) {
        fprintf(fp, "%d", g[i]);
        fprintf(fp, i == g.size() - 1 ? "\n" : " ");
      }
    fclose(fp);
  }


}
