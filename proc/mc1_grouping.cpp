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


const string file_path = "C:\\Users\\zaPray\\Dropbox\\vastcha15_data\\MC1";
const string infiles[3] = { "area-sequence-Fri.dat", "area-sequence-Sat.dat", "area-sequence-Sun.dat" };
const string outfile = "C:\\Users\\zaPray\\Desktop\\grouping.dat";
const double most_unlikely = 0.05; // unlikelyhood threshold for grouping

struct activity{
  int t, a;
  activity(int _t, int _a) { t = _t; a = _a; }
};

vector<activity> A[MAXPID];

vector<vector<int> > groups;
int gid[MAXPID];
int dp[2000][2000];
int edit_dist(int x, int y)
{
  vector<activity> Ax, Ay;
  set<int> times;  // all distict timestamps
  for (auto a : A[x]) times.insert(a.t);
  for (auto a : A[y]) times.insert(a.t);
  times.erase(times.begin());
  Ax.push_back(activity(START, -1));
  Ay.push_back(activity(START, -1));
  Ax.push_back(activity(START, -1));
  Ay.push_back(activity(START, -1));
  int i = 1, j = 1;
  for (int t : times) {
    if (i<A[x].size() && A[x][i].t == t) {
      Ax.back().t = t - 1;
      Ax.push_back(A[x][i]);
      Ax.push_back(A[x][i++]);
    }
    else {
      Ax.back().t = t - 1;
      Ax.push_back(Ax.back());
      Ax.back().t = t;
      Ax.push_back(Ax.back());
    }
    if (j<A[y].size() && A[y][j].t == t) {
      Ay.back().t = t - 1;
      Ay.push_back(A[y][j]);
      Ay.push_back(A[y][j++]);
    }
    else {
      Ay.back().t = t - 1;
      Ay.push_back(Ay.back());
      Ay.back().t = t;
      Ay.push_back(Ay.back());
    }
  }

  FILL(dp, 0x7f);
  dp[0][0] = 0;

  for (int i = 1; i < Ax.size(); i++) {
    dp[i][0] = Ax[i].t - START;
  }
  for (int j = 1; j < Ay.size(); j++) {
    dp[0][j] = Ay[j].t - START;
  }

  for (int i = 1; i < Ax.size(); i++)
    for (int j = 1; j < Ay.size(); j++)
    {
      int dij = INF;
      if (Ax[i].a == Ay[j].a)
        dij = abs(Ax[i].t - Ax[i - 1].t - Ay[j].t + Ay[j-1].t);

      if (dij < INF) {
        dp[i][j] = min(dp[i][j], dp[i - 1][j - 1] + dij);
      }
      else {
        dp[i][j] = min(dp[i][j], dp[i][j - 1] + Ay[j].t - Ay[j - 1].t);
        dp[i][j] = min(dp[i][j], dp[i - 1][j] + Ax[i].t - Ax[i - 1].t);
      }
    }

  return dp[Ax.size() - 1][Ay.size() - 1];
}

void grouping() {
  for (int i = 0; i < MAXPID; i++){
    if (gid[i] == -1){
      vector<int> newgroup;

      newgroup.push_back(i);
      gid[i] = groups.size();
      if (A[i].size() > 1)
        for (int j = i + 1; j < MAXPID; j++)
          if (gid[j] == -1) {
            int ed = edit_dist(i, j);
            double unlike = double(ed) / (A[i].back().t - A[i][0].t);
            
            if (unlike <= most_unlikely){
              newgroup.push_back(j);
              gid[j] = groups.size();
              fprintf(stderr, "pid %d is assigned to group %d with unlikelyhood %.3f%% (to pid %d).\n",
                j, gid[j], unlike * 100,i);
              fprintf(stdout, "pid %d is assigned to group %d with unlikelyhood %.3f%% (to pid %d).\n",
                j, gid[j], unlike * 100, i);
            }
            else if (unlike <= 3 * most_unlikely)
              fprintf(stderr, "pid %d is NOT assigned to group %d with unlikelyhood %.3f%% (to pid %d).\n",
              j, gid[j], unlike * 100, i);
              fprintf(stdout, "pid %d is NOT assigned to group %d with unlikelyhood %.3f%% (to pid %d).\n",
              j, gid[j], unlike * 100, i);
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

  for (int i = 0; i < MAXPID; i++)
    A[i].push_back(activity(START, -1));
  FILL(gid, -1);

  for (int day = 0; day < 3; day++) {
    string file = file_path + "\\" + infiles[day];
    fprintf(stderr, "Reading %s...\n", file);
    fp = fopen(file.c_str(), "r");
    int n;
    fscanf(fp, "%d", &n);

    for (int i = 0; i < n; i++) {
      int pid, na;
      fscanf(fp, "%d %d", &pid, &na);
      for (int j = 0; j < na; j++) {
        int t, a;
        fscanf(fp, "%d %d", &t, &a);
        A[pid].push_back(activity(t, a));
      }
      A[pid].back().t++;
      A[pid].back().a=-1;
    }
  }
  fclose(fp);

  grouping();

  fp = fopen(outfile.c_str(), "w");
  fprintf(fp, "%d\n", groups.size());
  for (auto g : groups)
  {
    fprintf(fp, "%d\n", g.size());
    for (auto x:g)
      fprintf(fp, "%d ", x);
    fprintf(fp, "\n");
  }
  fclose(fp);
}
