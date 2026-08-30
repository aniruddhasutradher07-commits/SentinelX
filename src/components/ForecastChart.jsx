import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const forecastData = [
  { time: "10 AM", temperature: 34, risk: 45 },
  { time: "11 AM", temperature: 35, risk: 50 },
  { time: "12 PM", temperature: 37, risk: 60 },
  { time: "1 PM", temperature: 38, risk: 68 },
  { time: "2 PM", temperature: 39, risk: 74 },
  { time: "3 PM", temperature: 40, risk: 82 },
  { time: "4 PM", temperature: 39, risk: 78 },
  { time: "5 PM", temperature: 37, risk: 65 },
  { time: "6 PM", temperature: 35, risk: 52 },
  { time: "7 PM", temperature: 33, risk: 40 },
  { time: "8 PM", temperature: 31, risk: 32 },
  { time: "9 PM", temperature: 30, risk: 25 },
];

function ForecastChart() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      {/* Chart heading */}
      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-900">
          24-Hour Heat Forecast
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Predicted temperature and heat risk throughout the day
        </p>

      </div>

      {/* Chart */}
      <div className="w-full h-80">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart
            data={forecastData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
            />

            <YAxis
              yAxisId="temperature"
              tick={{ fontSize: 12 }}
              label={{
                value: "Temperature (°C)",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <YAxis
              yAxisId="risk"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{
                value: "Risk (%)",
                angle: 90,
                position: "insideRight",
              }}
            />

            <Tooltip />

            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="temperature"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Temperature"
            />

            <Line
              yAxisId="risk"
              type="monotone"
              dataKey="risk"
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Heat Risk"
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4 text-sm text-slate-600">

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-800"></span>
          Temperature
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-400"></span>
          Heat Risk
        </div>

      </div>

    </div>
  );
}

export default ForecastChart;