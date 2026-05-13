(function () {
  const entitiesApi = window.Relativity.entities;
  const metricApi = window.Relativity.metric;
  const sceneApi = window.Relativity.scene;
  const gridApi = window.Relativity.gridWarp;
  const lensingApi = window.Relativity.lensing;
  const trailsApi = window.Relativity.trails;
  const hudApi = window.Relativity.hud;

  const canvas = document.getElementById("scene");
  const hud = hudApi.createHud();
  const sceneApp = sceneApi.createSceneApp(canvas);

  const state = entitiesApi.createSimulationState(hud.getMass());
  entitiesApi.resetState(state, hud.getMass(), hud.getMode());

  const grid = gridApi.createWarpGrid(state.mass);
  sceneApp.scene.add(grid.group);

  const massObject = lensingApi.createMassVisualization(state.mass);
  sceneApp.scene.add(massObject);

  const entityMeshes = new Map();
  const trailManager = trailsApi.createTrailManager(sceneApp.scene);
  const clockMarkers = createClockMarkers();
  sceneApp.scene.add(clockMarkers.reference, clockMarkers.local);

  hud.onMassChange(function (mass) {
    entitiesApi.setMass(state, mass);
    gridApi.updateWarpGrid(grid, mass);
    lensingApi.updateMassVisualization(massObject, mass);
    syncObjectsToSurface();
  });

  hud.onModeChange(function (mode) {
    entitiesApi.resetState(state, hud.getMass(), mode);
    clearEntityMeshes();
    syncObjectsToSurface();
  });

  hud.onLaunchProbe(function () {
    entitiesApi.spawnProbe(state, hud.getMode());
  });

  hud.onLaunchPhoton(function () {
    entitiesApi.spawnPhoton(state);
  });

  hud.onReset(function () {
    entitiesApi.resetState(state, hud.getMass(), hud.getMode());
    clearEntityMeshes();
    syncObjectsToSurface();
  });

  hud.onPreset(function (data) {
    entitiesApi.setMass(state, data.mass);
    gridApi.updateWarpGrid(grid, data.mass);
    lensingApi.updateMassVisualization(massObject, data.mass);
    entitiesApi.resetState(state, data.mass, hud.getMode());
    clearEntityMeshes();
    syncObjectsToSurface();
  });

  const clock = new THREE.Clock();
  animate();

  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.033);
    const clockState = entitiesApi.updateSimulation(state, dt);

    syncEntityMeshes();
    trailManager.sync(state.entities);
    trailManager.update(state.entities);
    updateClockMarkers(clockState.localRadius);
    updateMassPulse(state.elapsed);

    const ratio = state.clocks.local.properTime / Math.max(0.0001, state.clocks.reference.properTime);
    hud.setClockValues(
      state.clocks.reference.properTime,
      state.clocks.local.properTime,
      ratio,
    );

    sceneApp.controls.update();
    sceneApp.renderer.render(sceneApp.scene, sceneApp.camera);
  }

  function syncEntityMeshes() {
    const liveEntities = new Set(state.entities);

    state.entities.forEach(function (entity) {
      if (!entityMeshes.has(entity)) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(entity.type === "photon" ? 0.42 : 0.68, 18, 18),
          new THREE.MeshStandardMaterial({
            color: entity.color,
            emissive: entity.color,
            emissiveIntensity: entity.type === "photon" ? 1.2 : 0.5,
            roughness: 0.3,
            metalness: 0.1,
          }),
        );
        sceneApp.scene.add(mesh);
        entityMeshes.set(entity, mesh);
      }

      entityMeshes.get(entity).position.copy(entity.position);
    });

    entityMeshes.forEach(function (mesh, entity) {
      if (liveEntities.has(entity)) {
        return;
      }

      sceneApp.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      entityMeshes.delete(entity);
    });
  }

  function clearEntityMeshes() {
    entityMeshes.forEach(function (mesh) {
      sceneApp.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    entityMeshes.clear();
    trailManager.sync([]);
  }

  function createClockMarkers() {
    const geometry = new THREE.RingGeometry(1.5, 1.95, 48);
    const reference = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x8cc8ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      }),
    );
    reference.rotation.x = -Math.PI / 2;
    reference.position.set(0, -0.2, 80);

    const local = new THREE.Mesh(
      geometry.clone(),
      new THREE.MeshBasicMaterial({
        color: 0x7cf7b6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      }),
    );
    local.rotation.x = -Math.PI / 2;
    local.position.set(0, -0.2, 18);

    return { reference: reference, local: local };
  }

  function updateClockMarkers(localRadius) {
    clockMarkers.reference.position.copy(metricApi.surfacePoint(0, 80, state.mass, 0.06));
    clockMarkers.local.position.copy(metricApi.surfacePoint(0, localRadius, state.mass, 0.06));
  }

  function updateMassPulse(elapsed) {
    const glow = massObject.children[1];
    const target = 1.08 + Math.sin(elapsed * 1.8) * 0.03;
    glow.scale.setScalar(glow.scale.x * 0.985 + target * 0.015);
    massObject.position.copy(metricApi.surfacePoint(0, 0, state.mass, 2.2));
  }

  function syncObjectsToSurface() {
    state.entities.forEach(function (entity) {
      metricApi.constrainToSurface(entity, state.mass);
    });
    massObject.position.copy(metricApi.surfacePoint(0, 0, state.mass, 2.2));
    updateClockMarkers(state.clocks.local.radius);
  }
})();
