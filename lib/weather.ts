import { NextResponse } from 'next/server';
import { fetchWithPolicy } from '@/lib/http/fetchPolicy';
import { getOrSet, normalizeKey } from '@/lib/cache';
import { CACHE_TTLS } from '@/lib/cache/ttls';

export interface DailyForecast {
  day: string;
  condition: string;
  tempMax: string;
  tempMin: string;
  icon: string;
  packingTip?: string;
}

export interface WeatherDataResponse {
  city: string;
  temp: string;
  tempNum: number;
  condition: string;
  icon: string;
  humidity: string;
  windSpeed: string;
  recommendation: string;
  packingAdvice: string;
  packingBadge: string;
  isLive: boolean;
  forecast: DailyForecast[];
}

export async function fetchLiveWeather(city: string, startDate?: string): Promise<WeatherDataResponse> {
  const cacheKey = normalizeKey('weather', `${city}:${startDate || 'now'}`);
  return getOrSet(cacheKey, CACHE_TTLS.WEATHER_FORECAST, () => fetchLiveWeatherUncached(city, startDate));
}

async function fetchLiveWeatherUncached(city: string, startDate?: string): Promise<WeatherDataResponse> {
  const cleanCity = city.trim();
  const apiKey = (process.env.WEATHER_API_KEY || '').trim();

  // 1. Try WeatherAPI.com if key is available
  if (apiKey) {
    try {
      const wapiRes = await fetchWithPolicy(
        'weather',
        `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(cleanCity)}&days=3&aqi=no`,
        { cache: 'no-store' }
      );
      if (wapiRes.ok) {
        const data = await wapiRes.json();
        const tempNum = Math.round(data.current.temp_c);
        const condStr = data.current.condition.text;
        const humidity = `${data.current.humidity}%`;
        const wind = `${Math.round(data.current.wind_kph)} km/h`;
        const { icon, recommendation, packingAdvice, packingBadge } = mapConditionAndRecommendation(condStr, tempNum);

        const forecastDays: DailyForecast[] = (data.forecast?.forecastday || []).map((f: any) => {
          const dObj = new Date(f.date + 'T00:00:00');
          const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const { icon: dIcon, packingBadge: dBadge } = mapConditionAndRecommendation(f.day.condition.text, Math.round(f.day.maxtemp_c));
          return {
            day: dayName,
            condition: f.day.condition.text,
            tempMax: `${Math.round(f.day.maxtemp_c)}°C`,
            tempMin: `${Math.round(f.day.mintemp_c)}°C`,
            icon: dIcon,
            packingTip: dBadge,
          };
        });

        return {
          city: data.location?.name || cleanCity,
          temp: `${tempNum}°C`,
          tempNum,
          condition: condStr,
          icon,
          humidity,
          windSpeed: wind,
          recommendation,
          packingAdvice,
          packingBadge,
          isLive: true,
          forecast: forecastDays.length > 0 ? forecastDays : generateMockForecast(tempNum, condStr, startDate),
        };
      }
    } catch (err) {
      console.log('WeatherAPI.com check failed, trying OpenWeatherMap / Open-Meteo:', err);
    }

    // 2. Try OpenWeatherMap
    try {
      const owmRes = await fetchWithPolicy(
        'weather',
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanCity)}&units=metric&appid=${apiKey}`,
        { cache: 'no-store' }
      );
      if (owmRes.ok) {
        const data = await owmRes.json();
        const tempNum = Math.round(data.main.temp);
        const condStr = data.weather[0]?.description || 'Clear';
        const humidity = `${data.main.humidity}%`;
        const wind = `${Math.round(data.wind.speed * 3.6)} km/h`;
        const { icon, recommendation, packingAdvice, packingBadge } = mapConditionAndRecommendation(condStr, tempNum);

        return {
          city: cleanCity,
          temp: `${tempNum}°C`,
          tempNum,
          condition: capitalize(condStr),
          icon,
          humidity,
          windSpeed: wind,
          recommendation,
          packingAdvice,
          packingBadge,
          isLive: true,
          forecast: generateMockForecast(tempNum, condStr, startDate),
        };
      }
    } catch (err) {
      console.log('OpenWeatherMap API check notice:', err);
    }
  }

  // 3. Open-Meteo Keyless API (100% Free, Zero Config)
  try {
    const geoRes = await fetchWithPolicy(
      'weather',
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=en&format=json`,
      { cache: 'no-store' }
    );

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude, name } = geoData.results[0];

        const weatherRes = await fetchWithPolicy(
          'weather',
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
          { cache: 'no-store' }
        );

        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          const current = wData.current;
          const tempNum = Math.round(current.temperature_2m);
          const weatherCode = current.weather_code;
          const { condition, icon, recommendation, packingAdvice, packingBadge } = interpretWmoCode(weatherCode, tempNum);

          const forecastDays: DailyForecast[] = [];
          if (wData.daily && wData.daily.time) {
            for (let i = 0; i < Math.min(3, wData.daily.time.length); i++) {
              const dateObj = new Date(wData.daily.time[i] + 'T00:00:00');
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const dCode = wData.daily.weather_code[i];
              const dInfo = interpretWmoCode(dCode, Math.round(wData.daily.temperature_2m_max[i]));
              forecastDays.push({
                day: dayName,
                condition: dInfo.condition,
                tempMax: `${Math.round(wData.daily.temperature_2m_max[i])}°C`,
                tempMin: `${Math.round(wData.daily.temperature_2m_min[i])}°C`,
                icon: dInfo.icon,
                packingTip: dInfo.packingBadge,
              });
            }
          }

          return {
            city: name || cleanCity,
            temp: `${tempNum}°C`,
            tempNum,
            condition,
            icon,
            humidity: `${Math.round(current.relative_humidity_2m)}%`,
            windSpeed: `${Math.round(current.wind_speed_10m)} km/h`,
            recommendation,
            packingAdvice,
            packingBadge,
            isLive: true,
            forecast: forecastDays.length > 0 ? forecastDays : generateMockForecast(tempNum, condition, startDate),
          };
        }
      }
    }
  } catch (err) {
    console.log('Open-Meteo keyless API notice:', err);
  }

  // 4. Resilient fallback generator if network fails
  const defaultAdvice = mapConditionAndRecommendation('Sunny', 26);
  return {
    city: cleanCity,
    temp: '26°C',
    tempNum: 26,
    condition: 'Sunny & Pleasant',
    icon: '☀️',
    humidity: '55%',
    windSpeed: '12 km/h',
    recommendation: `Pleasant weather in ${cleanCity}. Great for sightseeing and walking tours!`,
    packingAdvice: defaultAdvice.packingAdvice,
    packingBadge: defaultAdvice.packingBadge,
    isLive: false,
    forecast: generateMockForecast(26, 'Sunny', startDate),
  };
}

