var Solver = function(w, h, divw, divh) {
  this.width = w;
  this.height = h;
  this.divw = divw;
  this.divh = divh;

  this.forcex = null; //divw x divh
  this.forcey = null;
  this.sourcex = null; //divw x divh
  this.sourcey = null;
  this.viscosity = null;
  this.diffusion = null;

  this.u0 = null;
  this.u1 = null;

  this.v0 = null;
  this.v1 = null;

  this.dt = null;
}

Solver.prototype.init = function (vis, diff, dt) {
  this.viscosity = vis;
  this.diffusion = diff;
  this.dt = dt; //stepごとに決めたいが

  //後でここをユーザ入力にしたい
  this.forcex = [];
  this.forcey = [];
  this.sourcex = [];
  this.sourcey = [];
  this.u0 = [];
  this.u1 = [];
  this.v0 = [];
  this.v1 = [];
  for (var i = 0; i < this.divh + 2; i++) {
    this.forcex[i] = [];
    this.forcey[i] = [];
    this.sourcex[i] = [];
    this.sourcey[i] = [];
    this.u0[i] = [];
    for (var j = 0; j < this.divw + 2; j++) {
      this.forcex[i][j] = 0.0;
      this.forcey[i][j] = 0.0;
      this.sourcex[i][j] = 0.0;
      this.sourcey[i][j] = 0.0;
      this.u0[i][j] = this.forcex[i][j];
      this.u1[i][j] = 0.0;
      this.v0[i][j] = this.forcey[i][j];
      this.v1[i][j] = 0.0;
    }
  }
};

Solver.prototype.step = function () {
  this.velStep();
  this.scalarStep();
  //redraw(出力u1をModelCanvasに渡す)
};

Solver.prototype.velStep = function () {
  this.addForce(this.u1, this.forcex);
  this.addForce(this.v1, this.forcey);
  this.swap(this.u0, this.u1);
  this.swap(this.v0, this.v1);
  this.diffuse(this.u0, this.u1, 1);
  this.diffuse(this.v0, this.v1, 2);
  this.project(this.u1, this.v1, this.u0, this.v0);
  this.swap(this.u0, this.u1);
  this.swap(this.v0, this.v1);
  this.advect();
  this.project(this.u1, this.v1, this.u0, this.v0);
};

Solver.prototype.swap = function (a, b) {
  var tmp = a;
  a = b;
  b = tmp;
};

Solver.prototype.addForce = function (x, s) {
  for (var i = 0; i < this.divh + 2; i++) {
    for (var j = 0; j < this.divw + 2; j++) {
      x[i][j] += this.dt * s[i][j];
    }
  }
};

Solver.prototype.diffuse = function (x0, x1, b) {
  var a = this.dt * this.viscosity * this.divw * this.divh;
  for(var k = 0; k < 20; k++){
    for (var i = 1; i < this.divh + 1; i++) {
      for (var j = 1; j < this.divw + 1; j++) {
        x1[i][j] = (x0[i][j] + a * (x1[i-1][j] + x1[i+1][j] + x1[i][j+1] + x1[i][j-1]) / (1 + 4 * a);
      }
    }
    this.setBoundary(this.divw, this.divh, b, x1);
  }
};

Solver.prototype.project = function (x1, y1, p, div) {
  for (var i = 1; i < this.divh + 1; i++) {
    for (var j = 1; j < this.divw + 1; j++) {
      div[i][j] = 0.5 * ((x1[i][j+1] - x1[i][j-1]) / this.divw + (y1[i+1][j] - y1[i-1][j]) / this.divh);
      p[i][j] = 0.0;
    }
  }
  setBoundary(this.divw, this.divh, 0, div);
  setBoundary(this.divw, this.divh, 0, p);

  for(var k = 0; k < 20; k++){
    for (var i = 1; i < this.divh + 1; i++) {
      for (var j = 1; j < this.divw + 1; j++) {
        p[i][j] = (-div[i][j] + p[i+1][j] + p[i-1][j] + p[i][j+1] + p[i][j-1]) / 4.0;
      }
    }
    this.setBoundary(this.divw, this.divh, 0, p);
  }

  for (var i = 1; i < this.divh + 1; i++) {
    for (var j = 1; j < this.divw + 1; j++) {
      x1[i][j] -= 0.5 * this.divw * (p[i+1][j] - p[i-1][j]);
      y1[i][j] -= 0.5 * this.divh * (p[i][j+1] - p[i][j-1]);
    }
  }
  this.setBoundary(this.divw, this.divh, b, x1);
  this.setBoundary(this.divw, this.divh, b, y1);
};

//バックとレース
Solver.prototype.advect = function () {

};

Solver.prototype.scalarStep = function () {

};

Solver.prototype.setBoundary = function (divw, divh, b, x) {
  for (var i = 0; i < divh + 2; i++) {
    x[i][0] = b==1 ? -x[i][1] : x[i][1];
    x[i][divw+1] = b==1 ? -x[i][divw+1] : x[i][divw+1];
  }
  for (var j = 0; j < divw + 2; j++) {
    x[0][j] = b==2 ? -x[1][j] : x[1][j];
    x[divh+1][j] = b==2 ? -x[divh+1][j] : x[divh+1][j];
  }
  x[0][0] = 0.5 * (x[0][1] + x[1][0]);
  x[divh+1][0] = 0.5 * (x[divh+1][1] + x[divh][0]);
  x[0][divw+1] = 0.5 * (x[0][divw] + x[1][divw+1]);
  x[divh+1][divw+1] = 0.5 * (x[divh][divw+1]+x[divh+1][divw]);
};
