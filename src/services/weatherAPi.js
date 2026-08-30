const API_URL = "https://api.open-meteo.com/v1/forecast";

export async function getWeatherData(latitude, longitude) {
  const url =
    `${API_URL}?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature` +
    `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature` +
    `&forecast_days=2` +
    `&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch weather data");
  }

  return await response.json();
}