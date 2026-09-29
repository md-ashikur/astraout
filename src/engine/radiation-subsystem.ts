import { SpaceHazard, OutpostLocation, Astronaut } from './simulation-types';

export function calculateRadiation(
  shieldingThicknessCm: number,
  stormShelterActive: boolean,
  hazards: SpaceHazard[],
  location: OutpostLocation,
  crew: Astronaut[],
  dt: number // fraction of sol
): {
  ambientRadiation: number;
  internalRadiation: number;
  updatedCrew: Astronaut[];
  attenuationPercent: number;
} {
  // Baseline cosmic ray background (mSv/hr)
  // Moon has 0 atmosphere: ~0.06 mSv/hr
  // Mars has thin CO2 atmosphere: ~0.03 mSv/hr
  let baseAmbient = location === 'moon' ? 0.06 : 0.03;

  // Add solar storm hazard multiplier
  let hazardMultiplier = 1.0;
  for (const hazard of hazards) {
    if (hazard.radiationMultiplier > 1.0) {
      hazardMultiplier *= hazard.radiationMultiplier;
    }
  }

  const currentAmbient = baseAmbient * hazardMultiplier;

  // Sintered regolith attenuation: each 10cm provides ~30% reduction (exponential attenuation)
  // Attenuation formula: I = I_0 * e^(-k * thickness)
  const k = 0.035; // attenuation coefficient for sintered regolith
  let regolithFactor = Math.exp(-k * shieldingThicknessCm);

  // Storm shelter further reduces exposure by 95% for sheltered crew
  if (stormShelterActive) {
    regolithFactor *= 0.08;
  }

  const internalFlux = Math.max(0.001, currentAmbient * regolithFactor);
  const attenuationPercent = Math.min(99, Math.round((1 - internalFlux / currentAmbient) * 100));

  // Dose accumulated over elapsed hours
  const hours = dt * 24.0;
  const doseAccumulated = internalFlux * hours;

  // Update crew health and radiation exposure
  const updatedCrew = crew.map(member => {
    // If astronaut is on EVA repair during a solar flare, exposure is unshielded!
    let memberDose = doseAccumulated;
    if (member.status === 'eva-repair') {
      memberDose = currentAmbient * hours * 0.8; // EVA suit provides modest shielding
    } else if (member.status === 'sheltered' || stormShelterActive) {
      memberDose = doseAccumulated * 0.2;
    }

    const newRadiationDose = Math.round((member.radiationDose + memberDose) * 100) / 100;
    
    // Radiation damage to health if cumulative dose is high
    let healthPenalty = 0;
    if (newRadiationDose > 250) {
      healthPenalty = (newRadiationDose - 250) * 0.05 * dt;
    }
    const newHealth = Math.max(0, Math.min(100, member.health - healthPenalty));

    // Update status if incapacitated
    const newStatus = newHealth <= 0 ? 'incapacitated' : member.status;

    return {
      ...member,
      radiationDose: newRadiationDose,
      health: Math.round(newHealth * 10) / 10,
      status: newStatus,
    };
  });

  return {
    ambientRadiation: Math.round(currentAmbient * 1000) / 1000,
    internalRadiation: Math.round(internalFlux * 1000) / 1000,
    updatedCrew,
    attenuationPercent,
  };
}
