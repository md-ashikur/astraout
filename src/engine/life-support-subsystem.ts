import { OutpostResources, OutpostModule, Astronaut } from './simulation-types';

export function calculateLifeSupport(
  modules: OutpostModule[],
  resources: OutpostResources,
  crew: Astronaut[],
  isBlackout: boolean,
  dt: number // fraction of sol
): {
  newO2Reserve: number;
  newO2Pressure: number;
  newCO2Level: number;
  newWaterReserve: number;
  newCabinPressure: number;
  newInternalTemp: number;
  eclssOperational: boolean;
} {
  const activeCrewCount = crew.filter(c => c.status !== 'incapacitated').length;
  
  // Daily consumption rates (per sol)
  const o2NeededDaily = activeCrewCount * 0.84; // kg/sol
  const co2ProducedDaily = activeCrewCount * 1.0; // kg/sol converted to ~250 ppm rise per crew
  const waterNeededDaily = activeCrewCount * 2.5; // L/sol

  const o2Consumed = o2NeededDaily * dt;
  const waterConsumed = waterNeededDaily * dt;

  // Check ECLSS Module status
  const sabatierModule = modules.find(m => m.id === 'mod-sabatier' && m.isActive);
  const cdraModule = modules.find(m => m.id === 'mod-cdra' && m.isActive);
  const waterRecycleModule = modules.find(m => m.id === 'mod-water-recovery' && m.isActive);

  // If blackout occurs, active life support shuts off
  const hasPower = !isBlackout;

  // Oxygen Generation (Sabatier + Electrolysis)
  let o2Generated = 0;
  if (sabatierModule && hasPower) {
    const efficiency = (sabatierModule.health / 100) * (sabatierModule.level * 0.6);
    o2Generated = 1.2 * efficiency * dt; // kg generated
  }

  let newO2Reserve = resources.o2Reserve - o2Consumed + o2Generated;
  if (newO2Reserve > resources.o2Capacity) newO2Reserve = resources.o2Capacity;
  if (newO2Reserve < 0) newO2Reserve = 0;

  // Partial pressure tracks O2 reserve fraction
  const o2ReserveRatio = newO2Reserve / resources.o2Capacity;
  const newO2Pressure = Math.round(21.0 * Math.min(1.0, o2ReserveRatio * 1.2) * 10) / 10;

  // CO2 Scrubbing (CDRA)
  let co2DeltaPpm = (activeCrewCount * 180) * dt; // CO2 build-up
  if (cdraModule && hasPower) {
    const scrubRate = 350 * (cdraModule.health / 100) * cdraModule.level;
    co2DeltaPpm -= scrubRate * dt;
  }
  let newCO2Level = Math.max(400, Math.round(resources.co2Level + co2DeltaPpm));

  // Water Recycling (ISS Water Recovery System)
  let recyclingEff = 0.65; // Base passive condensation
  if (waterRecycleModule && hasPower) {
    recyclingEff = 0.93 + (waterRecycleModule.level * 0.02) * (waterRecycleModule.health / 100);
    recyclingEff = Math.min(0.98, recyclingEff);
  }
  const waterLost = waterConsumed * (1 - recyclingEff);
  let newWaterReserve = Math.max(0, resources.waterReserve - waterLost);
  if (newWaterReserve > resources.waterCapacity) newWaterReserve = resources.waterCapacity;

  // Thermal management
  let targetTemp = 21.5;
  let tempDelta = 0;
  if (!hasPower) {
    // Habitat rapidly loses heat to space/night
    tempDelta = -2.5 * dt;
  } else {
    // Heating/Cooling radiator actively stabilizes temperature
    tempDelta = (targetTemp - resources.internalTemp) * 0.1;
  }
  const newInternalTemp = Math.round((resources.internalTemp + tempDelta) * 10) / 10;

  // Cabin Pressure
  const newCabinPressure = resources.cabinPressure;

  return {
    newO2Reserve: Math.round(newO2Reserve * 10) / 10,
    newO2Pressure,
    newCO2Level,
    newWaterReserve: Math.round(newWaterReserve * 10) / 10,
    newCabinPressure,
    newInternalTemp,
    eclssOperational: hasPower && !!sabatierModule && !!cdraModule,
  };
}
