import type { SolunarData, MoonData, SunTimes } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const J2000 = 2451545.0; // Julian date of J2000.0 epoch
const SYNODIC_MONTH = 29.53058770576; // average synodic month in days

// Known new moon reference: 2000-01-06 18:14 UTC
const NEW_MOON_REF_JD = 2451550.2597;

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate solunar data for fishing: major/minor periods, moon transit times.
 *
 * Major periods (~2 hours) are centered on moon overhead (upper transit) and
 * moon underfoot (lower transit). Minor periods (~1 hour) are centered on
 * moonrise and moonset.
 */
export function getSolunarData(date: Date, lat: number, lon: number): SolunarData {
  const moonTimes = getMoonTimes(date, lat, lon);
  const phase = getMoonPhase(date);

  const majorDuration = 60; // minutes each side of center
  const minorDuration = 30; // minutes each side of center

  const makePeriod = (center: Date, halfMin: number) => ({
    start: new Date(center.getTime() - halfMin * 60000),
    end: new Date(center.getTime() + halfMin * 60000),
  });

  const majorPeriods = [
    makePeriod(moonTimes.overhead, majorDuration),
    makePeriod(moonTimes.underfoot, majorDuration),
  ];

  const minorPeriods = [
    makePeriod(moonTimes.rise, minorDuration),
    makePeriod(moonTimes.set, minorDuration),
  ];

  return {
    majorPeriods,
    minorPeriods,
    moonPhase: phase.phase,
    moonPhasePct: phase.illumination,
    moonrise: moonTimes.rise,
    moonset: moonTimes.set,
    moonOverhead: moonTimes.overhead,
    moonUnderfoot: moonTimes.underfoot,
  };
}

/**
 * Calculate the moon phase for a given date using the synodic month.
 */
export function getMoonPhase(date: Date): MoonData {
  const jd = dateToJD(date);
  const daysSinceNew = jd - NEW_MOON_REF_JD;
  const cycles = daysSinceNew / SYNODIC_MONTH;
  const phaseFrac = cycles - Math.floor(cycles); // 0-1, 0 = new moon

  // Illumination: approximate using cosine
  const illumination = Math.round((1 - Math.cos(phaseFrac * 2 * Math.PI)) / 2 * 100);

  let phase: string;
  let emoji: string;

  if (phaseFrac < 0.0625) {
    phase = 'new';
    emoji = '🌑';
  } else if (phaseFrac < 0.1875) {
    phase = 'waxing_crescent';
    emoji = '🌒';
  } else if (phaseFrac < 0.3125) {
    phase = 'first_quarter';
    emoji = '🌓';
  } else if (phaseFrac < 0.4375) {
    phase = 'waxing_gibbous';
    emoji = '🌔';
  } else if (phaseFrac < 0.5625) {
    phase = 'full';
    emoji = '🌕';
  } else if (phaseFrac < 0.6875) {
    phase = 'waning_gibbous';
    emoji = '🌖';
  } else if (phaseFrac < 0.8125) {
    phase = 'last_quarter';
    emoji = '🌗';
  } else if (phaseFrac < 0.9375) {
    phase = 'waning_crescent';
    emoji = '🌘';
  } else {
    phase = 'new';
    emoji = '🌑';
  }

  return { phase, illumination, emoji };
}

/**
 * Calculate sunrise, sunset, civil dawn/dusk, and golden hour times.
 *
 * Uses the standard solar position algorithm based on Jean Meeus'
 * "Astronomical Algorithms".
 */
