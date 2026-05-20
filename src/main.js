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
  entitiesApi.setClockRadii(state, hud.getClockRadii());
  let trackedEntity = null;
  const launchPlacement = { x: 0, z: 26 };

  const grid = gridApi.createWarpGrid(state.mass);
  sceneApp.scene.add(grid.group);

  const massObject = lensingApi.createMassVisualization(state.mass);
  sceneApp.scene.add(massObject);

  const entityMeshes = new Map();
  const trailManager = trailsApi.createTrailManager(sceneApp.scene);
  const clockMarkers = createClockMarkers();
  const placementMarker = createPlacementMarker();
  const raycaster = new THREE.Raycaster();
  const placementPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const pointer = new THREE.Vector2();
  const dragLaunch = {
    active: false,
    pointerId: null,
    start: { x: launchPlacement.x, z: launchPlacement.z },
    current: { x: launchPlacement.x + 8, z: launchPlacement.z },
  };
  sceneApp.scene.add(clockMarkers.far, clockMarkers.near);
  sceneApp.scene.add(placementMarker);
  hud.setPlacementValue(launchPlacement.x, launchPlacement.z);
  hud.setPlacementHint("Right-click and drag on the spacetime grid to place, aim, and launch the next object.");
  hud.setClockValues(0, 0, 1);
  hud.setClockRadii(state.clocks.far.radius, state.clocks.near.radius);
  hud.setExperimentSummary(state.clocks.far.radius, state.clocks.near.radius);
  hud.setTrackedSpeed(0, "");
  syncObjectsToSurface();

  hud.onMassChange(function (mass) {
    entitiesApi.setMass(state, mass);
    gridApi.updateWarpGrid(grid, mass);
    lensingApi.updateMassVisualization(massObject, mass);
    syncObjectsToSurface();
  });

  hud.onModeChange(function (mode) {
    entitiesApi.resetState(state, hud.getMass(), mode);
    entitiesApi.setClockRadii(state, hud.getClockRadii());
    trackedEntity = null;
    clearEntityMeshes();
    resetDisplayState();
    syncObjectsToSurface();
  });

  hud.onClockRadiusChange(function (radii) {
    entitiesApi.setClockRadii(state, radii);
    hud.setClockRadii(state.clocks.far.radius, state.clocks.near.radius);
    syncObjectsToSurface();
  });

  hud.onObjectConfigChange(function () {
    const launchConfig = hud.getLaunchConfig();
    hud.setPlacementHint(
      launchConfig.type === "photon"
        ? "Right-drag on the plane to place and aim a photon. Photon mass stays zero."
        : "Right-drag on the plane to place a probe, then release to launch at the configured speed.",
    );
    syncPlacementMarker();
  });

  hud.onPlaceObject(function () {
    hud.setPlacementHint("Hold right click on the plane, drag to aim, then release to launch.");
  });

  hud.onLaunchObject(function () {
    const config = hud.getLaunchConfig();
    config.position = { x: launchPlacement.x, z: launchPlacement.z };
    trackedEntity = entitiesApi.spawnConfiguredEntity(state, hud.getMode(), config);
    hud.setPlacementHint("Object launched. Right-drag on the plane again to place and aim another one.");
  });

  hud.onReset(function () {
    entitiesApi.resetState(state, hud.getMass(), hud.getMode());
    entitiesApi.setClockRadii(state, hud.getClockRadii());
    trackedEntity = null;
    clearEntityMeshes();
    resetDisplayState();
    syncObjectsToSurface();
  });

  hud.onPreset(function (data) {
    entitiesApi.setMass(state, data.mass);
    gridApi.updateWarpGrid(grid, data.mass);
    lensingApi.updateMassVisualization(massObject, data.mass);
    entitiesApi.resetState(state, data.mass, hud.getMode());
    entitiesApi.setClockRadii(state, hud.getClockRadii());
    trackedEntity = null;
    clearEntityMeshes();
    resetDisplayState();
    syncObjectsToSurface();
  });

  canvas.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  canvas.addEventListener("pointerdown", function (event) {
    if (event.button !== 2) {
      return;
    }

    const placement = pickPlacement(event.clientX, event.clientY);
    if (!placement) {
      return;
    }

    dragLaunch.active = true;
    dragLaunch.pointerId = event.pointerId;
    dragLaunch.start.x = placement.x;
    dragLaunch.start.z = placement.z;
    dragLaunch.current.x = placement.x;
    dragLaunch.current.z = placement.z;
    launchPlacement.x = placement.x;
    launchPlacement.z = placement.z;
    sceneApp.controls.setEnabled(false);
    canvas.setPointerCapture(event.pointerId);
    hud.setPlacementValue(launchPlacement.x, launchPlacement.z);
    hud.setPlacementHint("Release to launch. Drag farther to change the launch direction.");
    syncPlacementMarker();
  });

  canvas.addEventListener("pointermove", function (event) {
    if (!dragLaunch.active || event.pointerId !== dragLaunch.pointerId) {
      return;
    }

    const placement = pickPlacement(event.clientX, event.clientY);
    if (!placement) {
      return;
    }

    dragLaunch.current.x = placement.x;
    dragLaunch.current.z = placement.z;

    const heading = currentDragHeading();
    if (heading !== null) {
      hud.setLaunchHeading(heading);
    }

    syncPlacementMarker();
  });

  canvas.addEventListener("pointerup", function (event) {
    if (!dragLaunch.active || event.pointerId !== dragLaunch.pointerId) {
      return;
    }

    const heading = currentDragHeading();
    if (heading !== null) {
      hud.setLaunchHeading(heading);
    }

    const config = hud.getLaunchConfig();
    config.position = { x: dragLaunch.start.x, z: dragLaunch.start.z };
    trackedEntity = entitiesApi.spawnConfiguredEntity(state, hud.getMode(), config);
    hud.setPlacementHint("Object launched. Right-drag on the plane again to place and aim another one.");
    endDragLaunch(event.pointerId);
  });

  canvas.addEventListener("pointercancel", function (event) {
    if (!dragLaunch.active || event.pointerId !== dragLaunch.pointerId) {
      return;
    }
    hud.setPlacementHint("Launch canceled. Right-drag on the plane to place and aim a new object.");
    endDragLaunch(event.pointerId);
  });

  const clock = new THREE.Clock();
  animate();

  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.033);
    entitiesApi.updateSimulation(state, dt);

    syncEntityMeshes();
    trailManager.sync(state.entities);
    trailManager.update(state.entities);
    updateClockMarkers();
    updateMassPulse(state.elapsed);

    const ratio = state.clocks.near.properTime / Math.max(0.0001, state.clocks.far.properTime);
    hud.setClockValues(
      state.clocks.far.properTime,
      state.clocks.near.properTime,
      ratio,
    );
    updateTrackedSpeed();

    sceneApp.controls.update();
    sceneApp.renderer.render(sceneApp.scene, sceneApp.camera);
  }

  function syncEntityMeshes() {
    const liveEntities = new Set(state.entities);

    state.entities.forEach(function (entity) {
      if (!entityMeshes.has(entity)) {
        const meshRadius = entity.type === "photon"
          ? 0.42
          : Math.min(1.4, 0.45 + (entity.objectMass || 8) * 0.035);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(meshRadius, 18, 18),
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
    const far = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x8cc8ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      }),
    );
    far.rotation.x = -Math.PI / 2;
    far.position.set(0, -0.2, 80);

    const near = new THREE.Mesh(
      geometry.clone(),
      new THREE.MeshBasicMaterial({
        color: 0x7cf7b6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      }),
    );
    near.rotation.x = -Math.PI / 2;
    near.position.set(0, -0.2, 18);

    return { far: far, near: near };
  }

  function createPlacementMarker() {
    const marker = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.6, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
      }),
    );
    ring.rotation.x = -Math.PI / 2;

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    core.position.y = 0.4;

    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0.3, 0),
      6,
      0xffffff,
      1.8,
      0.9,
    );

    marker.add(ring, core, arrow);
    return marker;
  }

  function updateClockMarkers() {
    clockMarkers.far.position.copy(metricApi.surfacePoint(0, state.clocks.far.radius, state.mass, 0.06));
    clockMarkers.near.position.copy(metricApi.surfacePoint(0, state.clocks.near.radius, state.mass, 0.06));
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
    syncPlacementMarker();
    updateClockMarkers();
  }

  function updateTrackedSpeed() {
    if (!trackedEntity || !trackedEntity.alive || state.entities.indexOf(trackedEntity) === -1) {
      trackedEntity = null;
      hud.setTrackedSpeed(0, "");
      return;
    }

    hud.setTrackedSpeed(
      Math.sqrt(
        trackedEntity.velocity.x * trackedEntity.velocity.x +
        trackedEntity.velocity.y * trackedEntity.velocity.y +
        trackedEntity.velocity.z * trackedEntity.velocity.z
      ),
      trackedEntity.type === "photon" ? "(photon)" : "(probe)",
    );
  }

  function syncPlacementMarker() {
    const launchConfig = hud.getLaunchConfig();
    placementMarker.position.copy(metricApi.surfacePoint(launchPlacement.x, launchPlacement.z, state.mass, 0.12));
    placementMarker.children[1].scale.setScalar(
      launchConfig.type === "photon"
        ? 0.85
        : Math.min(1.7, 0.8 + launchConfig.objectMass * 0.045),
    );
    placementMarker.children[1].material.color.setHex(
      launchConfig.type === "photon" ? 0xff9f69 : 0x7cf7b6,
    );
    updatePlacementArrow();
  }

  function pickPlacement(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, sceneApp.camera);

    const hit = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(placementPlane, hit)) {
      return null;
    }

    return {
      x: THREE.MathUtils.clamp(hit.x, -52, 52),
      z: THREE.MathUtils.clamp(hit.z, -52, 52),
    };
  }

  function updatePlacementArrow() {
    const arrow = placementMarker.children[2];
    const from = metricApi.surfacePoint(launchPlacement.x, launchPlacement.z, state.mass, 0.35);
    let to;

    if (dragLaunch.active) {
      to = metricApi.surfacePoint(dragLaunch.current.x, dragLaunch.current.z, state.mass, 0.35);
    } else {
      const launchConfig = hud.getLaunchConfig();
      const heading = THREE.MathUtils.degToRad(launchConfig.headingDeg);
      to = metricApi.surfacePoint(
        launchPlacement.x + Math.cos(heading) * 8,
        launchPlacement.z + Math.sin(heading) * 8,
        state.mass,
        0.35,
      );
    }

    const direction = to.clone().sub(from);
    if (direction.lengthSq() < 0.0001) {
      const fallbackHeading = THREE.MathUtils.degToRad(hud.getLaunchConfig().headingDeg);
      direction.set(Math.cos(fallbackHeading), 0.08, Math.sin(fallbackHeading));
    }

    const length = Math.min(12, Math.max(3, direction.length()));
    arrow.position.set(0, 0.12, 0);
    arrow.setDirection(direction.normalize());
    arrow.setLength(length, 1.8, 0.9);
    arrow.setColor(new THREE.Color(hud.getLaunchConfig().type === "photon" ? 0xff9f69 : 0x7cf7b6));
  }

  function currentDragHeading() {
    const dx = dragLaunch.current.x - dragLaunch.start.x;
    const dz = dragLaunch.current.z - dragLaunch.start.z;
    if (Math.hypot(dx, dz) < 0.35) {
      return null;
    }
    return (THREE.MathUtils.radToDeg(Math.atan2(dz, dx)) + 360) % 360;
  }

  function endDragLaunch(pointerId) {
    dragLaunch.active = false;
    dragLaunch.pointerId = null;
    dragLaunch.start.x = launchPlacement.x;
    dragLaunch.start.z = launchPlacement.z;
    dragLaunch.current.x = launchPlacement.x;
    dragLaunch.current.z = launchPlacement.z;
    sceneApp.controls.setEnabled(true);
    try {
      canvas.releasePointerCapture(pointerId);
    } catch (error) {
      // Ignore release failures when the browser has already dropped the pointer capture.
    }
    syncPlacementMarker();
  }

  function resetDisplayState() {
    hud.setClockValues(0, 0, 1);
    hud.setTrackedSpeed(0, "");
    clock.start();
  }
})();
