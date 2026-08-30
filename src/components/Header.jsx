import { Link, useLocation } from "react-router-dom";
import { Flame, Map, BarChart3, Bell } from "lucide-react";

function Header() {
  const location = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <Flame size={17} />,
    },
    {
      name: "Heat Map",
      path: "/map",
      icon: <Map size={17} />,
    },
    {
      name: "Forecast",
      path: "/forecast",
      icon: <BarChart3 size={17} />,
    },
    {
      name: "Alerts",
      path: "/alerts",
      icon: <Bell size={17} />,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">

            <div className="bg-red-100 p-2 rounded-xl">
              <Flame className="text-red-600" size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                HeatGuard AI
              </h1>

              <p className="text-xs text-slate-500">
                Heat Early Warning System
              </p>
            </div>

          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">

            {navItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-red-50 text-red-600"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}

          </nav>

          {/* Location */}
          <div className="text-sm">

            <p className="text-xs text-slate-400">
              Monitoring
            </p>

            <p className="font-semibold text-slate-700">
              📍 Bhubaneswar
            </p>

          </div>

        </div>

      </div>
    </header>
  );
}

export default Header;