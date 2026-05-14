(function () {
  function createBasicOrbitController(camera, canvas) {
    const state = {
      theta: Math.PI / 4,
      phi: 1.05,
      radius: 55,
      target: new THREE.Vector3(0, -3, 0),
      dragging: false,
      enabled: true,
      pointerX: 0,
      pointerY: 0,
    };

    function applyCamera() {
      const sinPhi = Math.sin(state.phi);
      camera.position.set(
        state.target.x + state.radius * sinPhi * Math.cos(state.theta),
        state.target.y + state.radius * Math.cos(state.phi),
        state.target.z + state.radius * sinPhi * Math.sin(state.theta),
      );
      camera.lookAt(state.target);
    }

    canvas.addEventListener("pointerdown", function (event) {
      if (!state.enabled || event.button !== 0) {
        return;
      }
      state.dragging = true;
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", function (event) {
      if (!state.enabled || !state.dragging) {
        return;
      }

      const dx = event.clientX - state.pointerX;
      const dy = event.clientY - state.pointerY;
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      state.theta -= dx * 0.008;
      state.phi = Math.min(Math.PI - 0.2, Math.max(0.35, state.phi + dy * 0.008));
    });

    function stopDragging(event) {
      if (!state.dragging) {
        return;
      }
      state.dragging = false;
      canvas.releasePointerCapture(event.pointerId);
    }

    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);
    canvas.addEventListener("wheel", function (event) {
      if (!state.enabled) {
        return;
      }
      event.preventDefault();
      state.radius = Math.min(120, Math.max(16, state.radius + event.deltaY * 0.02));
    }, { passive: false });

    applyCamera();

    return {
      update: applyCamera,
      setEnabled: function (enabled) {
        state.enabled = enabled;
        if (!enabled) {
          state.dragging = false;
        }
      },
    };
  }

  function createSceneApp(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04111d, 0.0125);

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      500,
    );

    const controls = createBasicOrbitController(camera, canvas);

    const ambient = new THREE.HemisphereLight(0xaedbff, 0x08111b, 1.05);
    scene.add(ambient);

    const rim = new THREE.DirectionalLight(0xfff2d0, 1.4);
    rim.position.set(20, 28, 15);
    scene.add(rim);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i += 1) {
      const radius = 140 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0xd8ebff,
        size: 0.8,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
      }),
    ));

    window.addEventListener("resize", function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { renderer: renderer, scene: scene, camera: camera, controls: controls };
  }

  window.Relativity = window.Relativity || {};
  window.Relativity.scene = { createSceneApp };
})();