function interpretWmoCode(code: number, tempC: number) {
  let condition = 'Clear Sky';
  let icon = '☀️';

  if (code === 0) {
    condition = 'Clear & Sunny';
    icon = '☀️';
  } else if (code >= 1 && code <= 3) {
    condition = 'Partly Cloudy';
    icon = '⛅';
  } else if (code >= 45 && code <= 48) {
    condition = 'Foggy';
    icon = '🌫️';
  } else if (code >= 51 && code <= 67) {
    condition = 'Light Rain & Showers';
    icon = '🌧️';
  } else if (code >= 71 && code <= 77) {
    condition = 'Snow Showers';
    icon = '❄️';
  } else if (code >= 80 && code <= 82) {
    condition = 'Heavy Rain Showers';
    icon = '🌧️';
  } else if (code >= 95) {
    condition = 'Thunderstorm Alert';
    icon = '⛈️';
  }

  const { recommendation, packingAdvice, packingBadge } = mapConditionAndRecommendation(condition, tempC);
  return { condition, icon, recommendation, packingAdvice, packingBadge };
}

function mapConditionAndRecommendation(condition: string, tempC: number) {
  const lower = condition.toLowerCase();
  let icon = '🌤️';
  let recommendation = 'Pleasant weather. Ideal for outdoor sightseeing and walking tours.';
  let packingAdvice = '🎒 Pleasant climate — pack light layers and comfortable walking shoes.';
  let packingBadge = '🎒 Light Wear & Walking Shoes';

  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) {
    icon = '🌧️';
    recommendation = '🌧️ Rain expected. Pack an umbrella and plan indoor museum/cafe visits.';
    packingAdvice = '☔ Need an umbrella for your trip! Expect rain during your scheduled days.';
    packingBadge = '☔ Need Umbrella & Rainwear';
  } else if (lower.includes('thunder') || lower.includes('storm')) {
    icon = '⛈️';
    recommendation = '⛈️ Thunderstorm alert. Keep outdoor activities brief and monitor local weather.';
    packingAdvice = '⚡ Need an umbrella & raincoat for your trip! Stormy weather expected.';
    packingBadge = '☔ Need Umbrella & Raincoat';
  } else if (lower.includes('snow') || tempC <= 5) {
    icon = '❄️';
    recommendation = '❄️ Cold snowy climate. Wear heavy winter clothing and thermal gear.';
    packingAdvice = '🧥 Chilly cold weather — pack a heavy winter coat, gloves, and thermal layers!';
    packingBadge = '🧥 Heavy Winter Coat & Thermals';
  } else if (tempC <= 16) {
    icon = '🧥';
    recommendation = '🧥 Crisp cool weather. Carrying a warm jacket or sweater is recommended.';
    packingAdvice = '🧥 Chilly cold weather — wear a sweater or warm jacket for your trip!';
    packingBadge = '🧥 Pack Sweater or Jacket';
  } else if (tempC >= 28 || lower.includes('sun') || lower.includes('clear')) {
    icon = '☀️';
    recommendation = '☀️ Warm sunny weather. Stay hydrated, carry sunscreen, and avoid peak noon heat.';
    packingAdvice = '🕶️ Warm & sunny climate — pack sunglasses, sunscreen, and breathable cotton wear!';
    packingBadge = '🕶️ Sunglasses & Sunscreen';
  }

  return { icon, recommendation, packingAdvice, packingBadge };
}

function generateMockForecast(baseTemp: number, condition: string, startDate?: string): DailyForecast[] {
  const start = startDate ? new Date(startDate + 'T00:00:00') : new Date();
  return [0, 1, 2].map((offset) => {
    const d = new Date(start);
    d.setDate(start.getDate() + offset);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const { packingBadge } = mapConditionAndRecommendation(offset === 0 ? condition : 'Partly Cloudy', baseTemp + offset);
    return {
      day: dayLabel,
      condition: offset === 0 ? condition : 'Partly Cloudy',
      tempMax: `${baseTemp + offset}°C`,
      tempMin: `${baseTemp - 3 + offset}°C`,
      icon: offset === 0 ? '🌤️' : '☀️',
      packingTip: packingBadge,
    };
  });
}

function capitalize(str: string): string {
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
}
