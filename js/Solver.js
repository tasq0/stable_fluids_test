var Solver = function(w, h, N) {
  this.width = w;
  this.height = h;
  this.N = N;

  this.forcex = null; //divw x divh
  this.forcey = null;
  this.source = null; //divw x divh
  this.viscosity = null;
  this.diffusion = null;

  this.u0 = null;
  this.u1 = null;

  this.v0 = null;
  this.v1 = null;

  this.scal0 = null;
  this.scal1 = null;

  this.dt = null;
}

Solver.prototype.init = function (vis, diff, dt) {
  this.viscosity = vis;
  this.diffusion = diff;
  this.dt = dt; //stepごとに決めたいが

  //後でここをユーザ入力にしたい
  this.forcex = [];
  this.forcey = [];
  this.source = [];
  this.u0 = [];
  this.u1 = [];
  this.v0 = [];
  this.v1 = [];
  this.scal0 = [];
  this.scal1 = [];
  for (var i = 0; i < this.N + 2; i++) {
    this.forcex[i] = [];
    this.forcey[i] = [];
    this.source[i] = [];
    this.u0[i] = [];
    this.u1[i] = [];
    this.v0[i] = [];
    this.v1[i] = [];
    this.scal0[i] = [];
    this.scal1[i] = [];
    for (var j = 0; j < this.N + 2; j++) {
      this.forcex[i][j] = 0.0;
      this.forcey[i][j] = 0.0;
      this.source[i][j] = 0.0;
      this.u0[i][j] = this.forcex[i][j];
      this.u1[i][j] = 0.0;
      this.v0[i][j] = this.forcey[i][j];
      this.v1[i][j] = 0.0;
      this.scal0[i][j] = this.source[i][j];
      this.scal1[i][j] = 0.0;
    }
  }

  this.source[3][4] = 0.99;
  //this.forcex[2][2] = 0.2;
};

Solver.prototype.step = function () {
  this.velStep();
  this.scalarStep();
  return this.scal1;
  //redraw(出力this.scal1をModelCanvasに渡す)
};

Solver.prototype.velStep = function () {
  this.addForce(this.u1, this.forcex);
  this.addForce(this.v1, this.forcey);
  [this.u0, this.u1] = [this.u1, this.u0];
  [this.v0, this.v1] = [this.v1, this.v0];
  this.diffuse(this.u0, this.u1, this.viscosity, 1);
  this.diffuse(this.v0, this.v1, this.viscosity, 2);
  this.project(this.u1, this.v1, this.u0, this.v0);
  [this.u0, this.u1] = [this.u1, this.u0];
  [this.v0, this.v1] = [this.v1, this.v0];
  this.advect(1, this.u1, this.u0, this.u0, this.v0);
  this.advect(2, this.v1, this.v0, this.u0, this.v0);
  this.project(this.u1, this.v1, this.u0, this.v0);
};

Solver.prototype.scalarStep = function () {
  this.addForce(this.scal1, this.source);
  [this.scal0, this.scal1] = [this.scal1, this.scal0];
  this.diffuse(this.scal0, this.scal1, this.diffusion, 0);
  [this.scal0, this.scal1] = [this.scal1, this.scal0];
  this.advect(0, this.scal1, this.scal0, this.u1, this.v1);
};

Solver.prototype.addForce = function (x, s) {
  for (var i = 0; i < this.N + 2; i++) {
    for (var j = 0; j < this.N + 2; j++) {
      x[i][j] += this.dt * s[i][j];
    }
  }
};

Solver.prototype.diffuse = function (x0, x1, diff, b) {
  var a = this.dt * diff * this.N * this.N;
  for(var k = 0; k < 20; k++){
    for (var i = 1; i < this.N + 1; i++) {
      for (var j = 1; j < this.N + 1; j++) {
        x1[i][j] = (x0[i][j] + a * (x1[i-1][j] + x1[i+1][j] + x1[i][j+1] + x1[i][j-1])) / (1.0 + 4.0 * a);
      }
    }
    this.setBoundary(this.N, b, x1);
  }
};

Solver.prototype.project = function (x1, y1, p, div) {
  for (var i = 1; i < this.N + 1; i++) {
    for (var j = 1; j < this.N + 1; j++) {
      div[i][j] = 0.5 * (x1[i][j+1] - x1[i][j-1] + y1[i+1][j] - y1[i-1][j]) / this.N;
      p[i][j] = 0.0;
    }
  }
  this.setBoundary(this.N, 0, div);
  this.setBoundary(this.N, 0, p);

  for(var k = 0; k < 20; k++){
    for (var i = 1; i < this.N + 1; i++) {
      for (var j = 1; j < this.N + 1; j++) {
        p[i][j] = (-div[i][j] + p[i+1][j] + p[i-1][j] + p[i][j+1] + p[i][j-1]) / 4.0;
      }
    }
    this.setBoundary(this.N, 0, p);
  }

  for (var i = 1; i < this.N + 1; i++) {
    for (var j = 1; j < this.N + 1; j++) {
      x1[i][j] -= 0.5 * this.N * (p[i+1][j] - p[i-1][j]);
      y1[i][j] -= 0.5 * this.N * (p[i][j+1] - p[i][j-1]);
    }
  }
  this.setBoundary(this.N, 1, x1);
  this.setBoundary(this.N, 2, y1);
};

//バックトレース
Solver.prototype.advect = function (b, d, d0, u, v) {
  var dt0 = this.dt * this.N;
  for (var i = 1; i < this.N + 1; i++) {
    for (var j = 1; j < this.N + 1; j++) {
      var x = i - dt0 * u[i][j];
      var y = j - dt0 * v[i][j];
      if(x<0.5) x = 0.5;
      if(x>this.N+0.5) x = this.N + 0.5;
      var i0 = Math.floor(x);
      var i1 = i0 + 1;
      if(y<0.5) y = 0.5;
      if(y>this.N+0.5) y = this.N + 0.5;
      var j0 = Math.floor(y);
      var j1 = j0 + 1;
      var s1 = x - i0;
      var s0 = 1.0 - s1;
      var t1 = y - j0;
      var t0 = 1 - t1;
      d[i][j] = s0 * (t0 * d0[i0][j0] + t1 * d0[i0][j1])
              + s1 * (t0 * d0[i1][j0] + t1 * d0[i1][j1]);
      //双線形補間
    }
  }
  this.setBoundary(this.N, b, d);
};

Solver.prototype.setBoundary = function (N, b, x) {
  for (var i = 0; i < N + 2; i++) {
    x[i][0] = b==1 ? -x[i][1] : x[i][1];
    x[i][N+1] = b==1 ? -x[i][N+1] : x[i][N+1];
  }
  for (var j = 0; j < N + 2; j++) {
    x[0][j] = b==2 ? -x[1][j] : x[1][j];
    x[N+1][j] = b==2 ? -x[N+1][j] : x[N+1][j];
  }
  x[0][0] = 0.5 * (x[0][1] + x[1][0]);
  x[N+1][0] = 0.5 * (x[N+1][1] + x[N][0]);
  x[0][N+1] = 0.5 * (x[0][N] + x[1][N+1]);
  x[N+1][N+1] = 0.5 * (x[N][N+1]+x[N+1][N]);
};
