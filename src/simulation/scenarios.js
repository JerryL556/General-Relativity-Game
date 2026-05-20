(function () {
  window.Relativity = window.Relativity || {};
  window.Relativity.scenarios = {
    MASS_PRESETS: {
      earth: 36,
      star: 90,
      extreme: 160,
    },
    MODE_CONTENT: {
      orbit: {
        title: "Orbit",
        description:
          "A probe follows curved paths around the mass. Higher mass steepens the gravitational well and bends the orbit more aggressively.",
      },
      light: {
        title: "Light Bending",
        description:
          "A photon travels at fixed speed, but its path curves as spacetime bends around the mass. The orange trail exaggerates the effect for visibility.",
      },
      fall: {
        title: "Free Fall",
        description:
          "Starting with less sideways motion reveals the direct pull inward. Near the mass, spatial curvature and time dilation both become stronger.",
      },
      compare: {
        title: "Two-Clock Experiment",
        description:
          "Hold two clocks at fixed radii and compare their accumulated proper time directly. Bringing the near clock inward slows it immediately, while the far clock serves as the distant control.",
      },
    },
  };
})();
