import { Outlet, Link, useLocation } from "react-router";
import { Building2, Server, Shield } from "lucide-react";

export function RootLayout() {
  const location = useLocation();

  const getActiveRoute = () => {
    if (location.pathname === "/" || location.pathname === "/edge-hub") return "edge-hub";
    if (location.pathname === "/central") return "central";
    if (location.pathname === "/authority") return "authority";
    return "edge-hub";
  };

  const activeRoute = getActiveRoute();

  return (
    <div className="size-full bg-[#0a0e1a] text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-cyan-900/30 bg-gradient-to-r from-[#0f1419] to-[#0a0e1a] backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                A-RES
              </h1>
              <p className="text-xs text-gray-400">Advanced Resilience Emergency System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-2">
            <Link
              to="/edge-hub"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeRoute === "edge-hub"
                  ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/20"
                  : "border border-gray-700/50 text-gray-400 hover:border-cyan-500/30 hover:text-cyan-300"
              }`}
            >
              <Building2 className="size-4" />
              Edge Hub
            </Link>
            <Link
              to="/central"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeRoute === "central"
                  ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/20"
                  : "border border-gray-700/50 text-gray-400 hover:border-cyan-500/30 hover:text-cyan-300"
              }`}
            >
              <Server className="size-4" />
              Central Coordination
            </Link>
            <Link
              to="/authority"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeRoute === "authority"
                  ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/20"
                  : "border border-gray-700/50 text-gray-400 hover:border-cyan-500/30 hover:text-cyan-300"
              }`}
            >
              <Shield className="size-4" />
              Authority Terminal
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
