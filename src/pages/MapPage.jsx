function MapPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8">

      <h2 className="text-3xl font-bold text-slate-900">
        Heat Risk Map
      </h2>

      <p className="text-slate-500 mt-2">
        Visualize heat stress levels across different locations.
      </p>

      <div className="mt-8 h-96 bg-slate-200 rounded-2xl flex items-center justify-center border border-slate-300">
        <div className="text-center">
          <p className="text-5xl">🗺️</p>
          <p className="text-xl font-semibold text-slate-700 mt-4">
            Heat Risk Map
          </p>
          <p className="text-slate-500 mt-2">
            Interactive map will be added here.
          </p>
        </div>
      </div>

    </main>
  );
}

export default MapPage;