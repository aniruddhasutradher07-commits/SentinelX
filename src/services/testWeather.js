import { getWeather } from "./weatherService";

getWeather(28.6139, 77.2090)
  .then((data) => {
    console.log("LIVE WEATHER DATA:");
    console.log(data);
  })
  .catch((error) => {
    console.error("Weather API Error:", error);
  });