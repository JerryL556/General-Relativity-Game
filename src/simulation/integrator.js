(function () {
  function integrateSemiImplicit(entity, dt, accelerationFn) {
    const acceleration = accelerationFn(entity.position, entity.velocity);
    entity.velocity.addScaledVector(acceleration, dt);
    entity.position.addScaledVector(entity.velocity, dt);
  }

  function updateClock(clock, dt, dilationFactor) {
    clock.coordinateTime += dt;
    clock.properTime += dt * dilationFactor;
  }

  window.Relativity = window.Relativity || {};
  window.Relativity.integrator = {
    integrateSemiImplicit,
    updateClock,
  };
})();
