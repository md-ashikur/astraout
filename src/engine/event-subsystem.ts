import { SpaceHazard, OutpostLocation, OutpostModule, MissionLogEntry } from './simulation-types';

export function processHazards(
  activeHazards: SpaceHazard[],
  modules: OutpostModule[],
  currentSol: number,
  location: OutpostLocation,
  dt: number
): {
  updatedHazards: SpaceHazard[];
  updatedModules: OutpostModule[];
  newLogs: MissionLogEntry[];
} {
  const newLogs: MissionLogEntry[] = [];
  const updatedHazards: SpaceHazard[] = [];
  let updatedModules = [...modules];

  // Process existing hazards
  for (const hazard of activeHazards) {
    const remaining = hazard.durationRemainingSols - dt;
    if (remaining > 0) {
      updatedHazards.push({
        ...hazard,
        durationRemainingSols: Math.round(remaining * 100) / 100,
      });

      // Apply module degradation if hazard inflicts damage
      if (hazard.damagePerTick > 0) {
        updatedModules = updatedModules.map(mod => {
          if (mod.id.includes('solar') && hazard.type === 'micrometeoroid') {
            return { ...mod, health: Math.max(10, mod.health - hazard.damagePerTick * dt) };
          }
          return mod;
        });
      }
    } else {
      newLogs.push({
        id: `log-end-${Date.now()}-${Math.random()}`,
        sol: currentSol,
        timeString: `SOL ${currentSol.toString().padStart(3, '0')}`,
        message: `HAZARD RESOLVED: ${hazard.title} conditions have normalized.`,
        type: 'success',
      });
    }
  }

  // Periodic random event roll (roughly once every 6 - 10 sols)
  const eventChance = 0.015 * dt * 10;
  if (updatedHazards.length === 0 && Math.random() < eventChance) {
    const possibleEvents = getPossibleEvents(location);
    const chosenEvent = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
    updatedHazards.push(chosenEvent);
    
    newLogs.push({
      id: `log-start-${Date.now()}-${Math.random()}`,
      sol: currentSol,
      timeString: `SOL ${currentSol.toString().padStart(3, '0')}`,
      message: `ALERT: ${chosenEvent.title}! ${chosenEvent.description}`,
      type: chosenEvent.severity === 'catastrophic' || chosenEvent.severity === 'severe' ? 'critical' : 'warning',
    });
  }

  return {
    updatedHazards,
    updatedModules,
    newLogs,
  };
}

function getPossibleEvents(location: OutpostLocation): SpaceHazard[] {
  const commonEvents: SpaceHazard[] = [
    {
      id: `hazard-cme-${Date.now()}`,
      title: 'Solar Particle Event (CME)',
      description: 'Coronal Mass Ejection detected by SOHO satellite! High radiation flux arriving.',
      severity: 'severe',
      type: 'solar-flare',
      durationRemainingSols: 1.5,
      radiationMultiplier: 35.0,
      solarPowerMultiplier: 1.1,
      damagePerTick: 0,
      nasaRemedy: 'Sound siren! Order crew to retreat to the thick Deep Storm Shelter immediately. Cease all EVAs.',
    },
    {
      id: `hazard-micrometeoroid-${Date.now()}`,
      title: 'Micrometeoroid Shower',
      description: 'High-velocity cosmic dust particles impacting the outpost surface perimeter.',
      severity: 'moderate',
      type: 'micrometeoroid',
      durationRemainingSols: 0.8,
      radiationMultiplier: 1.0,
      solarPowerMultiplier: 0.85,
      damagePerTick: 15.0,
      nasaRemedy: 'Deploy regolith shielding to absorb hypervelocity impacts and schedule an EVA patch repair.',
    },
    {
      id: `hazard-eclss-clog-${Date.now()}`,
      title: 'ECLSS Sabatier Condenser Anomaly',
      description: 'Moisture buildup in the catalytic oxygen reduction tube has caused a flow restriction.',
      severity: 'moderate',
      type: 'system-fault',
      durationRemainingSols: 1.2,
      radiationMultiplier: 1.0,
      solarPowerMultiplier: 1.0,
      damagePerTick: 0,
      nasaRemedy: 'Assign Systems Engineer to run diagnostic purge and bypass the faulty valve.',
    },
  ];

  if (location === 'mars') {
    commonEvents.push({
      id: `hazard-dust-storm-${Date.now()}`,
      title: 'Global Martian Dust Storm',
      description: 'Towering atmospheric dust storm blotted out the Sun across Jezero crater.',
      severity: 'severe',
      type: 'dust-storm',
      durationRemainingSols: 3.5,
      radiationMultiplier: 0.9, // dust slightly shields cosmic rays
      solarPowerMultiplier: 0.15, // drops solar power by 85%!
      damagePerTick: 0,
      nasaRemedy: 'Load shed non-essential modules (turn off greenhouse lights) and conserve battery reserves.',
    });
  }

  return commonEvents;
}
