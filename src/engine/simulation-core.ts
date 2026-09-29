import { OutpostState, OutpostLocation, SimulationSpeed, Astronaut } from './simulation-types';
import { calculateEnvironment } from './environment-subsystem';
import { calculatePowerGrid } from './power-subsystem';
import { calculateLifeSupport } from './life-support-subsystem';
import { calculateRadiation } from './radiation-subsystem';
import { calculateAgriculture } from './agriculture-subsystem';
import { processHazards } from './event-subsystem';
import { getInitialScenario } from './default-scenarios';

/**
 * Pure monolithic simulation tick function.
 * Called deterministically every simulation cycle.
 * @param state Current state
 * @param deltaSeconds Real-world elapsed seconds (typically 0.5s - 1.0s)
 */
export function tickSimulation(state: OutpostState, deltaSeconds: number): OutpostState {
  if (state.isPaused || state.speed === 0 || state.gameOver) {
    return state;
  }

  // Time conversion: 1 real second at 1x speed = ~0.008 Sol (~12 minutes of Sol time)
  // At 10x speed, 1 real second = ~0.08 Sol (~2 hours)
  const dt = (deltaSeconds * 0.008 * state.speed);

  // 1. Planetary Environment
  const env = calculateEnvironment(
    state.location,
    state.currentSol,
    state.solProgress,
    dt
  );

  // 2. Space Hazards & Dynamic Events
  const hazardResult = processHazards(
    state.activeHazards,
    state.modules,
    env.newSol,
    state.location,
    dt
  );

  // 3. Power Grid & Energy Storage
  const power = calculatePowerGrid(
    hazardResult.updatedModules,
    state.resources,
    env.isDaytime,
    env.newProgress,
    hazardResult.updatedHazards,
    state.location,
    dt
  );

  // 4. Life Support (ECLSS)
  const lifeSupport = calculateLifeSupport(
    hazardResult.updatedModules,
    state.resources,
    state.crew,
    power.isBlackout,
    dt
  );

  // 5. Bio-regenerative Agriculture & Food
  const agriculture = calculateAgriculture(
    hazardResult.updatedModules,
    state.resources,
    state.crew,
    power.isBlackout,
    dt
  );

  // 6. Radiation & Shielding Attenuation
  const radiation = calculateRadiation(
    state.resources.shieldingThicknessCm,
    state.resources.stormShelterActive,
    hazardResult.updatedHazards,
    state.location,
    state.crew,
    dt
  );

  // 7. Regolith Mining & Sintering
  const sinterBot = hazardResult.updatedModules.find(m => m.id === 'mod-regolith-sinterer' && m.isActive);
  let newRegolithStored = state.resources.regolithStored;
  let newShieldingThickness = state.resources.shieldingThicknessCm;

  if (sinterBot && !power.isBlackout) {
    // Dig and sinter regolith
    const mined = state.resources.isruProductionRate * dt;
    newRegolithStored = Math.round((newRegolithStored + mined) * 10) / 10;
  }

  // 8. Crew Status & Morale Updates
  const updatedCrew: Astronaut[] = radiation.updatedCrew.map(member => {
    let fatigueDelta = 0;
    let moraleDelta = 0;

    if (member.status === 'resting') {
      fatigueDelta = -15 * dt;
      moraleDelta = 5 * dt;
    } else if (member.status === 'eva-repair') {
      fatigueDelta = 20 * dt;
      moraleDelta = -4 * dt;
    } else {
      fatigueDelta = 3 * dt;
    }

    // High CO2 penalty
    if (lifeSupport.newCO2Level > 2000) {
      fatigueDelta += 10 * dt;
      moraleDelta -= 8 * dt;
    }

    // Low food penalty
    if (agriculture.newFoodRations < 10) {
      moraleDelta -= 15 * dt;
    }

    // Blackout panic penalty
    if (power.isBlackout) {
      moraleDelta -= 12 * dt;
    }

    const newFatigue = Math.max(0, Math.min(100, member.fatigue + fatigueDelta));
    const newMorale = Math.max(0, Math.min(100, member.morale + moraleDelta));

    return {
      ...member,
      fatigue: Math.round(newFatigue * 10) / 10,
      morale: Math.round(newMorale * 10) / 10,
    };
  });

  // 9. Objectives Progress & Checks
  const updatedObjectives = state.objectives.map(obj => {
    let currentVal = obj.currentValue;
    if (obj.id === 'obj-survive-30') currentVal = env.newSol;
    if (obj.id === 'obj-sinter-shield') currentVal = Math.round(newShieldingThickness);
    if (obj.id === 'obj-first-harvest' && agriculture.harvestReady) currentVal = 100;
    if (obj.id === 'obj-clean-air') currentVal = lifeSupport.newCO2Level;

    const completed = obj.id === 'obj-clean-air'
      ? currentVal < obj.targetValue && env.newSol > 5
      : currentVal >= obj.targetValue;

    return {
      ...obj,
      currentValue: currentVal,
      completed,
    };
  });

  // Calculate Sustainability Score (0-100)
  let score = 100;
  if (power.isBlackout) score -= 25;
  if (lifeSupport.newO2Pressure < 18.0) score -= 20;
  if (lifeSupport.newCO2Level > 1800) score -= 20;
  if (agriculture.newFoodRations < 20) score -= 15;
  if (radiation.internalRadiation > 0.05) score -= 15;
  const avgMorale = updatedCrew.reduce((acc, c) => acc + c.morale, 0) / updatedCrew.length;
  score = Math.max(0, Math.min(100, Math.round(score * 0.7 + avgMorale * 0.3)));

  // Victory / Defeat Evaluation
  let gameOver = false;
  let gameWon = false;
  let endCause = undefined;

  // Defeat Conditions
  if (lifeSupport.newO2Reserve <= 0) {
    gameOver = true;
    endCause = 'CRITICAL FAILURE: Atmospheric oxygen depleted. Life support collapsed.';
  } else if (lifeSupport.newCO2Level >= 4500) {
    gameOver = true;
    endCause = 'CRITICAL FAILURE: Toxic hypercapnia. Carbon dioxide scrubbers were overwhelmed.';
  } else if (updatedCrew.every(c => c.status === 'incapacitated')) {
    gameOver = true;
    endCause = 'CRITICAL FAILURE: Entire crew incapacitated by radiation and environmental stress.';
  }

  // Victory Condition: Reached Sol 30 with surviving crew
  if (!gameOver && env.newSol >= 30) {
    gameOver = true;
    gameWon = true;
    endCause = 'MISSION SUCCESS: Outpost achieved 30-Sol sustainable equilibrium! Outstanding leadership, Commander.';
  }

  // Harvest notification log
  const harvestLogs = agriculture.harvestReady
    ? [{
        id: `harvest-${Date.now()}`,
        sol: env.newSol,
        timeString: `SOL ${env.newSol.toString().padStart(3, '0')}`,
        message: 'HARVEST COMPLETE: Hydroponic greenhouse produced 40 fresh ration packs! Crew morale boosted.',
        type: 'success' as const,
      }]
    : [];

  const combinedLogs = [...harvestLogs, ...hazardResult.newLogs, ...state.logs].slice(0, 30);

  return {
    ...state,
    currentSol: env.newSol,
    solProgress: env.newProgress,
    isDaytime: env.isDaytime,
    gameOver,
    gameWon,
    endCause,
    resources: {
      powerGeneration: power.generation,
      powerDemand: power.demand,
      batteryStored: power.newBatteryStored,
      batteryCapacity: state.resources.batteryCapacity,
      o2Reserve: lifeSupport.newO2Reserve,
      o2Capacity: state.resources.o2Capacity,
      o2PartialPressure: lifeSupport.newO2Pressure,
      co2Level: lifeSupport.newCO2Level,
      waterReserve: lifeSupport.newWaterReserve,
      waterCapacity: state.resources.waterCapacity,
      waterRecyclingEfficiency: state.resources.waterRecyclingEfficiency,
      cabinPressure: lifeSupport.newCabinPressure,
      internalTemp: lifeSupport.newInternalTemp,
      ambientRadiation: radiation.ambientRadiation,
      internalRadiation: radiation.internalRadiation,
      cumulativeRadiation: Math.round((state.resources.cumulativeRadiation + radiation.internalRadiation * dt * 24) * 100) / 100,
      shieldingThicknessCm: newShieldingThickness,
      stormShelterActive: state.resources.stormShelterActive,
      foodRations: agriculture.newFoodRations,
      cropHarvestProgress: agriculture.newCropProgress,
      cropHealth: agriculture.newCropHealth,
      dailyCalorieOutput: agriculture.calorieYield,
      regolithStored: newRegolithStored,
      isruProductionRate: state.resources.isruProductionRate,
    },
    modules: hazardResult.updatedModules,
    crew: updatedCrew,
    activeHazards: hazardResult.updatedHazards,
    logs: combinedLogs,
    objectives: updatedObjectives,
    sustainabilityScore: score,
  };
}

export function resetScenario(location: OutpostLocation): OutpostState {
  return getInitialScenario(location);
}
