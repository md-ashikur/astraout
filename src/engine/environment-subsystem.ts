import { OutpostLocation } from './simulation-types';

export function calculateEnvironment(
  location: OutpostLocation,
  currentSol: number,
  solProgress: number,
  dt: number
): {
  newSol: number;
  newProgress: number;
  isDaytime: boolean;
  surfaceTemp: number;
  sunAngleDegrees: number;
} {
  let newProgress = solProgress + dt;
  let newSol = currentSol;

  if (newProgress >= 1.0) {
    newSol += Math.floor(newProgress);
    newProgress = newProgress % 1.0;
  }

  // Sun angle across the sky (0 to 360 degrees)
  const sunAngleDegrees = Math.round(newProgress * 360);

  let isDaytime = false;
  let surfaceTemp = -50;

  if (location === 'moon') {
    // On the Moon, day and night each last 14 Earth days (modeled in simulation sols)
    // 0.0 to 0.5 is daylight, 0.5 to 1.0 is the frigid 14-day lunar night
    isDaytime = newProgress < 0.5;
    if (isDaytime) {
      // Peaks at +110°C to +120°C
      const sunElevation = Math.sin(Math.PI * (newProgress / 0.5));
      surfaceTemp = Math.round(-30 + sunElevation * 150);
    } else {
      // Plunges to -150°C during the long lunar night
      surfaceTemp = -150;
    }
  } else {
    // Mars: 24h 39m Sol
    // 0.2 to 0.8 is daytime
    isDaytime = newProgress >= 0.2 && newProgress <= 0.8;
    if (isDaytime) {
      const sunElevation = Math.sin(Math.PI * ((newProgress - 0.2) / 0.6));
      surfaceTemp = Math.round(-60 + sunElevation * 75); // reaches up to +15°C
    } else {
      surfaceTemp = -85; // Martian night
    }
  }

  return {
    newSol,
    newProgress: Math.round(newProgress * 1000) / 1000,
    isDaytime,
    surfaceTemp,
    sunAngleDegrees,
  };
}
