import { OutpostResources, OutpostModule, SpaceHazard, OutpostLocation } from './simulation-types';

export function calculatePowerGrid(
  modules: OutpostModule[],
  resources: OutpostResources,
  isDaytime: boolean,
  solProgress: number,
  hazards: SpaceHazard[],
  location: OutpostLocation,
  dt: number // fraction of a sol, e.g. 0.05
): {
  generation: number;
  demand: number;
  batteryDelta: number;
  newBatteryStored: number;
  isBlackout: boolean;
} {
  // Environmental solar flux multiplier
  let solarMultiplier = 1.0;
  for (const hazard of hazards) {
    solarMultiplier *= hazard.solarPowerMultiplier;
  }

  // Day/Night solar curve (Sine wave during daytime, 0 during night)
  let solarFactor = 0;
  if (isDaytime) {
    // Peak at mid-day (progress ~0.5 of daytime)
    solarFactor = Math.sin(Math.PI * (solProgress % 0.5) / 0.5) * solarMultiplier;
    // Base efficiency on Moon is slightly higher (1361 W/m2) than Mars (590 W/m2 average)
    if (location === 'mars') {
      solarFactor *= 0.65;
    }
  }

  let totalGeneration = 0;
  let totalDemand = 0;

  for (const mod of modules) {
    if (!mod.isActive) continue;

    // Power generating modules (negative powerConsumption indicates generation)
    if (mod.powerConsumption < 0) {
      const baseOutput = Math.abs(mod.powerConsumption) * (mod.health / 100);
      if (mod.id.includes('solar') || mod.id.includes('array')) {
        totalGeneration += baseOutput * Math.max(solarFactor, 0.05); // minimum trickle at night
      } else if (
        mod.id.includes('kilopower') ||
        mod.id.includes('nuclear') ||
        mod.id.includes('fission') ||
        mod.id.includes('rtg')
      ) {
        // Fission/RTG: unaffected by solar conditions
        totalGeneration += baseOutput;
      } else {
        totalGeneration += baseOutput;
      }
    } else {
      // Consuming module
      totalDemand += mod.powerConsumption;
    }
  }

  // Base habitat life-support baseline load
  totalDemand += 2.0;

  const netPowerKw = totalGeneration - totalDemand;
  // Convert kW over fraction of sol to kWh (1 Sol = 24.6 hrs)
  const hoursElapsed = dt * 24.0;
  const energyKwhDelta = netPowerKw * hoursElapsed;

  let newBattery = resources.batteryStored + energyKwhDelta;
  let isBlackout = false;

  if (newBattery > resources.batteryCapacity) {
    newBattery = resources.batteryCapacity;
  } else if (newBattery <= 0) {
    newBattery = 0;
    isBlackout = totalGeneration < totalDemand;
  }

  return {
    generation: Math.round(totalGeneration * 10) / 10,
    demand: Math.round(totalDemand * 10) / 10,
    batteryDelta: energyKwhDelta,
    newBatteryStored: Math.round(newBattery * 10) / 10,
    isBlackout,
  };
}
