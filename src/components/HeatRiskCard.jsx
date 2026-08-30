function HeatRiskCard({ riskLevel, probability }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            Current Heat Risk
          </p>

          <h3 className="text-3xl font-bold text-red-600 mt-2">
            {riskLevel}
          </h3>
        </div>

        <div className="text-4xl">
          ⚠️
        </div>

      </div>

      <div className="mt-6">

        <div className="flex justify-between mb-2">

          <span className="text-sm text-slate-500">
            Heatwave Probability
          </span>

          <span className="text-sm font-bold text-slate-900">
            {probability}%
          </span>

        </div>

        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">

          <div
            className="h-full bg-red-500 rounded-full"
            style={{ width: `${probability}%` }}
          ></div>

        </div>

      </div>

      <p className="text-sm text-slate-500 mt-4">
        Extreme heat conditions may cause significant thermal stress.
      </p>

    </div>
  );
}

export default HeatRiskCard;