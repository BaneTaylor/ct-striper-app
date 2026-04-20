import { NextRequest } from 'next/server';
import { getTidePredictions, getHighLowTides, getCurrentTideStage } from '@/lib/api/tides';
import { getWeather } from '@/lib/api/weather';
import { getSolunarData, getMoonPhase, getSunTimes } from '@/lib/api/solunar';
import { calculateFishingScore } from '@/lib/scoring/fishing-score';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '41.26');
  const lon = parseFloat(searchParams.get('lon') ?? '-72.55');
  const station = searchParams.get('station') ?? '8465705';

  const now = new Date();
  const errors: string[] = [];

  // Fetch all data sources in parallel — each wrapped so one failure doesn't sink the rest
  const [tideResult, hiloResult, weatherResult, solunarResult, sunResult] = await Promise.allSettled([
    getTidePredictions(station, 'today'),
    getHighLowTides(station),
    getWeather(lat, lon),
    Promise.resolve(getSolunarData(now, lat, lon)),
    Promise.resolve(getSunTimes(now, lat, lon)),
  ]);

  const predictions = tideResult.status === 'fulfilled' ? tideResult.value : null;
  if (tideResult.status === 'rejected') errors.push(`tides: ${tideResult.reason}`);

  const highLowTides = hiloResult.status === 'fulfilled' ? hiloResult.value : null;
  if (hiloResult.status === 'rejected') errors.push(`hilo: ${hiloResult.reason}`);

  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  if (weatherResult.status === 'rejected') errors.push(`weather: ${weatherResult.reason}`);

  const solunar = solunarResult.status === 'fulfilled' ? solunarResult.value : null;
  if (solunarResult.status === 'rejected') errors.push(`solunar: ${solunarResult.reason}`);

  const sunTimes = sunResult.status === 'fulfilled' ? sunResult.value : null;
  if (sunResult.status === 'rejected') errors.push(`sun: ${sunResult.reason}`);

  // Derive tide stage from predictions
  const tideStage = predictions ? getCurrentTideStage(predictions) : null;

  // Get moon phase
  const moonData = getMoonPhase(now);

  // Calculate fishing score if we have enough data
  let fishingScore = null;
  if (tideStage && sunTimes && weather) {
    fishingScore = calculateFishingScore({
      tideStage,
      currentTime: now,
      sunTimes,
      moonData,
      weather,
    });
  }

  // Build best windows for today
  const bestWindows = buildBestWindows(predictions, sunTimes, solunar, moonData);

  return Response.json({
    timestamp: now.toISOString(),
    location: { lat, lon, station },
    tideStage,
    predictions: predictions?.slice(0, 48) ?? null, // ~4.8 hours of 6-min data for the mini chart
    highLowTides,
    weather,
    solunar: solunar
      ? {
          ...solunar,
          majorPeriods: solunar.majorPeriods.map((p) => ({ start: p.start.toISOString(), end: p.end.toISOString() })),
          minorPeriods: solunar.minorPeriods.map((p) => ({ start: p.start.toISOString(), end: p.end.toISOString() })),
          moonrise: solunar.moonrise.toISOString(),
          moonset: solunar.moonset.toISOString(),
          moonOverhead: solunar.moonOverhead.toISOString(),
          moonUnderfoot: solunar.moonUnderfoot.toISOString(),
        }
      : null,
    sunTimes: sunTimes
      ? {
          sunrise: sunTimes.sunrise.toISOString(),
          sunset: sunTimes.sunset.toISOString(),
          goldenHourStart: sunTimes.goldenHourStart.toISOString(),
          goldenHourEnd: sunTimes.goldenHourEnd.toISOString(),
          civilDawn: sunTimes.civilDawn.toISOString(),
          civilDusk: sunTimes.civilDusk.toISOString(),
        }
      : null,
    moonData,
    fishingScore,
    bestWindows,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// Build simple best-windows suggestions based on available data
function buildBestWindows(
  predictions: Awaited<ReturnType<typeof getTidePredictions>> | null,
  sunTimes: ReturnType<typeof getSunTimes> | null,
  solunar: ReturnType<typeof getSolunarData> | null,
  moonData: ReturnType<typeof getMoonPhase>,
) {
  const windows: { time: string; score: number; reason: string }[] = [];

  if (sunTimes) {
    // Dawn window
    const dawnStart = new Date(sunTimes.civilDawn.getTime() - 15 * 60000);
    const dawnEnd = new Date(sunTimes.sunrise.getTime() + 60 * 60000);
    windows.push({
      time: `${formatTime(dawnStart)} - ${formatTime(dawnEnd)}`,
      score: 8,
      reason: 'Dawn golden hour — peak feeding activity',
    });

    // Dusk window
    const duskStart = sunTimes.goldenHourStart;
    const duskEnd = new Date(sunTimes.civilDusk.getTime() + 15 * 60000);
    windows.push({
      time: `${formatTime(duskStart)} - ${formatTime(duskEnd)}`,
      score: 9,
      reason: 'Dusk golden hour — stripers move shallow to feed',
    });
  }

  if (solunar && solunar.majorPeriods.length > 0) {
    const major = solunar.majorPeriods[0];
    windows.push({
      time: `${formatTime(major.start)} - ${formatTime(major.end)}`,
      score: 7,
      reason: `Major solunar period — ${moonData.phase === 'full' || moonData.phase === 'new' ? 'enhanced by ' + moonData.phase + ' moon' : 'moon overhead'}`,
    });
  }

  // Sort by score descending and take top 3
  return windows.sort((a, b) => b.score - a.score).slice(0, 3);
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
