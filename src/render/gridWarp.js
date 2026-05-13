(function () {
  const metric = window.Relativity.metric;

  function createWarpGrid(mass) {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: 0x4ca0ff,
      transparent: true,
      opacity: 0.34,
    });

    const lineData = [];
    const extent = 54;
    const step = 4;

    for (let x = -extent; x <= extent; x += step) {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      for (let z = -extent; z <= extent; z += step) {
        positions.push(x, metric.warpHeight(x, z, mass), z);
      }
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      group.add(new THREE.Line(geometry, material));
      lineData.push({ axis: "x", fixed: x, geometry: geometry });
    }

    for (let z = -extent; z <= extent; z += step) {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      for (let x = -extent; x <= extent; x += step) {
        positions.push(x, metric.warpHeight(x, z, mass), z);
      }
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      group.add(new THREE.Line(geometry, material));
      lineData.push({ axis: "z", fixed: z, geometry: geometry });
    }

    group.rotation.x = -0.08;
    return { group: group, lineData: lineData, extent: extent, step: step };
  }

  function updateWarpGrid(grid, mass) {
    grid.lineData.forEach(function (line) {
      const position = line.geometry.attributes.position;
      let pointIndex = 0;

      for (let offset = -grid.extent; offset <= grid.extent; offset += grid.step) {
        const x = line.axis === "x" ? line.fixed : offset;
        const z = line.axis === "z" ? line.fixed : offset;
        position.setXYZ(pointIndex, x, metric.warpHeight(x, z, mass), z);
        pointIndex += 1;
      }

      position.needsUpdate = true;
    });
  }

  window.Relativity = window.Relativity || {};
  window.Relativity.gridWarp = {
    createWarpGrid,
    updateWarpGrid,
  };
})();
