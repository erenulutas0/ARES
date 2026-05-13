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
  Brain,
  Cpu,
  Database,
  Radio,
  Zap,
} from "lucide-react";
import { fetchBuildings, percent, type AresBuilding } from "../lib/api";

interface Building {
  id: string;
  name: string;
  location: string;
  occupancy: number;
  urgencyScore: number;
  occupancyRisk: number;
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
  priority: "high" | "medium" | "low";
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
      vulnerability: 42.5,
      status: "critical",
      lat: 50,
      lng: 30,
    },
    {
      id: "BLD-1203",
      name: "Office Tower B",
      location: "District 1, Sector 5",
      occupancy: 124,
      urgencyScore: 72.3,
      occupancyRisk: 58,
      vulnerability: 14.3,
      status: "high",
      lat: 35,
      lng: 45,
    },
    {
      id: "BLD-0589",
      name: "Medical Center C",
      location: "District 2, Sector 8",
      occupancy: 89,
      urgencyScore: 68.1,
      occupancyRisk: 41,
      vulnerability: 27.1,
      status: "high",
      lat: 65,
      lng: 55,
    },
    {
      id: "BLD-2145",
      name: "School Building D",
      location: "District 4, Sector 15",
      occupancy: 156,
      urgencyScore: 54.2,
      occupancyRisk: 48,
      vulnerability: 6.2,
      status: "medium",
      lat: 45,
      lng: 70,
    },
    {
      id: "BLD-3421",
      name: "Shopping Mall E",
      location: "District 5, Sector 20",
      occupancy: 203,
      urgencyScore: 41.8,
      occupancyRisk: 39,
      vulnerability: 2.8,
      status: "low",
      lat: 70,
      lng: 35,
    },
  ]);

  const [eventLog, setEventLog] = useState<EventLog[]>([
    {
      id: "1",
      time: "14:35:22",
      type: "alert",
      message: "BLD-0847: Urgency score increased to 87.5 (CRITICAL)",
      priority: "high",
    },
    {
      id: "2",
      time: "14:35:18",
      type: "update",
      message: "BLD-1203: Occupancy update - 124 persons detected",
      priority: "medium",
    },
    {
      id: "3",
      time: "14:35:10",
      type: "system",
      message: "All edge hubs responding - System health: OK",
      priority: "low",
    },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [processingLoad, setProcessingLoad] = useState(67);
  const [apiStatus, setApiStatus] = useState<"ONLINE" | "OFFLINE">("OFFLINE");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setProcessingLoad(60 + Math.floor(Math.random() * 20));

      // Simulate new event
      if (Math.random() > 0.8) {
        const newEvent: EventLog = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          type: ["alert", "update", "system"][Math.floor(Math.random() * 3)] as any,
          message: `${buildings[Math.floor(Math.random() * buildings.length)].id}: Status update`,
          priority: ["high", "medium", "low"][Math.floor(Math.random() * 3)] as any,
        };
        setEventLog((prev) => [newEvent, ...prev].slice(0, 10));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [buildings]);

  useEffect(() => {
    const mapBuilding = (building: AresBuilding, index: number): Building => {
      const priority = (building.priority || "LOW").toLowerCase() as Building["status"];
      return {
        id: building.building_id,
        name: building.type || "Monitored Building",
        location: building.lat && building.lon ? `${building.lat.toFixed(4)}, ${building.lon.toFixed(4)}` : "Demo Zone",
        occupancy: building.occupancy || 0,
        urgencyScore: building.urgency_score || 0,
        occupancyRisk: Math.round(building.score_breakdown?.occupancy || 0),
        vulnerability: percent(building.vulnerability),
        status: priority,
        lat: 25 + (index * 11) % 55,
        lng: 25 + (index * 17) % 55,
      };
    };

    const loadLiveBuildings = async () => {
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
              message: `Live backend update: ${mapped.length} building(s), top score ${mapped[0].urgencyScore}`,
              priority: mapped[0].status === "critical" || mapped[0].status === "high" ? "high" : "medium",
            },
            ...current.slice(0, 9),
          ]);
        }
        setApiStatus("ONLINE");
      } catch {
        setApiStatus("OFFLINE");
      }
    };

    loadLiveBuildings();
    const timer = setInterval(loadLiveBuildings, 2000);
    return () => clearInterval(timer);
  }, []);

  const totalOccupants = buildings.reduce((sum, b) => sum + b.occupancy, 0);
  const criticalBuildings = buildings.filter((b) => b.status === "critical").length;
  const highestVulnerability = Math.max(...buildings.map((b) => b.vulnerability));
  const avgUrgencyScore = buildings.reduce((sum, b) => sum + b.urgencyScore, 0) / buildings.length;

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

  return (
    <div className="size-full bg-[#0a0e1a] flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-cyan-900/30 bg-gradient-to-b from-[#0f1419] to-[#0a0e1a] p-4 flex flex-col gap-4 overflow-y-auto">
        {/* System Overview */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">System Overview</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">Edge Hubs Connected</div>
              <div className="text-3xl font-bold text-cyan-400">{buildings.length}</div>
            </div>
            <div className="h-px bg-gray-700/50" />
            <div>
              <div className="text-xs text-gray-400 mb-1">Total Occupants</div>
              <div className="text-3xl font-bold text-cyan-400">{totalOccupants}</div>
            </div>
            <div className="h-px bg-gray-700/50" />
            <div>
              <div className="text-xs text-gray-400 mb-1">Avg Urgency Score</div>
              <div className="text-3xl font-bold text-orange-400">{avgUrgencyScore.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* AI Processing Status */}
        <div className="border border-purple-500/30 rounded-lg bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="size-5 text-purple-400" />
            <span className="text-sm font-semibold text-gray-200">AI Processing</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">Risk Analysis</span>
                <span className="text-purple-400 font-mono">{processingLoad}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${processingLoad}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-gray-400">Models Active</div>
                <div className="text-lg font-bold text-purple-400">3</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-gray-400">Predictions/s</div>
                <div className="text-lg font-bold text-purple-400">248</div>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="border border-red-500/30 rounded-lg bg-gradient-to-br from-red-900/20 to-red-800/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="size-5 text-red-400 animate-pulse" />
            <span className="text-sm font-semibold text-gray-200">Critical Buildings</span>
          </div>
          <div className="text-4xl font-bold text-red-400 mb-2">{criticalBuildings}</div>
          <div className="text-xs text-gray-400">Requires immediate attention</div>
        </div>

        {/* Network Stats */}
        <div className="border border-green-500/30 rounded-lg bg-gradient-to-br from-green-900/20 to-green-800/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wifi className="size-5 text-green-400" />
              <span className="text-sm font-semibold text-gray-200">Network</span>
            </div>
            <div className="size-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
                <span className={`${apiStatus === "ONLINE" ? "text-green-400" : "text-red-400"} font-mono`}>{apiStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Latency</span>
              <span className="text-cyan-400 font-mono">14ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Throughput</span>
              <span className="text-cyan-400 font-mono">1.2 GB/s</span>
            </div>
          </div>
        </div>

        {/* Data Pipeline */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4 flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Database className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">Data Pipeline</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
              <span className="text-xs text-gray-400">Edge Ingestion</span>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-mono">ACTIVE</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
              <span className="text-xs text-gray-400">Processing Queue</span>
              <span className="text-xs text-cyan-400 font-mono">24 items</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
              <span className="text-xs text-gray-400">Authority Sync</span>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-mono">SYNCED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-1">Central Coordination</h1>
            <p className="text-sm text-gray-400">AI-Powered Command Center</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-cyan-400">{currentTime.toLocaleTimeString()}</div>
            <div className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* AI Brain Visualization */}
          <div className="col-span-2 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="size-5 text-cyan-400" />
                <span className="text-sm font-semibold text-gray-200">AI Coordination Engine</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50">
                <Activity className="size-3 text-purple-400 animate-pulse" />
                <span className="text-xs text-purple-400 font-mono">PROCESSING</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Neural Network Visualization */}
              <div className="col-span-1 border border-purple-500/20 rounded-lg bg-gray-950 p-6 flex items-center justify-center relative overflow-hidden">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-20">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: "linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                </div>

                {/* Brain/Neural Network Visual */}
                <div className="relative z-10 flex flex-col items-center">
                  {/* Center Brain */}
                  <div className="relative mb-8">
                    <div className="size-24 border-2 border-purple-400 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center relative">
                      <Brain className="size-12 text-purple-400" />
                      {/* Pulse rings */}
                      <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-75" />
                      <div className="absolute inset-0 rounded-full border border-purple-400 animate-pulse" />
                    </div>
                  </div>

                  {/* Connected Nodes */}
                  <div className="grid grid-cols-3 gap-8">
                    <div className="flex flex-col items-center">
                      <div className="size-8 rounded-full border-2 border-cyan-400 bg-cyan-500/20 flex items-center justify-center">
                        <Server className="size-4 text-cyan-400" />
                      </div>
                      <div className="text-xs text-cyan-400 mt-1">Edge</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="size-8 rounded-full border-2 border-green-400 bg-green-500/20 flex items-center justify-center">
                        <Zap className="size-4 text-green-400" />
                      </div>
                      <div className="text-xs text-green-400 mt-1">Process</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="size-8 rounded-full border-2 border-blue-400 bg-blue-500/20 flex items-center justify-center">
                        <Radio className="size-4 text-blue-400" />
                      </div>
                      <div className="text-xs text-blue-400 mt-1">Sync</div>
                    </div>
                  </div>

                  <div className="text-xs text-purple-400 font-mono mt-6">REAL-TIME ANALYSIS</div>
                </div>
              </div>

              {/* City Map */}
              <div className="col-span-2 border border-cyan-500/20 rounded-lg bg-gray-950 overflow-hidden relative">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-30">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: "linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />
                </div>

                {/* Map Label */}
                <div className="absolute top-4 left-4 bg-gray-900/90 border border-cyan-500/50 px-3 py-1.5 rounded backdrop-blur-sm">
                  <span className="text-xs text-cyan-400 font-mono">Istanbul - Real-time Threat Map</span>
                </div>

                {/* Building Markers */}
                {buildings.map((building, index) => (
                  <div
                    key={building.id}
                    className="absolute group cursor-pointer z-10"
                    style={{
                      left: `${building.lng}%`,
                      top: `${building.lat}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {/* Pulse Ring for Critical/High */}
                    {(building.status === "critical" || building.status === "high") && (
                      <div
                        className={`absolute inset-0 rounded-full ${getStatusColor(building.status)} opacity-75 animate-ping`}
                        style={{
                          width: "30px",
                          height: "30px",
                          margin: "-9px",
                        }}
                      />
                    )}

                    {/* Marker */}
                    <div className={`size-3 rounded-full ${getStatusColor(building.status)} shadow-lg border-2 border-white/20`} />
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
          </div>

          {/* Key Metrics Cards */}
          <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-5 text-cyan-400" />
              <span className="text-sm font-semibold text-gray-200">Total Occupants at Risk</span>
            </div>
            <div className="text-5xl font-bold text-cyan-400 mb-2">{totalOccupants}</div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <TrendingUp className="size-3 text-red-400" />
              <span>Across all monitored buildings</span>
            </div>
          </div>

          <div className="border border-orange-500/30 rounded-lg bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="size-5 text-orange-400" />
              <span className="text-sm font-semibold text-gray-200">Highest Vulnerability</span>
            </div>
            <div className="text-5xl font-bold text-orange-400 mb-2">{highestVulnerability.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">Building structural risk score</div>
          </div>
        </div>

        {/* Priority Buildings List */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">Priority Buildings by Urgency Score</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {buildings
              .sort((a, b) => b.urgencyScore - a.urgencyScore)
              .map((building) => (
                <div
                  key={building.id}
                  className={`border rounded-lg p-3 ${
                    building.status === "critical"
                      ? "border-red-500/50 bg-red-500/5"
                      : building.status === "high"
                      ? "border-orange-500/50 bg-orange-500/5"
                      : building.status === "medium"
                      ? "border-yellow-500/50 bg-yellow-500/5"
                      : "border-green-500/50 bg-green-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono text-xs text-cyan-400">{building.id}</div>
                      <div className="text-sm font-semibold text-gray-200">{building.name}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${
                          building.status === "critical"
                            ? "text-red-400"
                            : building.status === "high"
                            ? "text-orange-400"
                            : building.status === "medium"
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {building.urgencyScore.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-400">Occupancy</div>
                      <div className="text-gray-200 font-mono">{building.occupancy}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Occ. Risk</div>
                      <div className="text-cyan-400 font-mono">{building.occupancyRisk}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Vuln.</div>
                      <div className="text-orange-400 font-mono">{building.vulnerability}%</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-cyan-900/30 bg-gradient-to-b from-[#0f1419] to-[#0a0e1a] p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Real-time Event Log */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">Real-time Event Log</span>
            <div className="size-2 rounded-full bg-green-400 animate-pulse ml-auto" />
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            {eventLog.map((event) => (
              <div
                key={event.id}
                className="text-xs font-mono p-2 rounded bg-gray-800/50 border border-gray-700/50 animate-fadeIn"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500">{event.time}</span>
                  {event.type === "alert" && <span className="text-red-400">⚠</span>}
                  {event.type === "update" && <span className="text-cyan-400">•</span>}
                  {event.type === "system" && <span className="text-green-400">✓</span>}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      event.priority === "high"
                        ? "bg-red-500/20 text-red-400"
                        : event.priority === "medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {event.priority.toUpperCase()}
                  </span>
                </div>
                <div className="text-gray-300">{event.message}</div>
              </div>
            ))}
          </div>
        </div>

        {/* System Performance */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">System Performance</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">CPU Usage</span>
                <span className="text-cyan-400 font-mono">45%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[45%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">Memory</span>
                <span className="text-cyan-400 font-mono">72%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[72%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">Network Load</span>
                <span className="text-cyan-400 font-mono">38%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[38%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
