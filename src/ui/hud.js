(function () {
  const scenarios = window.Relativity.scenarios;

  function createHud() {
    const massRange = document.getElementById("massRange");
    const massValue = document.getElementById("massValue");
    const modeSelect = document.getElementById("modeSelect");
    const objectType = document.getElementById("objectType");
    const objectSpeed = document.getElementById("objectSpeed");
    const speedValue = document.getElementById("speedValue");
    const objectDirection = document.getElementById("objectDirection");
    const directionValue = document.getElementById("directionValue");
    const objectMass = document.getElementById("objectMass");
    const objectMassValue = document.getElementById("objectMassValue");
    const farClockRadius = document.getElementById("farClockRadius");
    const farClockRadiusValue = document.getElementById("farClockRadiusValue");
    const nearClockRadius = document.getElementById("nearClockRadius");
    const nearClockRadiusValue = document.getElementById("nearClockRadiusValue");
    const experimentSummary = document.getElementById("experimentSummary");
    const placementHint = document.getElementById("placementHint");
    const placementValue = document.getElementById("placementValue");
    const farClock = document.getElementById("farClock");
    const nearClock = document.getElementById("nearClock");
    const dilationValue = document.getElementById("dilationValue");
    const trackedSpeed = document.getElementById("trackedSpeed");
    const modeTitle = document.getElementById("modeTitle");
    const modeDescription = document.getElementById("modeDescription");
    const placeObject = document.getElementById("placeObject");
    const launchObject = document.getElementById("launchObject");
    const resetScene = document.getElementById("resetScene");
    const presetButtons = Array.prototype.slice.call(document.querySelectorAll("[data-preset]"));

    function setMassLabel(value) {
      massValue.textContent = String(value);
    }

    function setSpeedLabel(value) {
      speedValue.textContent = Number(value).toFixed(1);
    }

    function setDirectionLabel(value) {
      directionValue.textContent = String(Math.round(Number(value))) + " deg";
    }

    function setObjectMassLabel(value) {
      objectMassValue.textContent = Number(value).toFixed(1);
    }

    function setClockRadiusLabels(far, near) {
      farClockRadiusValue.textContent = String(Math.round(Number(far)));
      nearClockRadiusValue.textContent = String(Math.round(Number(near)));
    }

    function setExperimentSummary(far, near) {
      experimentSummary.textContent =
        "Near clock at r = " + Math.round(Number(near)) +
        ", far clock at r = " + Math.round(Number(far)) + ".";
    }

    function setMode(mode) {
      const content = scenarios.MODE_CONTENT[mode];
      modeTitle.textContent = content.title;
      modeDescription.textContent = content.description;
    }

    function setClockValues(far, near, ratio) {
      farClock.textContent = far.toFixed(2) + " s";
      nearClock.textContent = near.toFixed(2) + " s";
      dilationValue.textContent = ratio.toFixed(3) + "x";
    }

    function setTrackedSpeed(speed, label) {
      if (!label) {
        trackedSpeed.textContent = speed.toFixed(2);
        return;
      }
      trackedSpeed.textContent = speed.toFixed(2) + " " + label;
    }

    setMassLabel(massRange.value);
    setSpeedLabel(objectSpeed.value);
    setDirectionLabel(objectDirection.value);
    setObjectMassLabel(objectMass.value);
    setClockRadiusLabels(farClockRadius.value, nearClockRadius.value);
    setExperimentSummary(farClockRadius.value, nearClockRadius.value);
    setMode(modeSelect.value);

    return {
      getMass: function () { return Number(massRange.value); },
      getMode: function () { return modeSelect.value; },
      getLaunchConfig: function () {
        return {
          type: objectType.value,
          speed: Number(objectSpeed.value),
          headingDeg: Number(objectDirection.value),
          objectMass: Number(objectMass.value),
        };
      },
      getClockRadii: function () {
        return {
          far: Number(farClockRadius.value),
          near: Number(nearClockRadius.value),
        };
      },
      onMassChange: function (handler) {
        massRange.addEventListener("input", function () {
          setMassLabel(massRange.value);
          handler(Number(massRange.value));
        });
      },
      onModeChange: function (handler) {
        modeSelect.addEventListener("change", function () {
          setMode(modeSelect.value);
          handler(modeSelect.value);
        });
      },
      onObjectConfigChange: function (handler) {
        objectType.addEventListener("change", handler);
        objectSpeed.addEventListener("input", function () {
          setSpeedLabel(objectSpeed.value);
          handler();
        });
        objectDirection.addEventListener("input", function () {
          setDirectionLabel(objectDirection.value);
          handler();
        });
        objectMass.addEventListener("input", function () {
          setObjectMassLabel(objectMass.value);
          handler();
        });
      },
      onClockRadiusChange: function (handler) {
        function emit() {
          setClockRadiusLabels(farClockRadius.value, nearClockRadius.value);
          setExperimentSummary(farClockRadius.value, nearClockRadius.value);
          handler({
            far: Number(farClockRadius.value),
            near: Number(nearClockRadius.value),
          });
        }

        farClockRadius.addEventListener("input", emit);
        nearClockRadius.addEventListener("input", emit);
      },
      onPlaceObject: function (handler) {
        placeObject.addEventListener("click", handler);
      },
      onLaunchObject: function (handler) {
        launchObject.addEventListener("click", handler);
      },
      onReset: function (handler) {
        resetScene.addEventListener("click", handler);
      },
      onPreset: function (handler) {
        presetButtons.forEach(function (button) {
          button.addEventListener("click", function () {
            const preset = button.dataset.preset;
            const mass = scenarios.MASS_PRESETS[preset];
            massRange.value = String(mass);
            setMassLabel(mass);
            handler({ preset: preset, mass: mass });
          });
        });
      },
      setPlacementValue: function (x, z) {
        placementValue.textContent = "x: " + x.toFixed(1) + ", z: " + z.toFixed(1);
      },
      setPlacementHint: function (text) {
        placementHint.textContent = text;
      },
      setLaunchHeading: function (headingDeg) {
        objectDirection.value = String(Math.round(headingDeg));
        setDirectionLabel(headingDeg);
      },
      setClockRadii: function (far, near) {
        farClockRadius.value = String(Math.round(far));
        nearClockRadius.value = String(Math.round(near));
        setClockRadiusLabels(far, near);
        setExperimentSummary(far, near);
      },
      setClockValues: setClockValues,
      setTrackedSpeed: setTrackedSpeed,
      setExperimentSummary: setExperimentSummary,
    };
  }

  window.Relativity = window.Relativity || {};
  window.Relativity.hud = { createHud: createHud };
})();
