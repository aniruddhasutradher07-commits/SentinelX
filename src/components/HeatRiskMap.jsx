import { useState } from "react";
import { MapPin, Thermometer, Droplets, Activity, AlertTriangle } from "lucide-react";

const locations = [
  {
    name: "Delhi",
    temperature: 42,
    humidity: 48,
    heatIndex: 49,
    stressIndex: 9.2,
    risk: "Extreme",
    position: "top-[28%] left-[48%]",
    color: "bg-red-600",
    recommendation:
      "Avoid outdoor activity between 12 PM and 4 PM. Stay hydrated and remain in shaded or cool areas.",
  },
  {
    name: "Jaipur",
    temperature: 40,
    humidity: 35,
    heatIndex: 44,
    stressIndex: 8.1,
    risk: "High",
    position: "top-[38%] left-[37%]",
    color: "bg-orange-500",
    recommendation:
      "Limit prolonged outdoor exposure and drink water frequently.",
  },
  {
    name: "Lucknow",
    temperature: 41,
    humidity: 52,
    heatIndex: 48,
    stressIndex: 8.8,
    risk: "Extreme",
    position: "top-[35%] left-[60%]",
    color: "bg-red-600",
    recommendation:
      "Avoid strenuous outdoor activities and take frequent cooling breaks.",
  },
  {
    name: "Mumbai",
    temperature: 34,
    humidity: 72,
    heatIndex: 40,
    stressIndex: 6.2,
    risk: "Moderate",
    position: "top-[70%] left-[28%]",
    color: "bg-yellow-500",
    recommendation:
      "Stay hydrated and avoid excessive physical activity during peak heat.",
  },
  {
    name: "Bengaluru",
    temperature: 31,
    humidity: 60,
    heatIndex: 33,
    stressIndex: 3.8,
    risk: "Low",
    position: "top-[78%] left-[48%]",
    color: "bg-green-500",
    recommendation:
      "Normal outdoor activities are generally safe. Maintain regular hydration.",
  },
];

function HeatRiskMap() {

  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mt-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">

        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Heat Risk Map
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Click a location to view thermal stress details
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={18} />
          India
        </div>

      </div>


      {/* Map */}
      <div className="relative h-[450px] rounded-xl bg-gradient-to-br from-green-100 via-yellow-100 to-orange-100 overflow-hidden">

        {/* Grid */}
        <div className="absolute inset-0 opacity-30">

          <div className="absolute top-1/4 left-0 right-0 border-t border-gray-400" />

          <div className="absolute top-2/4 left-0 right-0 border-t border-gray-400" />

          <div className="absolute top-3/4 left-0 right-0 border-t border-gray-400" />

          <div className="absolute left-1/4 top-0 bottom-0 border-l border-gray-400" />

          <div className="absolute left-2/4 top-0 bottom-0 border-l border-gray-400" />

          <div className="absolute left-3/4 top-0 bottom-0 border-l border-gray-400" />

        </div>


        {/* Location markers */}
        {locations.map((location) => (

          <button
            key={location.name}
            onClick={() => setSelectedLocation(location)}
            className={`absolute ${location.position} group cursor-pointer`}
          >

            <div
              className={`
                w-6 h-6
                ${location.color}
                rounded-full
                border-4
                border-white
                shadow-lg
                transition
                duration-200
                hover:scale-125
              `}
            />

            {/* Hover label */}
            <span className="
              absolute
              hidden
              group-hover:block
              bottom-8
              left-1/2
              -translate-x-1/2
              bg-gray-900
              text-white
              text-xs
              px-2
              py-1
              rounded
              whitespace-nowrap
              z-20
            ">
              {location.name}
            </span>

          </button>

        ))}


        {/* Legend */}
        <div className="
          absolute
          bottom-4
          left-4
          bg-white/95
          px-4
          py-3
          rounded-lg
          shadow
        ">

          <p className="text-xs text-gray-500 mb-2">
            Heat stress intensity
          </p>

          <div className="flex gap-4 text-xs">

            <span>🟢 Low</span>

            <span>🟡 Moderate</span>

            <span>🟠 High</span>

            <span>🔴 Extreme</span>

          </div>

        </div>

      </div>


      {/* Selected Location Details */}
      {selectedLocation && (

        <div className="mt-5 border border-gray-200 rounded-xl p-5 bg-gray-50">

          {/* Location heading */}
          <div className="flex items-center justify-between">

            <div>

              <h3 className="text-xl font-bold text-gray-800">
                {selectedLocation.name}
              </h3>

              <p className="text-sm text-gray-500">
                Current thermal stress assessment
              </p>

            </div>


            <span
              className={`
                px-4
                py-2
                rounded-full
                text-sm
                font-semibold

                ${
                  selectedLocation.risk === "Extreme"
                    ? "bg-red-100 text-red-700"
                    : selectedLocation.risk === "High"
                    ? "bg-orange-100 text-orange-700"
                    : selectedLocation.risk === "Moderate"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }
              `}
            >
              {selectedLocation.risk} Risk
            </span>

          </div>


          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">

            {/* Temperature */}
            <div className="bg-white rounded-lg p-4 shadow-sm">

              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Thermometer size={18} />
                Temperature
              </div>

              <p className="text-2xl font-bold mt-2 text-gray-800">
                {selectedLocation.temperature}°C
              </p>

            </div>


            {/* Humidity */}
            <div className="bg-white rounded-lg p-4 shadow-sm">

              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Droplets size={18} />
                Humidity
              </div>

              <p className="text-2xl font-bold mt-2 text-gray-800">
                {selectedLocation.humidity}%
              </p>

            </div>


            {/* Heat Index */}
            <div className="bg-white rounded-lg p-4 shadow-sm">

              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Thermometer size={18} />
                Heat Index
              </div>

              <p className="text-2xl font-bold mt-2 text-gray-800">
                {selectedLocation.heatIndex}°C
              </p>

            </div>


            {/* Stress Index */}
            <div className="bg-white rounded-lg p-4 shadow-sm">

              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Activity size={18} />
                Stress Index
              </div>

              <p className="text-2xl font-bold mt-2 text-gray-800">
                {selectedLocation.stressIndex}/10
              </p>

            </div>

          </div>


          {/* Recommendation */}
          <div className="mt-5 bg-white rounded-lg p-4 border-l-4 border-orange-500">

            <div className="flex items-center gap-2 font-semibold text-gray-800">

              <AlertTriangle size={20} />

              Recommended Action

            </div>

            <p className="text-sm text-gray-600 mt-2">

              {selectedLocation.recommendation}

            </p>

          </div>

        </div>

      )}

    </div>
  );
}

export default HeatRiskMap;