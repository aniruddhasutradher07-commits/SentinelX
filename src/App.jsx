import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import ForecastPage from "./pages/ForecastPage";
import AlertsPage from "./pages/AlertsPage";

function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
      </Routes>
    </div>
  );
}

export default App;