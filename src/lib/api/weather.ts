import type { ExtendedWeatherData, ForecastDay } from '@/lib/types';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

function getApiKey(): string {
  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) {
    throw new Error('OPENWEATHERMAP_API_KEY environment variable is not set');
  }
  return key;
}

/**
 * Convert a compass degree to a string like "NNW".
 */
function degToCompass(deg: number): string {
  const dirs = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

/**
 * Fetch current weather for a lat/lon.
 * Pressure trend is derived by comparing current pressure to the 3-hour
 * forecast — call getForecast separately for multi-day pressure data.
 */
export async function getWeather(lat: number, lon: number): Promise<ExtendedWeatherData> {
  const apiKey = getApiKey();

  // Fetch current weather and 5-day/3-hour forecast in parallel for pressure trend
  const [currentRes, forecastRes] = await Promise.all([
    fetch(
      `${OWM_BASE}/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`,
    ),
    fetch(
      `${OWM_BASE}/forecast?lat=${lat}&lon=${lon}&units=imperial&cnt=3&appid=${apiKey}`,
    ),
  ]);

  if (!currentRes.ok) {
    throw new Error(`OpenWeatherMap current API error: ${currentRes.status} ${currentRes.statusText}`);
  }

  const current = await currentRes.json();

  // Calculate pressure trend from forecast data
  let pressureTrend: ExtendedWeatherData['pressureTrend'] = 'steady';
  if (forecastRes.ok) {
    const forecastData = await forecastRes.json();
    pressureTrend = calculatePressureTrend(
      current.main.pressure,
      forecastData.list ?? [],
    );
  }

  const weather = current.weather?.[0] ?? {};

  return {
    temp: current.main.temp,
    feelsLike: current.main.feels_like,
    humidity: current.main.humidity,
    pressure: current.main.pressure,
    pressureTrend,
    windSpeed: current.wind.speed,
    windGust: current.wind.gust ?? current.wind.speed,
    windDirection: current.wind.deg ?? 0,
    windDirectionStr: degToCompass(current.wind.deg ?? 0),
    description: weather.description ?? '',
    icon: weather.icon ?? '',
    cloudCover: current.clouds?.all ?? 0,
    visibility: (current.visibility ?? 10000) / 1609.34, // meters -> miles
    rainLastHour: current.rain?.['1h'],
  };
}

/**
 * Fetch a 5-day forecast grouped by day.
 */
export async function getForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  const apiKey = getApiKey();

  const res = await fetch(
    `${OWM_BASE}/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`,
  );

  if (!res.ok) {
    throw new Error(`OpenWeatherMap forecast API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const list: {
    dt: number;
    main: { temp: number; pressure: number };
    wind: { speed: number; gust?: number; deg: number };
    weather: { description: string; icon: string }[];
    pop: number;
  }[] = data.list ?? [];

  // Group by date
  const byDate = new Map<string, typeof list>();
  for (const item of list) {
    const dateStr = new Date(item.dt * 1000).toISOString().slice(0, 10);
    if (!byDate.has(dateStr)) byDate.set(dateStr, []);
    byDate.get(dateStr)!.push(item);
  }

  const days: ForecastDay[] = [];
  for (const [dateStr, items] of byDate) {
    const temps = items.map((i) => i.main.temp);
    const pressures = items.map((i) => i.main.pressure);
    // Use the midday entry for representative weather
    const midday = items[Math.floor(items.length / 2)];
    const weather = midday.weather?.[0] ?? {};

    days.push({
      date: dateStr,
      high: Math.round(Math.max(...temps)),
      low: Math.round(Math.min(...temps)),
      pressure: Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length),
      windSpeed: Math.round(midday.wind.speed),
      windGust: Math.round(midday.wind.gust ?? midday.wind.speed),
      windDirection: midday.wind.deg,
      description: weather.description ?? '',
      icon: weather.icon ?? '',
      pop: Math.max(...items.map((i) => i.pop)),
    });
  }

  return days;
}

// ── Pressure Trend ──────────────────────────────────────────────────────────

function calculatePressureTrend(
  currentPressure: number,
  forecastEntries: { main: { pressure: number }; dt: number }[],
): ExtendedWeatherData['pressureTrend'] {
  if (forecastEntries.length < 2) return 'steady';

  // Compare current pressure to the average of the next few forecast entries.
  // A positive delta means pressure is expected to rise.
  const futureAvg =
    forecastEntries.reduce((sum, e) => sum + e.main.pressure, 0) /
    forecastEntries.length;
  const delta = futureAvg - currentPressure;

  if (delta > 3) return 'rapidly_rising';
  if (delta > 1) return 'rising';
  if (delta < -3) return 'rapidly_falling';
  if (delta < -1) return 'falling';
  return 'steady';
}
