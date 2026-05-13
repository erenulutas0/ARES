import { useState, useEffect } from "react";
import {
  AlertTriangle,
  MapPin,
  Users,
  Building2,
  Activity,
  Siren,
  TrendingUp,
  TrendingDown,
  Clock,
  Radio,
} from "lucide-react";
import { fetchAuthorityAlerts, type AresAuthorityAlert } from "../lib/api";

interface Building {
  id: string;
  name: string;
  location: string;
  occupancy: number;
  urgencyScore: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  lat: number;
  lng: number;
  status: "active" | "dispatched" | "resolved";
}

interface DataFeed {
  id: string;
  time: string;
  buildingId: string;
  message: string;
  type: "alert" | "update" | "dispatch";
}

export function AuthorityTerminal() {
  const [buildings, setBuildings] = useState<Building[]>([
    {
      id: "BLD-0847",
      name: "Residential Complex A",
      location: "District 3, Sector 12",
      occupancy: 47,
      urgencyScore: 87.5,
      priority: "CRITICAL",
      lat: 50,
      lng: 30,
      status: "active",
    },
    {
      id: "BLD-1203",
      name: "Office Tower B",
      location: "District 1, Sector 5",
      occupancy: 124,
      urgencyScore: 72.3,
      priority: "CRITICAL",
      lat: 35,
      lng: 45,
      status: "dispatched",
    },
    {
      id: "BLD-0589",
      name: "Medical Center C",
      location: "District 2, Sector 8",
      occupancy: 89,
      urgencyScore: 68.1,
      priority: "HIGH",
      lat: 65,
      lng: 55,
      status: "active",
    },
    {
      id: "BLD-2145",
      name: "School Building D",
      location: "District 4, Sector 15",
      occupancy: 156,
      urgencyScore: 54.2,
      priority: "HIGH",
      lat: 45,
      lng: 70,
      status: "active",
    },
    {
      id: "BLD-3421",
      name: "Shopping Mall E",
      location: "District 5, Sector 20",
      occupancy: 203,
      urgencyScore: 41.8,
      priority: "MEDIUM",
      lat: 70,
      lng: 35,
      status: "active",
    },
    {
      id: "BLD-5678",
      name: "Apartment Complex F",
      location: "District 6, Sector 22",
      occupancy: 78,
      urgencyScore: 38.5,
      priority: "MEDIUM",
      lat: 25,
      lng: 60,
      status: "active",
    },
    {
      id: "BLD-9012",
      name: "Hotel G",
      location: "District 7, Sector 28",
      occupancy: 95,
      urgencyScore: 29.3,
      priority: "LOW",
      lat: 55,
      lng: 25,
      status: "resolved",
    },
  ]);

  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([
    { id: "1", time: "14:35:22", buildingId: "BLD-0847", message: "Urgency score increased to 87.5", type: "alert" },
    { id: "2", time: "14:35:18", buildingId: "BLD-1203", message: "Response unit SAR-1 dispatched", type: "dispatch" },
    { id: "3", time: "14:35:10", buildingId: "BLD-0589", message: "Occupancy update: 89 persons detected", type: "update" },
    { id: "4", time: "14:34:55", buildingId: "BLD-2145", message: "Structural vulnerability assessment requested", type: "update" },
  ]);

  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [feedStatus, setFeedStatus] = useState<"LIVE" | "OFFLINE">("OFFLINE");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      // Simulate new data feed every 5 seconds
      if (Math.random() > 0.7) {
        const newFeed: DataFeed = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          buildingId: buildings[Math.floor(Math.random() * buildings.length)].id,
          message: [
            "Sensor data updated",
            "Occupancy count refreshed",
            "Network status confirmed",
            "Alert threshold checked",
          ][Math.floor(Math.random() * 4)],
          type: "update",
        };
        setDataFeeds((prev) => [newFeed, ...prev].slice(0, 8));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [buildings]);

  useEffect(() => {
    const mapAlert = (alert: AresAuthorityAlert, index: number): Building => ({
      id: alert.building_id,
      name: alert.type || "Monitored Building",
      location: alert.lat && alert.lon ? `${alert.lat.toFixed(4)}, ${alert.lon.toFixed(4)}` : "Central feed",
      occupancy: alert.occupancy || 0,
      urgencyScore: alert.urgency_score || 0,
      priority: alert.priority || "LOW",
      lat: 25 + (index * 11) % 55,
      lng: 25 + (index * 17) % 55,
      status: alert.priority === "CRITICAL" || alert.priority === "HIGH" ? "active" : "dispatched",
    });

    const loadLiveAlerts = async () => {
      try {
        const data = await fetchAuthorityAlerts();
        if (data.length > 0) {
          const mapped = data.map(mapAlert).sort((a, b) => b.urgencyScore - a.urgencyScore);
          setBuildings(mapped);
          setDataFeeds((current) => [
            {
              id: `api-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              buildingId: mapped[0].id,
              message: `Live central feed: ${mapped[0].priority} priority, score ${mapped[0].urgencyScore}`,
              type: mapped[0].priority === "CRITICAL" || mapped[0].priority === "HIGH" ? "alert" : "update",
            },
            ...current.slice(0, 7),
          ]);
        }
        setFeedStatus("LIVE");
      } catch {
        setFeedStatus("OFFLINE");
      }
    };

    loadLiveAlerts();
    const timer = setInterval(loadLiveAlerts, 2000);
    return () => clearInterval(timer);
  }, []);

  const criticalCount = buildings.filter((b) => b.priority === "CRITICAL").length;
  const highCount = buildings.filter((b) => b.priority === "HIGH").length;
  const mediumCount = buildings.filter((b) => b.priority === "MEDIUM").length;
  const lowCount = buildings.filter((b) => b.priority === "LOW").length;
  const totalOccupancy = buildings.reduce((sum, b) => sum + b.occupancy, 0);
  const activeAlerts = buildings.filter((b) => b.status === "active").length;

  const getMarkerColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500 border-red-400 shadow-red-500/50";
      case "HIGH":
        return "bg-orange-500 border-orange-400 shadow-orange-500/50";
      case "MEDIUM":
        return "bg-yellow-500 border-yellow-400 shadow-yellow-500/50";
      case "LOW":
        return "bg-green-500 border-green-400 shadow-green-500/50";
      default:
        return "bg-gray-500 border-gray-400 shadow-gray-500/50";
    }
  };

  return (
    <div className="size-full bg-[#0a0e1a] flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-cyan-900/30 bg-gradient-to-b from-[#0f1419] to-[#0a0e1a] p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-lg font-bold text-cyan-400 mb-1">AFAD Control</h2>
          <p className="text-xs text-gray-400">Emergency Response Center · {feedStatus}</p>
        </div>

        {/* Priority Definitions */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-3">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-cyan-400" />
            <span className="text-xs font-semibold text-gray-200">Priority Definitions</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-gray-300">Critical</span>
              </div>
              <span className="text-lg font-bold text-red-400">{criticalCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs text-gray-300">High</span>
              </div>
              <span className="text-lg font-bold text-orange-400">{highCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-yellow-500" />
                <span className="text-xs text-gray-300">Medium</span>
              </div>
              <span className="text-lg font-bold text-yellow-400">{mediumCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-300">Low</span>
              </div>
              <span className="text-lg font-bold text-green-400">{lowCount}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-4 text-cyan-400" />
            <span className="text-xs font-semibold text-gray-200">Key Metrics</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">Total Occupants at Risk</div>
              <div className="text-2xl font-bold text-cyan-400">{totalOccupancy}</div>
            </div>
            <div className="h-px bg-gray-700/50" />
            <div>
              <div className="text-xs text-gray-400 mb-1">Active Alerts</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-red-400">{activeAlerts}</div>
                <TrendingUp className="size-4 text-red-400" />
              </div>
            </div>
            <div className="h-px bg-gray-700/50" />
            <div>
              <div className="text-xs text-gray-400 mb-1">Buildings Monitored</div>
              <div className="text-2xl font-bold text-gray-300">{buildings.length}</div>
            </div>
          </div>
        </div>

        {/* Recent Priority Events */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-3 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="size-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-gray-200">Recent Priority Events</span>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            {buildings
              .filter((b) => b.priority === "CRITICAL" || b.priority === "HIGH")
              .slice(0, 5)
              .map((building) => (
                <div
                  key={building.id}
                  className="p-2 rounded bg-gray-800/50 border border-gray-700/50 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredBuilding(building.id)}
                  onMouseLeave={() => setHoveredBuilding(null)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-cyan-400">{building.id}</span>
                    <span
                      className={`text-xs font-bold ${
                        building.priority === "CRITICAL" ? "text-red-400" : "text-orange-400"
                      }`}
                    >
                      {building.urgencyScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mb-1">{building.name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="size-3" />
                    <span>{building.occupancy} persons</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Center - Map */}
      <div className="flex-1 flex flex-col p-4">
        {/* Map Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MapPin className="size-6 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">Real-time Threat Map</h1>
              <p className="text-xs text-gray-400">Istanbul Metropolitan Area</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-cyan-400">{currentTime.toLocaleTimeString()}</div>
            <div className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 border-2 border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-950 to-gray-900 relative overflow-hidden shadow-2xl shadow-cyan-500/10">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-30">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            />
          </div>

          {/* Diagonal Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <defs>
              <pattern id="diagonalLines" width="20" height="20" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="20" y2="20" stroke="#0ea5e9" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonalLines)" />
          </svg>

          {/* Building Markers */}
          {buildings.map((building) => (
            <div
              key={building.id}
              className="absolute group cursor-pointer z-10"
              style={{
                left: `${building.lng}%`,
                top: `${building.lat}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseEnter={() => setHoveredBuilding(building.id)}
              onMouseLeave={() => setHoveredBuilding(null)}
            >
              {/* Pulse Ring */}
              <div
                className={`absolute inset-0 rounded-full ${
                  building.priority === "CRITICAL" || building.priority === "HIGH" ? "animate-ping" : ""
                } ${getMarkerColor(building.priority)} opacity-75`}
                style={{
                  width: "40px",
                  height: "40px",
                  margin: "-12px",
                }}
              />

              {/* Marker */}
              <div
                className={`size-4 rounded-full border-2 ${getMarkerColor(
                  building.priority
                )} shadow-lg transition-all ${hoveredBuilding === building.id ? "scale-150" : "scale-100"}`}
              >
                {building.status === "dispatched" && (
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse" />
                )}
              </div>

              {/* Tooltip */}
              {hoveredBuilding === building.id && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-cyan-500 rounded-lg p-3 shadow-2xl backdrop-blur-sm whitespace-nowrap z-20">
                  <div className="font-mono text-xs text-cyan-400 mb-1">{building.id}</div>
                  <div className="text-sm font-bold text-gray-100 mb-1">{building.name}</div>
                  <div className="text-xs text-gray-400 mb-2">{building.location}</div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Urgency:</span>
                      <span
                        className={`ml-1 font-bold ${
                          building.priority === "CRITICAL"
                            ? "text-red-400"
                            : building.priority === "HIGH"
                            ? "text-orange-400"
                            : building.priority === "MEDIUM"
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {building.urgencyScore.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Occupancy:</span>
                      <span className="ml-1 text-cyan-400 font-mono">{building.occupancy}</span>
                    </div>
                  </div>
                  {building.status === "dispatched" && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <span className="text-xs text-blue-400 font-semibold">✓ Unit Dispatched</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Map Coordinates */}
          <div className="absolute bottom-4 left-4 text-xs font-mono text-gray-600">
            41.0082° N, 28.9784° E
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-cyan-900/30 bg-gradient-to-b from-[#0f1419] to-[#0a0e1a] p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Risk Overview Chart */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-cyan-400" />
            <span className="text-xs font-semibold text-gray-200">Risk Overview</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-red-400">Critical</span>
                <span className="text-red-400 font-mono">{criticalCount}/{buildings.length}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                  style={{ width: `${(criticalCount / buildings.length) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-orange-400">High</span>
                <span className="text-orange-400 font-mono">{highCount}/{buildings.length}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                  style={{ width: `${(highCount / buildings.length) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-yellow-400">Medium</span>
                <span className="text-yellow-400 font-mono">{mediumCount}/{buildings.length}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-500"
                  style={{ width: `${(mediumCount / buildings.length) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-green-400">Low</span>
                <span className="text-green-400 font-mono">{lowCount}/{buildings.length}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                  style={{ width: `${(lowCount / buildings.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Categories Pie Chart */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-4 text-cyan-400" />
            <span className="text-xs font-semibold text-gray-200">Risk Categories</span>
          </div>
          <div className="flex items-center justify-center py-4">
            <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="#1f2937"
                strokeWidth="20"
              />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="#ef4444"
                strokeWidth="20"
                strokeDasharray={`${(criticalCount / buildings.length) * 377} 377`}
                strokeDashoffset="0"
                className="transition-all duration-500"
              />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="#f97316"
                strokeWidth="20"
                strokeDasharray={`${(highCount / buildings.length) * 377} 377`}
                strokeDashoffset={`-${(criticalCount / buildings.length) * 377}`}
                className="transition-all duration-500"
              />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="#eab308"
                strokeWidth="20"
                strokeDasharray={`${(mediumCount / buildings.length) * 377} 377`}
                strokeDashoffset={`-${((criticalCount + highCount) / buildings.length) * 377}`}
                className="transition-all duration-500"
              />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="#22c55e"
                strokeWidth="20"
                strokeDasharray={`${(lowCount / buildings.length) * 377} 377`}
                strokeDashoffset={`-${((criticalCount + highCount + mediumCount) / buildings.length) * 377}`}
                className="transition-all duration-500"
              />
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-red-500" />
              <span className="text-gray-400">Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-orange-500" />
              <span className="text-gray-400">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-yellow-500" />
              <span className="text-gray-400">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-gray-400">Low</span>
            </div>
          </div>
        </div>

        {/* Active Alerts Count */}
        <div className="border border-red-500/30 rounded-lg bg-gradient-to-br from-red-900/20 to-red-800/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Siren className="size-4 text-red-400 animate-pulse" />
            <span className="text-xs font-semibold text-gray-200">Active Alerts</span>
          </div>
          <div className="text-4xl font-bold text-red-400">{activeAlerts}</div>
          <div className="text-xs text-gray-400 mt-1">Requires immediate action</div>
        </div>

        {/* Live Data Feed */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-3 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-cyan-400" />
            <span className="text-xs font-semibold text-gray-200">Live Data Feed</span>
            <div className="size-2 rounded-full bg-green-400 animate-pulse ml-auto" />
          </div>
          <div className="space-y-1 overflow-y-auto flex-1">
            {dataFeeds.map((feed) => (
              <div
                key={feed.id}
                className="text-xs font-mono p-2 rounded bg-gray-800/50 border border-gray-700/50 animate-fadeIn"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500">{feed.time}</span>
                  {feed.type === "alert" && <span className="text-red-400">⚠</span>}
                  {feed.type === "dispatch" && <span className="text-blue-400">→</span>}
                  {feed.type === "update" && <span className="text-cyan-400">•</span>}
                </div>
                <div className="text-cyan-400">{feed.buildingId}</div>
                <div className="text-gray-300">{feed.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
