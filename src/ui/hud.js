(function () {
  const scenarios = window.Relativity.scenarios;

  function createHud() {
    const massRange = document.getElementById("massRange");
    const massValue = document.getElementById("massValue");
    const modeSelect = document.getElementById("modeSelect");
    const referenceClock = document.getElementById("referenceClock");
    const localClock = document.getElementById("localClock");
    const dilationValue = document.getElementById("dilationValue");
    const modeTitle = document.getElementById("modeTitle");
    const modeDescription = document.getElementById("modeDescription");
    const launchProbe = document.getElementById("launchProbe");
    const launchPhoton = document.getElementById("launchPhoton");
    const resetScene = document.getElementById("resetScene");
    const presetButtons = Array.prototype.slice.call(document.querySelectorAll("[data-preset]"));

    function setMassLabel(value) {
      massValue.textContent = String(value);
    }

    function setMode(mode) {
      const content = scenarios.MODE_CONTENT[mode];
      modeTitle.textContent = content.title;
      modeDescription.textContent = content.description;
    }

    function setClockValues(reference, local, ratio) {
      referenceClock.textContent = reference.toFixed(2) + " s";
      localClock.textContent = local.toFixed(2) + " s";
      dilationValue.textContent = ratio.toFixed(3) + "x";
    }

    setMassLabel(massRange.value);
    setMode(modeSelect.value);

    return {
      getMass: function () { return Number(massRange.value); },
      getMode: function () { return modeSelect.value; },
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
      onLaunchProbe: function (handler) {
        launchProbe.addEventListener("click", handler);
      },
      onLaunchPhoton: function (handler) {
        launchPhoton.addEventListener("click", handler);
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
      setClockValues: setClockValues,
    };
  }

  window.Relativity = window.Relativity || {};
  window.Relativity.hud = { createHud };
})();
