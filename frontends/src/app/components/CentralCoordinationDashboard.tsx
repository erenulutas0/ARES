import { useState, useEffect } from "react";
import {
  MapPin,
  AlertCircle,
  Users,
  Building2,
  Activity,
  Server,
  Wifi,
  Clock,
  TrendingUp,
  Flame,
  Wind,
} from "lucide-react";
import { fetchBuildings, percent, type AresBuilding } from "../lib/api";

interface Building {
  id: string;
  name: string;
  location: string;
  occupancy: number;
  urgencyScore: number;
  occupancyRisk: number;
  fireHazard: number;
  gasHazard: number;
  vulnerability: number;
  status: "critical" | "high" | "medium" | "low";
  lat: number;
  lng: number;
}

interface EventLog {
  id: string;
  time: string;
  type: "alert" | "update" | "system";
  message: string;
}

export function CentralCoordinationDashboard() {
  const [buildings, setBuildings] = useState<Building[]>([
    {
      id: "BLD-0847",
      name: "Residential Complex A",
      location: "District 3, Sector 12",
      occupancy: 47,
      urgencyScore: 87.5,
      occupancyRisk: 45,
      fireHazard: 0,
      gasHazard: 0,
      vulnerability: 42.5,
      status: "critical",
      lat: 41.015 + Math.random() * 0.02,
      lng: 28.979 + Math.random() * 0.02,
    },
    {
      id: "BLD-1203",
      name: "Office Tower B",
      location: "District 1, Sector 5",
      occupancy: 124,
      urgencyScore: 72.3,
      occupancyRisk: 58,
      fireHazard: 0,
      gasHazard: 0,
      vulnerability: 14.3,
      status: "high",
      lat: 41.015 + Math.random() * 0.02,
      lng: 28.979 + Math.random() * 0.02,
    },
    {
      id: "BLD-0589",
      name: "Medical Center C",
      location: "District 2, Sector 8",
      occupancy: 89,
      urgencyScore: 68.1,
      occupancyRisk: 41,
      fireHazard: 0,
      gasHazard: 0,
      vulnerability: 27.1,
      status: "high",
      lat: 41.015 + Math.random() * 0.02,
      lng: 28.979 + Math.random() * 0.02,
    },
    {
      id: "BLD-2145",
      name: "School Building D",
      location: "District 4, Sector 15",
      occupancy: 156,
      urgencyScore: 54.2,
      occupancyRisk: 48,
      fireHazard: 0,
      gasHazard: 0,
      vulnerability: 6.2,
      status: "medium",
      lat: 41.015 + Math.random() * 0.02,
      lng: 28.979 + Math.random() * 0.02,
    },
    {
      id: "BLD-3421",
      name: "Shopping Mall E",
      location: "District 5, Sector 20",
      occupancy: 203,
      urgencyScore: 41.8,
      occupancyRisk: 39,
      fireHazard: 0,
      gasHazard: 0,
      vulnerability: 2.8,
      status: "low",
      lat: 41.015 + Math.random() * 0.02,
      lng: 28.979 + Math.random() * 0.02,
    },
  ]);

  const [eventLog, setEventLog] = useState<EventLog[]>([
    {
      id: "1",
      time: "14:32:45",
      type: "alert",
      message: "BLD-0847: Urgency score increased to 87.5 (CRITICAL)",
    },
    {
      id: "2",
      time: "14:32:20",
      type: "update",
      message: "BLD-0847: Occupancy update received - 47 persons",
    },
    {
      id: "3",
      time: "14:31:58",
      type: "update",
      message: "BLD-1203: All sensors nominal - 124 persons present",
    },
    {
      id: "4",
      time: "14:31:15",
      type: "system",
      message: "System health check: All edge hubs responding",
    },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState<"ONLINE" | "OFFLINE">("OFFLINE");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const mapBuilding = (building: AresBuilding): Building => {
      const priority = (building.priority || "LOW").toLowerCase() as Building["status"];
      return {
        id: building.building_id,
        name: building.type || "Monitored Building",
        location: `${(building.lat || 0).toFixed(4)}, ${(building.lon || 0).toFixed(4)}`,
        occupancy: building.occupancy || 0,
        urgencyScore: building.urgency_score || 0,
        occupancyRisk: Math.round(building.score_breakdown?.occupancy || 0),
        fireHazard: building.smoke_detected ? 50 : 0,
        gasHazard: building.gas_detected ? 100 : 0,
        vulnerability: percent(building.vulnerability),
        status: priority,
        lat: building.lat || 0,
        lng: building.lon || 0,
      };
    };

    const loadBuildings = async () => {
      try {
        const data = await fetchBuildings();
        if (data.length > 0) {
          const mapped = data.map(mapBuilding).sort((a, b) => b.urgencyScore - a.urgencyScore);
          setBuildings(mapped);
          setEventLog((current) => [
            {
              id: `api-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              type: "update",
              message: `Central feed updated: ${mapped.length} building(s), top priority ${mapped[0].id} score ${mapped[0].urgencyScore}`,
            },
            ...current.slice(0, 5),
          ]);
        }
        setApiStatus("ONLINE");
      } catch {
        setApiStatus("OFFLINE");
      }
    };

    loadBuildings();
    const timer = setInterval(loadBuildings, 2000);
    return () => clearInterval(timer);
  }, []);

  const totalOccupants = buildings.reduce((sum, b) => sum + b.occupancy, 0);
  const criticalBuildings = buildings.filter((b) => b.status === "critical").length;
  const highestVulnerability = Math.max(...buildings.map((b) => b.vulnerability));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "critical":
        return "border-red-500/50";
      case "high":
        return "border-orange-500/50";
      case "medium":
        return "border-yellow-500/50";
      case "low":
        return "border-green-500/50";
      default:
        return "border-gray-500/50";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "critical":
        return "text-red-400";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="size-full bg-[#0a0e1a] p-6 overflow-auto">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-1">Central Coordination</h1>
            <p className="text-gray-400 text-sm">Command Center • Real-time Monitoring & Analysis</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-cyan-400">{currentTime.toLocaleTimeString()}</div>
            <div className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-5 text-cyan-400" />
              <span className="text-xs text-gray-400">Total Occupants</span>
            </div>
            <div className="text-3xl font-bold text-cyan-400">{totalOccupants}</div>
            <div className="text-xs text-gray-500 mt-1">Across all monitored buildings</div>
          </div>

          <div className="border border-red-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-red-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="size-5 text-red-400" />
              <span className="text-xs text-gray-400">Critical Buildings</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{criticalBuildings}</div>
            <div className="text-xs text-gray-500 mt-1">Requires immediate attention</div>
          </div>

          <div className="border border-orange-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-orange-500/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-5 text-orange-400" />
              <span className="text-xs text-gray-400">Highest Vulnerability</span>
            </div>
            <div className="text-3xl font-bold text-orange-400">{highestVulnerability.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Building structural risk</div>
          </div>

          <div className="border border-green-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-green-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="size-5 text-green-400" />
              <span className="text-xs text-gray-400">System Status</span>
            </div>
            <div className={`text-2xl font-bold ${apiStatus === "ONLINE" ? "text-green-400" : "text-red-400"}`}>{apiStatus}</div>
            <div className="text-xs text-gray-500 mt-1">All systems operational</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* City Map */}
          <div className="col-span-7 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="size-5 text-cyan-400" />
              <span className="text-sm font-semibold text-gray-200">City Map - Building Risk Overview</span>
            </div>

            {/* Mock Map */}
            <div className="relative aspect-video bg-gray-950 rounded-lg border border-gray-700/50 overflow-hidden">
              {/* Grid background */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full" style={{
                  backgroundImage: 'linear-gradient(to right, #1e3a8a 1px, transparent 1px), linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
              </div>

              {/* City label */}
              <div className="absolute top-4 left-4 bg-gray-900/90 border border-cyan-500/50 px-3 py-1.5 rounded backdrop-blur-sm">
                <span className="text-xs text-cyan-400 font-mono">Istanbul Metropolitan Area</span>
              </div>

              {/* Building markers */}
              {buildings.map((building, index) => (
                <div
                  key={building.id}
                  className="absolute group cursor-pointer"
                  style={{
                    left: `${20 + (index * 15)}%`,
                    top: `${30 + (index % 2) * 20}%`,
                  }}
                >
                  <div className={`size-4 rounded-full ${getStatusColor(building.status)} shadow-lg animate-pulse`} />
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-cyan-500/50 px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs text-gray-200 font-semibold">{building.id}</div>
                    <div className="text-xs text-gray-400">{building.name}</div>
                    <div className={`text-xs font-bold ${getStatusTextColor(building.status)}`}>
                      Score: {building.urgencyScore}
                    </div>
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-gray-900/90 border border-cyan-500/50 px-3 py-2 rounded backdrop-blur-sm">
                <div className="text-xs text-gray-400 mb-2">Risk Level</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-300">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-orange-500" />
                    <span className="text-xs text-gray-300">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-yellow-500" />
                    <span className="text-xs text-gray-300">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-300">Low</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Buildings List */}
          <div className="col-span-5 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="size-5 text-cyan-400" />
              <span className="text-sm font-semibold text-gray-200">Priority Buildings</span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {buildings
                .sort((a, b) => b.urgencyScore - a.urgencyScore)
                .map((building) => (
                  <div
                    key={building.id}
                    className={`border ${getStatusBorderColor(building.status)} rounded-lg bg-gray-800/30 p-3`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-mono text-xs text-cyan-400">{building.id}</div>
                        <div className="text-sm font-semibold text-gray-200">{building.name}</div>
                        <div className="text-xs text-gray-400">{building.location}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getStatusTextColor(building.status)}`}>
                          {building.urgencyScore.toFixed(1)}
                        </div>
                        <div className={`text-xs uppercase font-semibold ${getStatusTextColor(building.status)}`}>
                          {building.status}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Occupancy:</span>
                        <span className="text-gray-200 font-mono">{building.occupancy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Occ. Risk:</span>
                        <span className="text-cyan-400 font-mono">{building.occupancyRisk}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Vulnerability:</span>
                        <span className="text-orange-400 font-mono">{building.vulnerability}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Hazards:</span>
                        <span className={`${building.fireHazard || building.gasHazard ? "text-red-400" : "text-green-400"} font-mono`}>
                          {building.gasHazard ? "Gas" : building.fireHazard ? "Smoke" : "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Data Pipeline Status */}
          <div className="col-span-7 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Server className="size-5 text-cyan-400" />
              <span className="text-sm font-semibold text-gray-200">Data Pipeline Status</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="inline-block border border-green-500/50 rounded-lg bg-green-500/10 px-4 py-3">
                  <Building2 className="size-6 text-green-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-300">Edge Hubs</div>
                  <div className="text-lg font-bold text-green-400">{buildings.length}</div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-16 bg-gradient-to-r from-green-400 to-cyan-400" />
                  <Wifi className="size-5 text-cyan-400 animate-pulse" />
                  <div className="h-0.5 w-16 bg-gradient-to-r from-cyan-400 to-blue-400" />
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block border border-cyan-500/50 rounded-lg bg-cyan-500/10 px-4 py-3">
                  <Server className="size-6 text-cyan-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-300">Central Server</div>
                  <div className="text-lg font-bold text-cyan-400">ACTIVE</div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-16 bg-gradient-to-r from-blue-400 to-purple-400" />
                  <Wifi className="size-5 text-purple-400 animate-pulse" />
                  <div className="h-0.5 w-16 bg-gradient-to-r from-purple-400 to-pink-400" />
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block border border-purple-500/50 rounded-lg bg-purple-500/10 px-4 py-3">
                  <AlertCircle className="size-6 text-purple-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-300">Authority</div>
                  <div className="text-lg font-bold text-purple-400">SYNCED</div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">API Status:</span>
                <span className={`${apiStatus === "ONLINE" ? "text-green-400" : "text-red-400"} font-mono`}>{apiStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Latency:</span>
                <span className="text-cyan-400 font-mono">14ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Update:</span>
                <span className="text-gray-300 font-mono">1s ago</span>
              </div>
            </div>
          </div>

          {/* Real-time Event Log */}
          <div className="col-span-5 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="size-5 text-cyan-400" />
              <span className="text-sm font-semibold text-gray-200">Real-time Event Log</span>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {eventLog.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 text-xs font-mono p-2 rounded bg-gray-800/50 border border-gray-700/50"
                >
                  <span className="text-gray-500 shrink-0">{event.time}</span>
                  <div className="flex-1">
                    {event.type === "alert" && <span className="text-red-400">[ALERT] </span>}
                    {event.type === "update" && <span className="text-cyan-400">[UPDATE] </span>}
                    {event.type === "system" && <span className="text-green-400">[SYSTEM] </span>}
                    <span className="text-gray-300">{event.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
