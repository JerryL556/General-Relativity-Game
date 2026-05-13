(function () {
  const metric = window.Relativity.metric;

  function createMassVisualization(mass) {
    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(3.6, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0xffca67,
        emissive: 0xff8b3d,
        emissiveIntensity: 1.5,
        roughness: 0.22,
        metalness: 0.18,
      }),
    );

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(5.2, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffbb75,
        transparent: true,
        opacity: 0.16,
      }),
    );

    const horizon = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.12, 18, 80),
      new THREE.MeshBasicMaterial({
        color: 0xfff0c6,
        transparent: true,
        opacity: 0.42,
      }),
    );

    horizon.rotation.x = Math.PI / 2;
    group.add(core, glow, horizon);
    updateMassVisualization(group, mass);
    return group;
  }

  function updateMassVisualization(group, mass) {
    const core = group.children[0];
    const glow = group.children[1];
    const horizon = group.children[2];
    const baseScale = 0.7 + mass / 90;
    const rs = metric.schwarzschildRadius(mass);

    core.scale.setScalar(baseScale);
    glow.scale.setScalar(1.05 + mass / 72);
    horizon.scale.setScalar(Math.max(3.2, rs * 1.18));
  }

  window.Relativity = window.Relativity || {};
  window.Relativity.lensing = {
    createMassVisualization,
    updateMassVisualization,
  };
})();
