(function () {
  const EVENT_HORIZON_SCALE = 0.11;
  const MIN_RADIUS = 1.4;
  const C = 12.0;
  const G = 1.0;

  function schwarzschildRadius(mass) {
    return Math.max(0.6, mass * EVENT_HORIZON_SCALE);
  }

  function radialDistance(position) {
    return Math.max(Math.hypot(position.x, position.z), MIN_RADIUS);
  }

  function safeRadius(position) {
    return radialDistance(position);
  }

  function gravityAcceleration(position, mass) {
    const radius = safeRadius(position);
    const direction = new THREE.Vector3(-position.x, 0, -position.z).normalize();
    const rs = schwarzschildRadius(mass);
    const newtonian = (G * mass) / (radius * radius);
    const relativisticBoost = 1 + (3 * rs) / Math.max(radius, rs * 1.2);
    return direction.multiplyScalar(newtonian * relativisticBoost);
  }

  function photonDeflectionAcceleration(position, velocity, mass) {
    const base = gravityAcceleration(position, mass);
    const tangent = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
    const radial = new THREE.Vector3(position.x, 0, position.z).normalize();
    const side = tangent.clone().cross(radial).cross(tangent).normalize();

    if (!Number.isFinite(side.lengthSq()) || side.lengthSq() === 0) {
      return base.multiplyScalar(0.35);
    }

    return base.multiplyScalar(0.25).add(side.multiplyScalar(base.length() * 1.75));
  }

  function timeDilationFactor(radius, mass) {
    const rs = schwarzschildRadius(mass);
    const ratio = 1 - rs / Math.max(radius, rs * 1.05);
    return Math.sqrt(Math.max(0.08, ratio));
  }

  function warpHeight(x, z, mass) {
    const radius = Math.max(Math.hypot(x, z), 1.2);
    const rs = schwarzschildRadius(mass);
    const radialFalloff = 1 + rs / Math.max(radius * 0.75, 1.2);
    const depression = Math.log1p((mass * 1.9) / Math.max(radius * 0.7, 1.1));
    return -Math.min(20, depression * (1.35 + rs * 0.12) * radialFalloff);
  }

  function surfacePoint(x, z, mass, lift) {
    return new THREE.Vector3(x, warpHeight(x, z, mass) + (lift || 0), z);
  }

  function surfaceNormal(x, z, mass) {
    const delta = 0.45;
    const hx1 = warpHeight(x + delta, z, mass);
    const hx0 = warpHeight(x - delta, z, mass);
    const hz1 = warpHeight(x, z + delta, mass);
    const hz0 = warpHeight(x, z - delta, mass);
    const dx = (hx1 - hx0) / (2 * delta);
    const dz = (hz1 - hz0) / (2 * delta);
    return new THREE.Vector3(-dx, 1, -dz).normalize();
  }

  function constrainToSurface(entity, mass) {
    const lift = entity.type === "photon" ? 0.4 : 0.15;
    entity.position.y = warpHeight(entity.position.x, entity.position.z, mass) + lift;

    if (entity.velocity) {
      const normal = surfaceNormal(entity.position.x, entity.position.z, mass);
      const normalComponent = normal.clone().multiplyScalar(entity.velocity.dot(normal));
      entity.velocity.sub(normalComponent);

      if (entity.type === "photon") {
        normalizeSpeed(entity.velocity);
      }
    }
  }

  function orbitalVelocity(position, mass) {
    const radius = safeRadius(position);
    return Math.sqrt((G * mass) / radius) * 0.55;
  }

  function clampToDomain(entity, mass) {
    const rs = schwarzschildRadius(mass);
    const radius = safeRadius(entity.position);

    if (radius < rs * 1.08 || radius > 160) {
      entity.alive = false;
    }
  }

  function normalizeSpeed(vector, magnitude) {
    return vector.normalize().multiplyScalar(magnitude || C);
  }

  window.Relativity = window.Relativity || {};
  window.Relativity.metric = {
    EVENT_HORIZON_SCALE,
    schwarzschildRadius,
    radialDistance,
    safeRadius,
    gravityAcceleration,
    photonDeflectionAcceleration,
    timeDilationFactor,
    warpHeight,
    surfacePoint,
    surfaceNormal,
    constrainToSurface,
    orbitalVelocity,
    clampToDomain,
    normalizeSpeed,
  };
})();
