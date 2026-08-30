function WeatherCard({ icon, title, value, unit, description }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-4xl font-bold text-slate-900">
              {value}
            </span>

            <span className="text-lg text-slate-500">
              {unit}
            </span>
          </div>
        </div>

        <div className="text-4xl">
          {icon}
        </div>

      </div>

      <p className="text-sm text-slate-500 mt-4">
        {description}
      </p>

    </div>
  );
}

export default WeatherCard;