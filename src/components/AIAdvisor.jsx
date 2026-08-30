function AIAdvisor() {
  const recommendations = [
    "Avoid prolonged outdoor exposure between 12 PM and 4 PM.",
    "Drink water frequently to stay hydrated.",
    "Wear loose, light-colored clothing.",
    "Avoid strenuous physical activity during peak heat.",
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
          🤖
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900">
            AI Safety Advisor
          </h3>

          <p className="text-sm text-slate-500">
            Personalized heat-safety recommendations
          </p>
        </div>

      </div>

      <div className="mt-6 space-y-3">

        {recommendations.map((recommendation, index) => (
          <div
            key={index}
            className="flex items-start gap-3 bg-slate-50 rounded-xl p-4"
          >
            <span className="text-lg">
              {index === 0 ? "⚠️" : index === 1 ? "💧" : index === 2 ? "🧢" : "🏃"}
            </span>

            <p className="text-sm text-slate-700">
              {recommendation}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
}

export default AIAdvisor;