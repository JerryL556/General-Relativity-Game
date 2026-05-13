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
        title: "Time Dilation",
        description:
          "The near-mass clock accumulates proper time more slowly than a distant reference clock. Mass changes the rate immediately.",
      },
    },
  };
})();
