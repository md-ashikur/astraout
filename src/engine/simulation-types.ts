export type OutpostLocation = 'moon' | 'mars';

export type SimulationSpeed = 0 | 1 | 2 | 5 | 10;

export type ModuleCategory = 'power' | 'life-support' | 'agriculture' | 'shielding' | 'habitat' | 'isru';

export interface OutpostModule {
  id: string;
  name: string;
  category: ModuleCategory;
  level: number;
  maxLevel: number;
  powerConsumption: number; // in kW (positive consumes, negative generates)
  waterConsumption: number; // in L/day
  isActive: boolean;
  health: number; // 0 - 100%
  description: string;
  techFact: string; // Real NASA STEM educational fact
  buildCost: {
    regolith: number;
    power: number;
  };
  gridPosition: { x: number; y: number };
}

export interface Astronaut {
  id: string;
  name: string;
  role: 'Commander' | 'Systems Engineer' | 'Astrobiologist' | 'Flight Surgeon';
  avatar: string;
  health: number; // 0 - 100%
  morale: number; // 0 - 100%
  fatigue: number; // 0 - 100%
  radiationDose: number; // mSv (millisieverts)
  status: 'active' | 'resting' | 'eva-repair' | 'sheltered' | 'incapacitated';
  specialtySkill: string;
}

export type HazardSeverity = 'low' | 'moderate' | 'severe' | 'catastrophic';

export interface SpaceHazard {
  id: string;
  title: string;
  description: string;
  severity: HazardSeverity;
  type: 'solar-flare' | 'dust-storm' | 'micrometeoroid' | 'system-fault' | 'cooling-leak';
  durationRemainingSols: number;
  radiationMultiplier: number;
  solarPowerMultiplier: number;
  damagePerTick: number;
  nasaRemedy: string;
}

export interface MissionLogEntry {
  id: string;
  sol: number;
  timeString: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
}

export interface OutpostResources {
  // Power
  powerGeneration: number; // kW
  powerDemand: number; // kW
  batteryStored: number; // kWh
  batteryCapacity: number; // kWh
  
  // Life Support (O2, CO2, H2O, Pressure)
  o2Reserve: number; // kg
  o2Capacity: number; // kg
  o2PartialPressure: number; // kPa (target 21.0)
  co2Level: number; // ppm (safe < 1000, dangerous > 2500)
  waterReserve: number; // Liters
  waterCapacity: number; // Liters
  waterRecyclingEfficiency: number; // % (ISS reaches ~98%)
  cabinPressure: number; // kPa (nominal 101.3)
  internalTemp: number; // Celsius (nominal 21.5°C)

  // Radiation
  ambientRadiation: number; // mSv/hr
  internalRadiation: number; // mSv/hr after shielding
  cumulativeRadiation: number; // mSv total
  shieldingThicknessCm: number; // cm of sintered regolith
  stormShelterActive: boolean;

  // Food & Agriculture
  foodRations: number; // meals
  cropHarvestProgress: number; // 0 - 100%
  cropHealth: number; // 0 - 100%
  dailyCalorieOutput: number; // kcal

  // Construction & ISRU
  regolithStored: number; // tons
  isruProductionRate: number; // tons/day
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  completed: boolean;
  nasaContext: string;
}

export interface OutpostState {
  missionId: string;
  location: OutpostLocation;
  outpostName: string;
  currentSol: number; // Martian Sol or Lunar Day
  solProgress: number; // 0.0 to 1.0 (day/night progression)
  isDaytime: boolean;
  speed: SimulationSpeed;
  isPaused: boolean;
  gameOver: boolean;
  gameWon: boolean;
  endCause?: string;
  
  resources: OutpostResources;
  modules: OutpostModule[];
  crew: Astronaut[];
  activeHazards: SpaceHazard[];
  logs: MissionLogEntry[];
  objectives: MissionObjective[];
  
  // High-level student metrics (0-100 score)
  sustainabilityScore: number;
  sciencePoints: number;
}
