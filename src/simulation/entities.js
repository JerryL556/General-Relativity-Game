(function () {
  const metric = window.Relativity.metric;
  const integrator = window.Relativity.integrator;

  function createSimulationState(mass) {
    return {
      mass,
      entities: [],
      clocks: createClocks(),
      elapsed: 0,
    };
  }

  function createProbe(mode, mass, config) {
    if (config) {
      const position = new THREE.Vector3(config.position.x, 0, config.position.z);
      const heading = THREE.MathUtils.degToRad(config.headingDeg);
      const probe = {
        type: "probe",
        label: "Probe",
        position: position,
        velocity: new THREE.Vector3(
          Math.cos(heading) * config.speed,
          0,
          Math.sin(heading) * config.speed,
        ),
        objectMass: config.objectMass,
        color: 0x7cf7b6,
        alive: true,
      };
      metric.constrainToSurface(probe, mass);
      return probe;
    }

    if (mode === "fall") {
      const probe = {
        type: "probe",
        label: "Probe",
        position: new THREE.Vector3(28, 0, 0),
        velocity: new THREE.Vector3(0, 0, -1.6),
        objectMass: 8,
        color: 0x7cf7b6,
        alive: true,
      };
      metric.constrainToSurface(probe, mass);
      return probe;
    }

    const position = new THREE.Vector3(0, 0, 26);
    const speed = metric.orbitalVelocity(position, mass);
    const probe = {
      type: "probe",
      label: "Probe",
      position: position,
      velocity: new THREE.Vector3(speed, 0, 0),
      objectMass: 8,
      color: 0x7cf7b6,
      alive: true,
    };
    metric.constrainToSurface(probe, mass);
    return probe;
  }

  function createPhoton(config, mass) {
    if (config) {
      const heading = THREE.MathUtils.degToRad(config.headingDeg);
      const photon = {
        type: "photon",
        label: "Photon",
        position: new THREE.Vector3(config.position.x, 0, config.position.z),
        velocity: metric.normalizeSpeed(new THREE.Vector3(
          Math.cos(heading),
          0,
          Math.sin(heading),
        ), config.speed),
        objectMass: 0,
        color: 0xff9f69,
        alive: true,
      };
      metric.constrainToSurface(photon, mass);
      return photon;
    }

    const photon = {
      type: "photon",
      label: "Photon",
      position: new THREE.Vector3(-75, 0, 24),
      velocity: metric.normalizeSpeed(new THREE.Vector3(1, 0, -0.08)),
      objectMass: 0,
      color: 0xff9f69,
      alive: true,
    };
    metric.constrainToSurface(photon, mass);
    return photon;
  }

  function createClocks() {
    return {
      reference: {
        coordinateTime: 0,
        properTime: 0,
        radius: 80,
      },
      local: {
        coordinateTime: 0,
        properTime: 0,
        radius: 18,
      },
    };
  }

  function resetState(state, mass, mode) {
    state.mass = mass;
    state.entities = [];
    state.clocks = createClocks();
    state.elapsed = 0;
  }

  function spawnProbe(state, mode) {
    state.entities.push(createProbe(mode, state.mass));
  }

  function spawnPhoton(state) {
    state.entities.push(createPhoton(null, state.mass));
  }

  function spawnConfiguredEntity(state, mode, config) {
    if (config.type === "photon") {
      const photon = createPhoton(config, state.mass);
      state.entities.push(photon);
      return photon;
    }

    const probe = createProbe(mode, state.mass, config);
    state.entities.push(probe);
    return probe;
  }

  function setMass(state, mass) {
    state.mass = mass;
  }

  function currentLocalClockRadius(state) {
    const probe = state.entities.find(function (entity) {
      return entity.type === "probe";
    });

    if (!probe) {
      return state.clocks.local.radius;
    }

    return Math.max(6, metric.safeRadius(probe.position));
  }

  function updateSimulation(state, dt) {
    state.elapsed += dt;

    state.entities.forEach(function (entity) {
      if (!entity.alive) {
        return;
      }

      if (entity.type === "photon") {
        integrator.integrateSemiImplicit(entity, dt, function (position, velocity) {
          return metric.photonDeflectionAcceleration(position, velocity, state.mass);
        });
        entity.velocity.copy(metric.normalizeSpeed(entity.velocity.clone()));
      } else {
        integrator.integrateSemiImplicit(entity, dt, function (position) {
          return metric.gravityAcceleration(position, state.mass);
        });
      }

      metric.constrainToSurface(entity, state.mass);
      metric.clampToDomain(entity, state.mass);
    });

    state.entities = state.entities.filter(function (entity) {
      return entity.alive;
    });

    const localRadius = currentLocalClockRadius(state);
    const localDilation = metric.timeDilationFactor(localRadius, state.mass);
    const referenceDilation = metric.timeDilationFactor(state.clocks.reference.radius, state.mass);

    integrator.updateClock(state.clocks.reference, dt, referenceDilation);
    integrator.updateClock(state.clocks.local, dt, localDilation);

    return {
      localRadius: localRadius,
      localDilation: localDilation,
      referenceDilation: referenceDilation,
    };
  }

  window.Relativity = window.Relativity || {};
  window.Relativity.entities = {
    createSimulationState,
    resetState,
    spawnProbe,
    spawnPhoton,
    spawnConfiguredEntity,
    setMass,
    updateSimulation,
  };
})();
