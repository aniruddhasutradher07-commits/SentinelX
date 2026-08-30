function ForecastPage() {
  const forecast = [
    { day: "Today", temp: "38°C", risk: "High" },
    { day: "Tomorrow", temp: "40°C", risk: "Extreme" },
    { day: "Day 3", temp: "39°C", risk: "High" },
    { day: "Day 4", temp: "37°C", risk: "Moderate" },
    { day: "Day 5", temp: "36°C", risk: "Moderate" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">

      <h2 className="text-3xl font-bold text-slate-900">
        Heat Forecast
      </h2>

      <p className="text-slate-500 mt-2">
        Forecasted temperature and heat-risk conditions.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">

        {forecast.map((item) => (
          <div
            key={item.day}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
          >
            <p className="font-semibold text-slate-700">
              {item.day}
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-4">
              {item.temp}
            </p>

            <p className="text-red-600 font-medium mt-3">
              {item.risk} Risk
            </p>
          </div>
        ))}

      </div>

    </main>
  );
}

export default ForecastPage;