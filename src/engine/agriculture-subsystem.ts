import { OutpostResources, OutpostModule, Astronaut } from './simulation-types';

export function calculateAgriculture(
  modules: OutpostModule[],
  resources: OutpostResources,
  crew: Astronaut[],
  isBlackout: boolean,
  dt: number // fraction of sol
): {
  newFoodRations: number;
  newCropProgress: number;
  newCropHealth: number;
  waterConsumedByCrops: number;
  calorieYield: number;
  harvestReady: boolean;
} {
  const activeCrewCount = crew.filter(c => c.status !== 'incapacitated').length;
  // Crew eats rations (12 meals/sol for 4 astronauts = 3 meals each)
  const mealsConsumed = activeCrewCount * 3.0 * dt;
  let currentRations = Math.max(0, resources.foodRations - mealsConsumed);

  // Check greenhouse / hydroponics modules
  const greenhouse = modules.find(m => m.id === 'mod-greenhouse' && m.isActive);
  const algaeReactor = modules.find(m => m.id === 'mod-algae-reactor' && m.isActive);

  let waterNeeded = 0;
  let growthRate = 0;
  let cropHealth = resources.cropHealth;
  let harvestReady = false;
  let calorieYield = 0;

  if (greenhouse) {
    waterNeeded += 4.0 * dt; // L needed for irrigation
    const hasWater = resources.waterReserve >= waterNeeded;
    const hasPower = !isBlackout;

    if (hasWater && hasPower) {
      // Optimal growth conditions
      cropHealth = Math.min(100, cropHealth + 5 * dt);
      growthRate = 18 * (greenhouse.health / 100) * greenhouse.level; // ~100% in 5-6 sols
      calorieYield += 2400; // fresh vegetables and tubers
    } else {
      // Withering due to lack of light or water
      cropHealth = Math.max(0, cropHealth - 15 * dt);
    }
  }

  if (algaeReactor && !isBlackout) {
    waterNeeded += 1.5 * dt;
    growthRate += 8 * (algaeReactor.health / 100);
    calorieYield += 1200; // Spirulina high-protein yield
  }

  let newProgress = resources.cropHarvestProgress + growthRate * dt;
  if (newProgress >= 100 && cropHealth > 20) {
    harvestReady = true;
    newProgress = 0;
    // Each harvest yields 40 fresh ration packs
    currentRations += 40;
  }

  return {
    newFoodRations: Math.round(currentRations * 10) / 10,
    newCropProgress: Math.min(100, Math.round(newProgress * 10) / 10),
    newCropHealth: Math.round(cropHealth),
    waterConsumedByCrops: waterNeeded,
    calorieYield,
    harvestReady,
  };
}
