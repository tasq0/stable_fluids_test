var ModelCanvas = function(w, h) {
  this.width = w;
  this.height = h;

  this.scene = null;
  this.camera = null;

  this.geom = null;
  this.material = null;
  this.plane = null;

  this.renderer = null;

  this.solver = null;

  this.dens = null;
}

ModelCanvas.prototype.init = function () {
  this.scene = new THREE.Scene();

  this.camera = new THREE.OrthographicCamera( this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, 1, 1000 );
  this.camera.position.set(0, 0, 30);

  this.renderer = new THREE.WebGLRenderer();
  this.renderer.setSize(this.width, this.height);
  this.renderer.setClearColor(0xffffff, 1.0);

  document.body.appendChild(this.renderer.domElement);

  this.solver = new Solver(this.width, this.height, 8 + 1);
  this.solver.init(0.01, 0.01, 0.3);
  this.dens = this.solver.step();

  this.initScene();

  this.updateCanvas();
};


ModelCanvas.prototype.initScene = function () {
  this.geom = new THREE.PlaneGeometry(this.width, this.height, 10, 10);
  this.material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      /*
      this.geom.faces[2*(10 * i + j)].color = new THREE.Color(this.dens[i][j], 0.0, 0.0);
      this.geom.faces[2*(10 * i + j) + 1].color = new THREE.Color(this.dens[i][j], 0.0, 0.0);
      */
      this.geom.faces[2*(10 * i + j)].vertexColors.push(new THREE.Color(this.dens[i][j], 0.0, 0.0)); //0
      this.geom.faces[2*(10 * i + j)].vertexColors.push(new THREE.Color(this.dens[i+1][j], 0.0, 0.0)); //11
      this.geom.faces[2*(10 * i + j)].vertexColors.push(new THREE.Color(this.dens[i][j+1], 0.0, 0.0)); //1

      this.geom.faces[2*(10 * i + j) + 1].vertexColors.push(new THREE.Color(this.dens[i+1][j], 0.0, 0.0)); //11
      this.geom.faces[2*(10 * i + j) + 1].vertexColors.push(new THREE.Color(this.dens[i+1][j+1], 0.0, 0.0)); //2
      this.geom.faces[2*(10 * i + j) + 1].vertexColors.push(new THREE.Color(this.dens[i][j+1], 0.0, 0.0)); //1
    }
  }
  this.plane = new THREE.Mesh(this.geom, this.material);
  this.scene.add(this.plane);
};

ModelCanvas.prototype.updateScene = function () {
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      /*
      this.geom.faces[2*(10 * i + j)].color.setRGB(this.dens[i][j], 0.0, 0.0);
      this.geom.faces[2*(10 * i + j) + 1].color.setRGB(this.dens[i][j], 0.0, 0.0);
      */
      this.geom.faces[2*(10 * i + j)].vertexColors[0].setRGB(this.dens[i][j], 0.0, 0.0); //0
      this.geom.faces[2*(10 * i + j)].vertexColors[1].setRGB(this.dens[i+1][j], 0.0, 0.0); //11
      this.geom.faces[2*(10 * i + j)].vertexColors[2].setRGB(this.dens[i][j+1], 0.0, 0.0); //1

      this.geom.faces[2*(10 * i + j) + 1].vertexColors[0].setRGB(this.dens[i+1][j], 0.0, 0.0); //11
      this.geom.faces[2*(10 * i + j) + 1].vertexColors[1].setRGB(this.dens[i+1][j+1], 0.0, 0.0); //2
      this.geom.faces[2*(10 * i + j) + 1].vertexColors[2].setRGB(this.dens[i][j+1], 0.0, 0.0); //1
    }
  }
};


ModelCanvas.prototype.updateCanvas = function () {
  requestAnimationFrame(this.updateCanvas.bind(this));
  this.renderer.render(this.scene, this.camera);
  this.dens = this.solver.step();
  this.updateScene();
  this.geom.colorsNeedUpdate = true;
};
