import { useState, useEffect } from "react";
import {
  Camera,
  Users,
  Flame,
  Wind,
  AlertTriangle,
  CheckCircle,
  Wifi,
  Clock,
  ArrowUp,
  ArrowDown,
  Building2,
} from "lucide-react";
import { fetchBuildings, niceValue, percent, type AresBuilding } from "../lib/api";

interface OccupancyEvent {
  id: string;
  type: "entry" | "exit";
  time: string;
  count: number;
}

export function EdgeHubDashboard() {
  const [occupancy, setOccupancy] = useState(47);
  const [building, setBuilding] = useState<AresBuilding | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"CONNECTED" | "OFFLINE">("OFFLINE");
  const [events, setEvents] = useState<OccupancyEvent[]>([
    { id: "1", type: "entry", time: "14:32:18", count: 2 },
    { id: "2", type: "exit", time: "14:31:45", count: 1 },
    { id: "3", type: "entry", time: "14:30:22", count: 3 },
    { id: "4", type: "exit", time: "14:29:10", count: 2 },
  ]);

  const [alarmStatus, setAlarmStatus] = useState<"NORMAL" | "WARNING" | "CRITICAL">("NORMAL");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let previousOccupancy: number | null = null;

    const loadEdgeState = async () => {
      try {
        const buildings = await fetchBuildings();
        const selected = buildings.find((item) => item.building_id === "DEMO-001") || buildings[0];
        if (!selected) return;

        setBuilding(selected);
        setConnectionStatus("CONNECTED");
        setAlarmStatus(selected.local_alarm_level || "NORMAL");
        setOccupancy(selected.occupancy || 0);

        if (previousOccupancy !== null && previousOccupancy !== selected.occupancy) {
          const delta = (selected.occupancy || 0) - previousOccupancy;
          if (delta !== 0) {
            setEvents((current) => [
              {
                id: `${selected.building_id}-${Date.now()}`,
                type: delta > 0 ? "entry" : "exit",
                time: new Date().toLocaleTimeString(),
                count: Math.abs(delta),
              },
              ...current.slice(0, 5),
            ]);
          }
        }
        previousOccupancy = selected.occupancy || 0;
      } catch {
        setConnectionStatus("OFFLINE");
      }
    };

    loadEdgeState();
    const timer = setInterval(loadEdgeState, 2000);
    return () => clearInterval(timer);
  }, []);

  const getAlarmColor = () => {
    if (alarmStatus === "CRITICAL") return "border-red-500 bg-red-500/10 shadow-red-500/20";
    if (alarmStatus === "WARNING") return "border-yellow-500 bg-yellow-500/10 shadow-yellow-500/20";
    return "border-green-500 bg-green-500/10 shadow-green-500/20";
  };

  const getAlarmTextColor = () => {
    if (alarmStatus === "CRITICAL") return "text-red-400";
    if (alarmStatus === "WARNING") return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="size-full bg-[#0a0e1a] p-6 overflow-auto">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-1">Edge Hub Dashboard</h1>
            <p className="text-gray-400 text-sm">Building ID: {building?.building_id || "DEMO-001"} • Local Edge Device</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-cyan-400">{currentTime.toLocaleTimeString()}</div>
            <div className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Camera Feed - Large */}
          <div className="col-span-7 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="size-5 text-cyan-400" />
                <span className="text-sm font-semibold text-gray-200">Entrance Camera Feed</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50">
                <div className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs text-cyan-400 font-mono">LIVE</span>
              </div>
            </div>

            {/* Mock Camera View */}
            <div className="relative aspect-video bg-gray-950 rounded-lg border border-gray-700/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/50" />

              {/* Mock scene */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-600 text-sm">ENTRANCE MONITORING</div>
              </div>

              {/* Bounding boxes */}
              <div className="absolute top-[20%] left-[15%] w-[15%] h-[40%] border-2 border-cyan-400 rounded">
                <div className="absolute -top-6 left-0 bg-cyan-400 text-gray-900 px-2 py-0.5 rounded text-xs font-mono">
                  PERSON
                </div>
              </div>
              <div className="absolute top-[25%] right-[20%] w-[18%] h-[45%] border-2 border-cyan-400 rounded">
                <div className="absolute -top-6 left-0 bg-cyan-400 text-gray-900 px-2 py-0.5 rounded text-xs font-mono">
                  PERSON
                </div>
              </div>

              {/* Anonymous badge */}
              <div className="absolute top-4 left-4 bg-gray-900/90 border border-cyan-500/50 px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-cyan-400" />
                  <span className="text-xs text-gray-300">Anonymous Detection</span>
                  <CheckCircle className="size-4 text-green-400" />
                </div>
              </div>

              {/* Technical overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-gray-500 font-mono">
                <span>RES: 1920x1080 • FPS: 30</span>
                <span>CAM-01</span>
              </div>
            </div>
          </div>

          {/* Right Column - Occupancy & Status */}
          <div className="col-span-5 space-y-4">
            {/* Current Occupancy */}
            <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-5 text-cyan-400" />
                <span className="text-sm font-semibold text-gray-200">Current Occupancy</span>
              </div>
              <div className="text-5xl font-bold text-cyan-400 mb-2">{occupancy}</div>
              <div className="text-xs text-gray-400">Persons in building</div>
            </div>

            {/* Alarm Status */}
            <div className={`border rounded-lg p-4 shadow-lg ${getAlarmColor()}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`size-5 ${getAlarmTextColor()}`} />
                <span className="text-sm font-semibold text-gray-200">Local Edge Alarm</span>
              </div>
              <div className={`text-3xl font-bold ${getAlarmTextColor()}`}>{alarmStatus}</div>
            </div>

            {/* Network Status */}
            <div className="border border-green-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-green-500/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wifi className="size-5 text-green-400" />
                  <span className="text-sm font-semibold text-gray-200">Network Status</span>
                </div>
                <div className="size-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Central Server</span>
                  <span className={`${connectionStatus === "CONNECTED" ? "text-green-400" : "text-red-400"} font-mono`}>{connectionStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Latency</span>
                  <span className="text-green-400 font-mono">HTTP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Sync</span>
                  <span className="text-gray-300 font-mono">{building?.last_update ? "live" : "--"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Event Stream */}
          <div className="col-span-5 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="size-5 text-cyan-400" />
              <span className="text-sm font-semibold text-gray-200">Entry & Exit Events</span>
            </div>
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded bg-gray-800/50 border border-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    {event.type === "entry" ? (
                      <ArrowUp className="size-4 text-green-400" />
                    ) : (
                      <ArrowDown className="size-4 text-orange-400" />
                    )}
                    <span className="text-xs text-gray-400 font-mono">{event.time}</span>
                    <span className="text-xs text-gray-300">
                      {event.type === "entry" ? "Entry" : "Exit"}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">{event.count} person(s)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sensor Status */}
          <div className="col-span-7 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="mb-3">
              <span className="text-sm font-semibold text-gray-200">Sensor Status</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Fire Sensor */}
              <div className="border border-green-500/30 rounded-lg bg-gray-800/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="size-5 text-orange-400" />
                  <span className="text-sm text-gray-200">Fire Sensor</span>
                </div>
                <div className={`text-xl font-bold ${building?.smoke_detected ? "text-red-400" : "text-green-400"}`}>{building?.smoke_detected ? "SMOKE" : "NORMAL"}</div>
                <div className="text-xs text-gray-400 mt-1">Last check: 5s ago</div>
              </div>

              {/* Gas Sensor */}
              <div className="border border-green-500/30 rounded-lg bg-gray-800/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="size-5 text-blue-400" />
                  <span className="text-sm text-gray-200">Gas Sensor</span>
                </div>
                <div className={`text-xl font-bold ${building?.gas_detected ? "text-red-400" : "text-green-400"}`}>{building?.gas_detected ? "GAS ALERT" : "NORMAL"}</div>
                <div className="text-xs text-gray-400 mt-1">Last check: 3s ago</div>
              </div>
            </div>
          </div>

          {/* Building Profile */}
          <div className="col-span-12 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="size-5 text-cyan-400" />
              <span className="text-sm font-semibold text-gray-200">Building Profile Summary</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Building Age</div>
                <div className="text-lg font-semibold text-gray-200">{building?.building_age ?? "--"} years</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Structure Type</div>
                <div className="text-lg font-semibold text-gray-200 capitalize">{niceValue(building?.structural_type)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Floors</div>
                <div className="text-lg font-semibold text-gray-200">{building?.floors ?? "--"} floors</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Adjacency Type</div>
                <div className="text-lg font-semibold text-gray-200 capitalize">{niceValue(building?.adjacency_type)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Soil Risk</div>
                <div className="text-lg font-semibold text-yellow-400 capitalize">{niceValue(building?.soil_risk)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Seismic Hazard</div>
                <div className="text-lg font-semibold text-orange-400 capitalize">{niceValue(building?.seismic_hazard)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Max Capacity</div>
                <div className="text-lg font-semibold text-gray-200">120 persons</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Building Status</div>
                <div className="text-lg font-semibold text-green-400">{building ? `${percent(building.vulnerability)}% Vulnerability` : "Waiting"}</div>
              </div>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="col-span-12 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4 shadow-lg shadow-cyan-500/5">
            <div className="mb-3">
              <span className="text-sm font-semibold text-gray-200">Recent Messages to Central Server</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-xs font-mono p-2 rounded bg-gray-800/50 border border-gray-700/50">
                <span className="text-gray-500">14:32:20</span>
                <span className="text-cyan-400">→</span>
                <span className="text-gray-300">Occupancy update: {occupancy} persons • Fire: {building?.smoke_detected ? "ALERT" : "NORMAL"} • Gas: {building?.gas_detected ? "ALERT" : "NORMAL"}</span>
              </div>
              <div className="flex items-start gap-3 text-xs font-mono p-2 rounded bg-gray-800/50 border border-gray-700/50">
                <span className="text-gray-500">14:31:15</span>
                <span className="text-cyan-400">→</span>
                <span className="text-gray-300">Heartbeat • System health: OK • Network latency: 12ms</span>
              </div>
              <div className="flex items-start gap-3 text-xs font-mono p-2 rounded bg-gray-800/50 border border-gray-700/50">
                <span className="text-gray-500">14:30:00</span>
                <span className="text-cyan-400">→</span>
                <span className="text-gray-300">Occupancy update: 46 persons • All sensors nominal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