export function getSunTimes(
  date: Date,
  lat: number,
  lon: number,
): SunTimes {
  const jd = dateToJD(date);
  const n = jd - J2000 + 0.5; // days since J2000, adjusted to noon
  const Jstar = n - lon / 360;

  // Solar mean anomaly
  const M = (357.5291 + 0.98560028 * Jstar) % 360;
  const Mrad = M * DEG;

  // Equation of center
  const C =
    1.9148 * Math.sin(Mrad) +
    0.02 * Math.sin(2 * Mrad) +
    0.0003 * Math.sin(3 * Mrad);

  // Ecliptic longitude
  const lambda = (M + C + 180 + 102.9372) % 360;
  const lambdaRad = lambda * DEG;

  // Solar transit (noon)
  const Jtransit =
    J2000 +
    Jstar +
    0.0053 * Math.sin(Mrad) -
    0.0069 * Math.sin(2 * lambdaRad);

  // Declination
  const sinDec = Math.sin(lambdaRad) * Math.sin(23.4393 * DEG);
  const dec = Math.asin(sinDec);

  // Hour angle for a given altitude
  const hourAngle = (altitude: number) => {
    const cosH =
      (Math.sin(altitude * DEG) - Math.sin(lat * DEG) * Math.sin(dec)) /
      (Math.cos(lat * DEG) * Math.cos(dec));
    if (cosH < -1 || cosH > 1) return NaN; // no rise/set (polar)
    return Math.acos(cosH) * RAD;
  };

  // Standard altitude for sunrise/sunset: -0.833 degrees (refraction + sun radius)
  const hSun = hourAngle(-0.833);
  // Civil twilight: -6 degrees
  const hCivil = hourAngle(-6);
  // Golden hour: ~6 degrees above horizon
  const hGolden = hourAngle(6);

  const sunrise = jdToDate(Jtransit - hSun / 360);
  const sunset = jdToDate(Jtransit + hSun / 360);
  const civilDawn = jdToDate(Jtransit - hCivil / 360);
  const civilDusk = jdToDate(Jtransit + hCivil / 360);
  const goldenHourEnd = jdToDate(Jtransit - hGolden / 360); // morning golden hour ends
  const goldenHourStart = jdToDate(Jtransit + hGolden / 360); // evening golden hour starts

  return {
    sunrise,
    sunset,
    goldenHourStart,
    goldenHourEnd,
    civilDawn,
    civilDusk,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Moon Position & Transit Times
// ═══════════════════════════════════════════════════════════════════════════

interface MoonTimes {
  rise: Date;
  set: Date;
  overhead: Date; // upper transit
  underfoot: Date; // lower transit
}

/**
 * Calculate approximate moonrise, moonset, and transit times.
 *
 * Uses a simplified lunar position model sufficient for solunar period
 * calculation (accuracy ~10 minutes).
 */
function getMoonTimes(date: Date, lat: number, lon: number): MoonTimes {
  // Search for moonrise and moonset by evaluating the moon's altitude
  // at 5-minute intervals over 24+6 hours from midnight.
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);

  const altitudes: { time: Date; alt: number }[] = [];
  const stepMinutes = 5;
  const totalMinutes = 30 * 60; // 30 hours to catch events

  for (let m = 0; m <= totalMinutes; m += stepMinutes) {
    const t = new Date(midnight.getTime() + m * 60000);
    const alt = getMoonAltitude(t, lat, lon);
    altitudes.push({ time: t, alt });
  }

  // Find rise and set (altitude crosses zero from below/above)
  let rise: Date | undefined;
  let set: Date | undefined;
  let maxAlt = -Infinity;
  let maxAltTime: Date = midnight;
  let minAlt = Infinity;
  let minAltTime: Date = midnight;

  for (let i = 1; i < altitudes.length; i++) {
    const prev = altitudes[i - 1];
    const cur = altitudes[i];

    // Track max and min altitude for transit times
    if (cur.alt > maxAlt) {
      maxAlt = cur.alt;
      maxAltTime = cur.time;
    }
    if (cur.alt < minAlt) {
      minAlt = cur.alt;
      minAltTime = cur.time;
    }

    if (!rise && prev.alt < 0 && cur.alt >= 0) {
      // Linear interpolation for more accurate time
      const frac = -prev.alt / (cur.alt - prev.alt);
      rise = new Date(prev.time.getTime() + frac * stepMinutes * 60000);
    }

    if (!set && prev.alt >= 0 && cur.alt < 0) {
      const frac = prev.alt / (prev.alt - cur.alt);
      set = new Date(prev.time.getTime() + frac * stepMinutes * 60000);
    }
  }

  // Overhead = upper transit (highest point), Underfoot = 12 hours offset
  const overhead = maxAltTime;
  const underfoot =
    minAltTime.getTime() > overhead.getTime()
      ? minAltTime
      : new Date(overhead.getTime() + 12 * 3600000);

  // Keep underfoot within a reasonable window of the date
  const dayStart = midnight.getTime();
  const dayEnd = dayStart + 30 * 3600000;
  const underfootClamped =
    underfoot.getTime() > dayEnd
      ? new Date(underfoot.getTime() - 24 * 3600000)
      : underfoot;

  return {
    rise: rise ?? midnight,
    set: set ?? new Date(midnight.getTime() + 12 * 3600000),
    overhead,
    underfoot: underfootClamped,
  };
}

/**
 * Calculate the moon's altitude above the horizon at a given time and location.
 *
 * Simplified lunar position from Meeus, Chapter 47 (low accuracy, ~0.5 degree).
 */
function getMoonAltitude(date: Date, lat: number, lon: number): number {
  const jd = dateToJD(date);
  const T = (jd - J2000) / 36525; // Julian centuries from J2000

  // Moon's mean longitude (L')
  const Lp =
    (218.3164477 +
      481267.88123421 * T -
      0.0015786 * T * T +
      T * T * T / 538841) %
    360;

  // Moon's mean anomaly (M')
  const Mp =
    (134.9633964 +
      477198.8675055 * T +
      0.0087414 * T * T +
      T * T * T / 69699) %
    360;

  // Moon's mean elongation (D)
  const D =
    (297.8501921 +
      445267.1114034 * T -
      0.0018819 * T * T +
      T * T * T / 545868) %
    360;

  // Sun's mean anomaly (M)
  const M =
    (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) % 360;

  // Moon's argument of latitude (F)
  const F =
    (93.272095 +
      483202.0175233 * T -
      0.0036539 * T * T -
      T * T * T / 3526000) %
    360;

  // Ecliptic longitude of the moon (simplified, main terms only)
  const moonLon =
    Lp +
    6.289 * Math.sin(Mp * DEG) +
    1.274 * Math.sin((2 * D - Mp) * DEG) +
    0.658 * Math.sin(2 * D * DEG) +
    0.214 * Math.sin(2 * Mp * DEG) -
    0.186 * Math.sin(M * DEG) -
    0.114 * Math.sin(2 * F * DEG);

  // Ecliptic latitude of the moon (simplified)
  const moonLat =
    5.128 * Math.sin(F * DEG) +
    0.2806 * Math.sin((Mp + F) * DEG) +
    0.2777 * Math.sin((Mp - F) * DEG) +
    0.1732 * Math.sin((2 * D - F) * DEG);

  // Convert ecliptic to equatorial coordinates
  const obliquity = 23.4393 - 0.013 * T; // obliquity of ecliptic
  const lonRad = moonLon * DEG;
  const latRad = moonLat * DEG;
  const oblRad = obliquity * DEG;

  // Right ascension
  const ra = Math.atan2(
    Math.sin(lonRad) * Math.cos(oblRad) -
      Math.tan(latRad) * Math.sin(oblRad),
    Math.cos(lonRad),
  );

  // Declination
  const dec = Math.asin(
    Math.sin(latRad) * Math.cos(oblRad) +
      Math.cos(latRad) * Math.sin(oblRad) * Math.sin(lonRad),
  );

  // Hour angle
  const gmst = getGMST(jd);
  const lst = (gmst + lon) % 360; // local sidereal time in degrees
  const ha = (lst - ra * RAD + 360) % 360;
  const haRad = ha * DEG;

  // Altitude
  const alt = Math.asin(
    Math.sin(lat * DEG) * Math.sin(dec) +
      Math.cos(lat * DEG) * Math.cos(dec) * Math.cos(haRad),
  );

  return alt * RAD;
}

// ═══════════════════════════════════════════════════════════════════════════
// Julian Date Helpers
// ═══════════════════════════════════════════════════════════════════════════

function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;

  let yr = y;
  let mo = m;
  if (mo <= 2) {
    yr -= 1;
    mo += 12;
  }

  const A = Math.floor(yr / 100);
  const B = 2 - A + Math.floor(A / 4);

  return (
    Math.floor(365.25 * (yr + 4716)) +
    Math.floor(30.6001 * (mo + 1)) +
    d +
    B -
    1524.5
  );
}

function jdToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;

  let A: number;
  if (z < 2299161) {
    A = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    A = z + 1 + alpha - Math.floor(alpha / 4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E) + f;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  const dayInt = Math.floor(day);
  const dayFrac = day - dayInt;
  const hours = Math.floor(dayFrac * 24);
  const minutes = Math.floor((dayFrac * 24 - hours) * 60);
  const seconds = Math.floor(((dayFrac * 24 - hours) * 60 - minutes) * 60);

  return new Date(Date.UTC(year, month - 1, dayInt, hours, minutes, seconds));
}

/**
 * Greenwich Mean Sidereal Time in degrees for a given Julian Date.
 */
function getGMST(jd: number): number {
  const T = (jd - J2000) / 36525;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - J2000) +
    0.000387933 * T * T -
    T * T * T / 38710000;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst;
}
