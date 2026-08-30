import {
  AlertTriangle,
  Thermometer,
  Activity,
  Clock,
} from "lucide-react";

function EarlyWarning() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mt-5">

      {/* Alert Header */}
      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">

          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle
              className="text-red-600"
              size={26}
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Early Heat Warning
            </h2>

            <p className="text-sm text-gray-500">
              Heat stress alert for your region
            </p>
          </div>

        </div>

        <span className="
          bg-red-100
          text-red-700
          px-4
          py-2
          rounded-full
          text-sm
          font-semibold
        ">
          EXTREME
        </span>

      </div>


      {/* Warning Message */}
      <div className="
        mt-5
        bg-red-50
        border-l-4
        border-red-500
        rounded-lg
        p-4
      ">

        <h3 className="font-bold text-red-800">
          Extreme Heat Warning — Delhi
        </h3>

        <p className="text-sm text-red-700 mt-1">
          Extreme thermal stress conditions are expected.
          Take immediate precautions and avoid prolonged
          outdoor exposure.
        </p>

      </div>


      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

        {/* Temperature */}
        <div className="bg-gray-50 rounded-xl p-4">

          <div className="flex items-center gap-2 text-gray-500">
            <Thermometer size={19} />
            Temperature
          </div>

          <p className="text-2xl font-bold text-gray-800 mt-2">
            42°C
          </p>

        </div>


        {/* Heat Index */}
        <div className="bg-gray-50 rounded-xl p-4">

          <div className="flex items-center gap-2 text-gray-500">
            <Thermometer size={19} />
            Heat Index
          </div>

          <p className="text-2xl font-bold text-gray-800 mt-2">
            49°C
          </p>

        </div>


        {/* Stress Index */}
        <div className="bg-gray-50 rounded-xl p-4">

          <div className="flex items-center gap-2 text-gray-500">
            <Activity size={19} />
            Thermal Stress
          </div>

          <p className="text-2xl font-bold text-gray-800 mt-2">
            9.2 / 10
          </p>

        </div>

      </div>


      {/* Warning Time */}
      <div className="
        mt-5
        flex
        items-center
        gap-2
        text-sm
        text-gray-600
      ">

        <Clock size={18} />

        <span>
          Peak risk period: <b>12 PM – 4 PM</b>
        </span>

      </div>


      {/* Recommended Actions */}
      <div className="mt-5">

        <h3 className="font-semibold text-gray-800">
          Recommended Actions
        </h3>

        <ul className="mt-3 space-y-2 text-sm text-gray-600">

          <li>
            ✓ Avoid strenuous outdoor activities
          </li>

          <li>
            ✓ Drink water frequently
          </li>

          <li>
            ✓ Stay in shaded or cool areas
          </li>

          <li>
            ✓ Check on elderly people and children
          </li>

        </ul>

      </div>

    </div>
  );
}

export default EarlyWarning;