const API_URL = "https://api.open-meteo.com/v1/forecast";

export async function getWeatherData(latitude, longitude) {
  try {
    const url =
      `${API_URL}?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,surface_solar_radiation,uv_index` +
      `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature` +
      `&forecast_days=2` +
      `&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn("Open-Meteo fetch returned status", response.status);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn("Failed to fetch live weather data from Open-Meteo:", err);
    return null;
  }
}