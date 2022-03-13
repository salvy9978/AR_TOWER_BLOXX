//Variables globales
let pisos = 10;
let vidas = 3;
let vidasTotales = vidas;
let pisosActuales = 0;
let win = false;
let isPlaneInPlaceGlobal = false;

/* rellenar tabla de puntos */
function docReady(fn) {
  // see if DOM is already available
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

docReady(function () {
  var tabla = document.querySelector("#tabla-puntos");

  for (var i = 0; i < pisos; i++) {
    var tr = document.createElement("tr");
    var td = tr.appendChild(document.createElement("td"));
    td.className = "punto";
    tabla.appendChild(tr);
  }
});

/*eslint-disable*/
function positionAmmoBody(body, p) {
  const transform = new Ammo.btTransform();

  body.getMotionState().getWorldTransform(transform);

  const positionVec = new Ammo.btVector3(p.x, p.y, p.z);

  transform.setOrigin(positionVec);
  body.getMotionState().setWorldTransform(transform);
  body.setCenterOfMassTransform(transform);
  body.activate();

  // Clean up
  Ammo.destroy(transform);
  Ammo.destroy(positionVec);
}

function createBox(scene, pos) {
  const box = document.createElement("a-entity");
  box.setAttribute("gltf-model", "#piso");
  box.setAttribute("ammo-body", "type: dynamic; emitCollisionEvents: true;");

  box.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
  box.setAttribute("scale", "0.1 0.1 0.1");
  box.setAttribute(
    "ammo-shape",
    "type: box; fit: manual; halfExtents:0.1 0.1 0.1"
  );

  box.setAttribute("id", "myBox");
  box.setAttribute("ammo-restitution", ".5");
  box.setAttribute("collision-detection", {});
  box.setAttribute("mass", "1000");

  scene.appendChild(box);

  box.addEventListener("body-loaded", () => {
    positionAmmoBody(box.body, box.object3D.position);
    const velocity = new Ammo.btVector3(0, 0, 0);
    box.body.setLinearVelocity(velocity);
    Ammo.destroy(velocity);
  });

  return box;
}

AFRAME.registerComponent("collision-detection", {
  init() {
    //console.log("init");
    this.el.addEventListener("collidestart", function (e) {
      //console.log(e);
    });
  }
});

AFRAME.registerSystem("hit-test-system", {
  schema: {
    reticle: { type: "selector" },
    target: { type: "selector" }
  },
  init: function () {
    this.cubes = [];
    this.startTime = 0;
    //this.cubes.push(document.querySelector("a-entity"));

    this.isPlaneInPlace = false;
    this.reticle = this.data.reticle;
    this.target = this.data.target;

    this.el.sceneEl.addEventListener("enter-vr", (e) => {
      const session = this.el.sceneEl.renderer.xr.getSession();
      let frame = this.el.sceneEl.frame;
      this.el.sceneEl.renderer.xr.addEventListener(
        "sessionstart",
        async (ev) => {
          this.viewerSpace = await session.requestReferenceSpace("viewer");
          this.refSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();
          this.xrHitTestSource = await session.requestHitTestSource({
            space: this.viewerSpace
          });
        }
      );

      session.addEventListener("select", (e) => {
        const pos = this.reticle.getAttribute("position");
        if (this.reticle.getAttribute("visible") && !this.isPlaneInPlace) {
          this.isPlaneInPlace = true;
          isPlaneInPlaceGlobal = true;
          this.target.setAttribute("visible", "true");
          this.target.setAttribute("position", pos);

          //positionAmmoBody(this.target.body, pos);
        }

        if (this.isPlaneInPlace) {
          this.cubes.forEach((cube) =>
            cube.components["ammo-body"].syncToPhysics()
          );

          if (pisosActuales == 0) {
            this.cubes.push(createBox(this.el.sceneEl, pos));
          } else {
            var boxMoving = document.querySelector("#boxMoving");
            this.cubes.push(
              createBox(this.el.sceneEl, boxMoving.object3D.position)
            );
          }
        }
      });
    });
  },

  tick: function (time, timeDelta) {
    this.reticle.setAttribute("visible", "false");
    const frame = this.el.sceneEl.frame;
    if (!frame) return;

    var floorPlane = this.target.object3D.position.y;
    var pisosCorrectos = pisosActuales;
    //Primera funcion hallar altura
    /*
    this.cubes.forEach((cube) => {
      //console.log(cube.object3D);
      if (cube.object3D.position.y > floorPlane) {
        pisosCorrectos += 1;
        floorPlane = cube.object3D.position.y;
      }
    });
    */
    //Segunda funcion hallar altura

    floorPlane = this.target.object3D.position.y;
    var max = 0;

    if (time - this.startTime > 500) {
      /*
      this.cubes.forEach((cube) => {
        //console.log(cube.object3D);
        if (cube.object3D.position.y - floorPlane > max) {
          max = cube.object3D.position.y - floorPlane;
        }
      });

      pisosCorrectos = Math.ceil(max / 0.2);
      if (pisosCorrectos > pisosActuales) {
        pisosCorrectos = pisosActuales + 1;
      }*/
      //Tercera funcion hallar altura
      floorPlane = 0;
      pisosCorrectos = 0;
      var first = true;

      this.cubes.forEach((cube) => {
        //console.log(cube.object3D);
        if (first) {
          floorPlane = cube.object3D.position.y;
          pisosCorrectos += 1;
          first = false;
        } else {
          if (cube.object3D.position.y - floorPlane > 0.1) {
            pisosCorrectos += 1;
            floorPlane = cube.object3D.position.y;
          }
        }
      });

      this.startTime = time;

      if (pisosActuales != pisosCorrectos && pisosCorrectos <= pisos) {
        if (pisosActuales > pisosCorrectos) {
          for (var i = 0; i < pisos - pisosCorrectos; i++) {
            document.querySelector("#tabla-puntos").children[
              i
            ].children[0].className = "punto";
          }
        } else {
          for (var i = pisosActuales; i < pisosCorrectos; i++) {
            document.querySelector("#tabla-puntos").children[
              pisos - 1 - i
            ].children[0].className = "puntoAzul";
          }
        }

        pisosActuales = pisosCorrectos;
      }

      let vidasAux = vidas;
      var fallos = this.cubes.length - pisosActuales;

      if (fallos != 0) {
        vidasAux = vidasTotales - fallos;
      }

      if (vidasAux != vidas && win == false) {
        var divVidas = document.querySelector("#div-vidas");
        if (vidasAux <= 0 || vidas - vidasAux <= 0) {
          divVidas.innerHTML = "";
          var txtWin = document.createElement("strong");
          txtWin.style.color = "red";
          txtWin.style.fontSize = "300%";
          txtWin.position = "float: right;";
          const textNode = document.createTextNode("LOSE :(");
          txtWin.appendChild(textNode);
          divVidas.append(txtWin);
          /*
        for (var i = 0; i < pisos; i++) {
          document.querySelector("#tabla-puntos").children[
            i
          ].children[0].className = "punto";
        }*/
        } else {
          for (var i = 0; i < vidas - vidasAux; i++) {
            divVidas.removeChild(divVidas.firstElementChild);
          }
        }
        vidas = vidasAux;
      }

      if (pisosActuales >= pisos && vidas > 0) {
        //console.log("Win");
        win = true;
        var divVidas = document.querySelector("#div-vidas");
        divVidas.innerHTML = "";
        var txtWin = document.createElement("strong");
        txtWin.style.color = "gold";
        txtWin.style.fontSize = "300%";
        txtWin.position = "float: right;";
        const textNode = document.createTextNode("WIN!!!");
        txtWin.appendChild(textNode);
        divVidas.append(txtWin);
      }
    }
    const viewerPose = this.el.sceneEl.renderer.xr.getCameraPose();
    if (!this.isPlaneInPlace && this.xrHitTestSource && viewerPose) {
      const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
      if (hitTestResults.length > 0) {
        const hitTestPose = hitTestResults[0].getPose(this.refSpace);
        ["x", "y", "z"].forEach((axis) => {
          this.reticle.object3D.position[axis] =
            hitTestPose.transform.position[axis];
        });
        this.reticle.object3D.quaternion.copy(
          hitTestPose.transform.orientation
        );
        this.reticle.setAttribute("visible", "true");
      }
    }
  }
});

AFRAME.registerComponent("ammo-restitution", {
  schema: { default: 0.5 },
  init() {
    const el = this.el;
    const restitution = this.data;
    el.addEventListener("body-loaded", function () {
      el.body.setRestitution(restitution);
    });
  }
});

AFRAME.registerComponent("movable", {
  schema: {
    speed: { type: "number", default: 0.1 }
  },
  init() {
    this.t = 0;
    this.direction = 1;
    this.then = 0;
    this.positioned = false;
    this.centerPlaneX = 0;
    this.centerPlaneY = 0;
  },

  tick(now) {
    if (isPlaneInPlaceGlobal && !this.positioned) {
      var target = document.querySelector("#plane");
      ["x", "y", "z"].forEach((axis) => {
        this.el.object3D.position[axis] = target.object3D.position[axis];
      });
      this.centerPlaneX = target.object3D.position.x;
      this.centerPlaneY = target.object3D.position.y;
      this.positioned = true;
    }

    let delta = (now - this.then) / 1000;

    this.t += this.data.speed * this.direction * delta;

    this.then = now;
    if (this.t >= 0.3) {
      this.direction = -1;
    } else if (this.t <= -0.3) {
      this.direction = 1;
    }

    this.el.object3D.position.x = this.centerPlaneX + this.t;
    this.el.object3D.position.y =
      this.centerPlaneY + 0.12 + pisosActuales * 0.2;
  }
});
