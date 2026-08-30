function ThermalStressCard({ score, level }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            Human Thermal Stress
          </p>

          <h3 className="text-2xl font-bold text-slate-900 mt-2">
            {score} / 100
          </h3>
        </div>

        <div className="text-4xl">
          🧍
        </div>

      </div>

      {/* Progress bar */}
      <div className="mt-5">

        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">

          <div
            className="h-full bg-orange-500 rounded-full"
            style={{ width: `${score}%` }}
          ></div>

        </div>

      </div>

      <div className="flex justify-between items-center mt-4">

        <span className="text-sm text-slate-500">
          Thermal stress level
        </span>

        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
          {level}
        </span>

      </div>

    </div>
  );
}

export default ThermalStressCard;