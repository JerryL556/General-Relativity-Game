(function () {
  function createTrailManager(scene) {
    const trails = new Map();

    return {
      sync: function (entities) {
        const currentKeys = new Set();

        entities.forEach(function (entity) {
          currentKeys.add(entity);
          if (trails.has(entity)) {
            return;
          }

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(new Float32Array(180 * 3), 3),
          );
          geometry.setDrawRange(0, 0);

          const material = new THREE.LineBasicMaterial({
            color: entity.color,
            transparent: true,
            opacity: entity.type === "photon" ? 0.95 : 0.65,
          });

          const line = new THREE.Line(geometry, material);
          scene.add(line);
          trails.set(entity, { line: line, points: [] });
        });

        trails.forEach(function (trail, entity) {
          if (currentKeys.has(entity)) {
            return;
          }

          scene.remove(trail.line);
          trail.line.geometry.dispose();
          trail.line.material.dispose();
          trails.delete(entity);
        });
      },

      update: function (entities) {
        entities.forEach(function (entity) {
          const trail = trails.get(entity);
          if (!trail) {
            return;
          }

          trail.points.push(entity.position.clone());
          if (trail.points.length > 180) {
            trail.points.shift();
          }

          const attribute = trail.line.geometry.attributes.position;
          trail.points.forEach(function (point, index) {
            attribute.setXYZ(index, point.x, point.y, point.z);
          });
          attribute.needsUpdate = true;
          trail.line.geometry.setDrawRange(0, trail.points.length);
        });
      },
    };
  }

  window.Relativity = window.Relativity || {};
  window.Relativity.trails = { createTrailManager };
})();
