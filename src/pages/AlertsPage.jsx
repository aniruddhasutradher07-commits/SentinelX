function AlertsPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8">

      <h2 className="text-3xl font-bold text-slate-900">
        Heat Alerts
      </h2>

      <p className="text-slate-500 mt-2">
        Important heatwave and thermal stress warnings.
      </p>

      <div className="mt-8 space-y-4">

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">

            <div className="text-3xl">
              ⚠️
            </div>

            <div>
              <h3 className="font-bold text-red-700 text-lg">
                Extreme Heat Warning
              </h3>

              <p className="text-slate-600 mt-2">
                Temperature is expected to remain above 40°C.
                Vulnerable populations should avoid outdoor activities.
              </p>
            </div>

          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">

            <div className="text-3xl">
              🌡️
            </div>

            <div>
              <h3 className="font-bold text-orange-700 text-lg">
                High Thermal Stress
              </h3>

              <p className="text-slate-600 mt-2">
                High humidity combined with elevated temperature may
                increase human thermal stress.
              </p>
            </div>

          </div>
        </div>

      </div>

    </main>
  );
}

export default AlertsPage;