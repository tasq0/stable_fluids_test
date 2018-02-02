var ModelCanvas = function(w, h) {
  this.width = w;
  this.height = h;

  this.scene = null;
  this.camera = null;

  this.renderer = null;

  this.renderTarget = null;
}

ModelCanvas.prototype.init = function () {
  this.scene = new THREE.Scene();

  this.camera = new THREE.OrthographicCamera( this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, 1, 1000 );
  this.camera.position.set(0, 0, 30);

  this.renderer = new THREE.WebGLRenderer();
  this.renderer.setSize(this.width, this.height);
  this.renderer.setClearColor(0xffffff, 1.0);

  document.body.appendChild(this.renderer.domElement);

  this.initScene();

  //this.setInitialDensity();

  this.updateCanvas();
};


ModelCanvas.prototype.initScene = function () {
  var geom = new THREE.PlaneGeometry(this.width, this.height);
  var material = new THREE.ShaderMaterial({
    vertexShader: document.getElementById('vshader').textContent,
    fragmentShader: document.getElementById('fshader').textContent
  })
  var plane = new THREE.Mesh(geom, material);
  this.scene.add(plane);
};

ModelCanvas.prototype.updateCanvas = function () {
  requestAnimationFrame(this.updateCanvas.bind(this));
  this.renderer.render(this.scene, this.camera);
};
