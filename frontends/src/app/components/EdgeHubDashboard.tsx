import { useState, useEffect } from "react";
import {
  Camera,
  Users,
  Flame,
  Wind,
  AlertTriangle,
  Wifi,
  Server,
  Activity,
  Radio,
  Shield,
  TrendingUp,
  Zap,
  Thermometer,
  Droplets,
} from "lucide-react";
import { fetchBuildings, type AresBuilding } from "../lib/api";

interface SensorData {
  id: string;
  name: string;
  type: "fire" | "gas" | "temperature" | "humidity" | "motion";
  status: "normal" | "warning" | "critical";
  value: string;
  lastUpdate: string;
  icon: any;
}

export function EdgeHubDashboard() {
  const [occupancy, setOccupancy] = useState(47);
  const [maxCapacity] = useState(120);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [networkLatency, setNetworkLatency] = useState(12);
  const [building, setBuilding] = useState<AresBuilding | null>(null);
  const [centralConnected, setCentralConnected] = useState(false);

  const [sensors, setSensors] = useState<SensorData[]>([
    {
      id: "FIRE-01",
      name: "Fire Detector",
      type: "fire",
      status: "normal",
      value: "No Smoke",
      lastUpdate: "2s ago",
      icon: Flame,
    },
    {
      id: "GAS-01",
      name: "Gas Sensor",
      type: "gas",
      status: "normal",
      value: "0 ppm",
      lastUpdate: "3s ago",
      icon: Wind,
    },
    {
      id: "TEMP-01",
      name: "Temperature",
      type: "temperature",
      status: "normal",
      value: "22°C",
      lastUpdate: "1s ago",
      icon: Thermometer,
    },
    {
      id: "HUM-01",
      name: "Humidity",
      type: "humidity",
      status: "normal",
      value: "45%",
      lastUpdate: "4s ago",
      icon: Droplets,
    },
    {
      id: "MOT-01",
      name: "Motion Sensor",
      type: "motion",
      status: "normal",
      value: "Active",
      lastUpdate: "1s ago",
      icon: Activity,
    },
  ]);

  const [entryEvents, setEntryEvents] = useState([
    { time: "14:32:18", type: "entry", count: 2 },
    { time: "14:31:45", type: "exit", count: 1 },
    { time: "14:30:22", type: "entry", count: 3 },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setNetworkLatency(10 + Math.floor(Math.random() * 10));

      // Simulate occupancy changes
      if (Math.random() > 0.95) {
        const change = Math.random() > 0.5 ? 1 : -1;
        setOccupancy((prev) => Math.max(0, Math.min(maxCapacity, prev + change)));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [maxCapacity]);

  useEffect(() => {
    const loadLiveBuilding = async () => {
      try {
        const buildings = await fetchBuildings();
        const selected = buildings.find((item) => item.building_id === "DEMO-001") || buildings[0];
        if (!selected) return;

        setBuilding(selected);
        setCentralConnected(true);
        setOccupancy(selected.occupancy || 0);
        setSensors((current) =>
          current.map((sensor) => {
            if (sensor.type === "fire") {
              return {
                ...sensor,
                status: selected.smoke_detected ? "critical" : "normal",
                value: selected.smoke_detected ? "Smoke Detected" : "No Smoke",
                lastUpdate: "live",
              };
            }
            if (sensor.type === "gas") {
              return {
                ...sensor,
                status: selected.gas_detected ? "critical" : "normal",
                value: selected.gas_detected ? "Gas Alert" : "0 ppm",
                lastUpdate: "live",
              };
            }
            if (sensor.type === "temperature") {
              return {
                ...sensor,
                value: `${Number(selected.temperature ?? 22).toFixed(1)}°C`,
                lastUpdate: "live",
              };
            }
            return sensor;
          })
        );
      } catch {
        setCentralConnected(false);
      }
    };

    loadLiveBuilding();
    const timer = setInterval(loadLiveBuilding, 2000);
    return () => clearInterval(timer);
  }, []);

  const occupancyPercentage = (occupancy / maxCapacity) * 100;
  const getOccupancyColor = () => {
    if (occupancyPercentage > 80) return "text-red-400";
    if (occupancyPercentage > 60) return "text-yellow-400";
    return "text-green-400";
  };

  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "border-red-500 bg-red-500/10";
      case "warning":
        return "border-yellow-500 bg-yellow-500/10";
      default:
        return "border-green-500 bg-green-500/10";
    }
  };

  const getSensorStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-yellow-500 text-gray-900";
      default:
        return "bg-green-500 text-white";
    }
  };

  return (
    <div className="size-full bg-[#0a0e1a] flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-cyan-900/30 bg-gradient-to-b from-[#0f1419] to-[#0a0e1a] p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Building Info */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">Building Profile</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Building ID</span>
              <span className="text-cyan-400 font-mono">{building?.building_id || "DEMO-001"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Type</span>
              <span className="text-gray-200">{building?.type || "Demo Building"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Floors</span>
              <span className="text-gray-200">{building?.floors ?? "8"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Age</span>
              <span className="text-gray-200">{building?.building_age ?? "18"} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Structure</span>
              <span className="text-gray-200">{(building?.structural_type || "RC Frame").replaceAll("_", " ")}</span>
            </div>
          </div>
        </div>

        {/* Seismic Info */}
        <div className="border border-orange-500/30 rounded-lg bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-5 text-orange-400" />
            <span className="text-sm font-semibold text-gray-200">Seismic Profile</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Seismic Hazard</span>
              <span className="text-orange-400 font-semibold">{(building?.seismic_hazard || "HIGH").toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Soil Risk</span>
              <span className="text-yellow-400 font-semibold">{(building?.soil_risk || "MEDIUM").toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Adjacency</span>
              <span className="text-gray-200">{(building?.adjacency_type || "Adjacent").replaceAll("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Risk Score</span>
              <span className="text-red-400 font-bold text-lg">{Math.round((building?.vulnerability || 0.425) * 100)}</span>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="border border-green-500/30 rounded-lg bg-gradient-to-br from-green-900/20 to-green-800/10 p-4">
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
              <span className={`${centralConnected ? "text-green-400" : "text-red-400"} font-mono`}>
                {centralConnected ? "CONNECTED" : "OFFLINE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Latency</span>
              <span className="text-cyan-400 font-mono">{networkLatency}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Uptime</span>
              <span className="text-gray-200 font-mono">99.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Sync</span>
              <span className="text-gray-200 font-mono">2s ago</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">System Health</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">CPU Usage</span>
                <span className="text-cyan-400 font-mono">24%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[24%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">Memory</span>
                <span className="text-cyan-400 font-mono">58%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[58%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">Storage</span>
                <span className="text-cyan-400 font-mono">41%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[41%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Entry/Exit Log */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">Entry/Exit Events</span>
          </div>
          <div className="space-y-2">
            {entryEvents.map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-gray-800/50 border border-gray-700/50 text-xs">
                <span className="text-gray-500 font-mono">{event.time}</span>
                <span className={event.type === "entry" ? "text-green-400" : "text-orange-400"}>
                  {event.type === "entry" ? "↑ Entry" : "↓ Exit"}
                </span>
                <span className="text-cyan-400 font-mono">{event.count}p</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-1">Edge Hub Dashboard</h1>
            <p className="text-sm text-gray-400">Building-Level Monitoring System</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-cyan-400">{currentTime.toLocaleTimeString()}</div>
            <div className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Camera Feed with Device Illustration */}
          <div className="col-span-2 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="size-5 text-cyan-400" />
                <span className="text-sm font-semibold text-gray-200">Entrance Camera & Device Status</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50">
                <div className="size-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-mono">LIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Device Illustration */}
              <div className="col-span-1 border border-cyan-500/20 rounded-lg bg-gray-950 p-4 flex items-center justify-center relative overflow-hidden">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-20">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: "linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                </div>

                {/* Edge Device Visual */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="relative">
                    {/* Main Device */}
                    <div className="w-32 h-24 border-2 border-cyan-400 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 relative">
                      {/* Device Details */}
                      <div className="absolute inset-2 border border-cyan-400/50 rounded" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Server className="size-8 text-cyan-400" />
                      </div>
                      {/* Status LED */}
                      <div className="absolute top-2 right-2 size-2 rounded-full bg-green-400 animate-pulse" />
                    </div>

                    {/* Antenna */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-cyan-400" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 size-2 rounded-full bg-cyan-400 animate-pulse" />
                  </div>

                  {/* Connection Lines */}
                  <div className="flex gap-8">
                    <div className="flex flex-col items-center">
                      <Camera className="size-6 text-green-400" />
                      <div className="text-xs text-green-400 mt-1">CAM</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <Flame className="size-6 text-green-400" />
                      <div className="text-xs text-green-400 mt-1">FIRE</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <Wind className="size-6 text-green-400" />
                      <div className="text-xs text-green-400 mt-1">GAS</div>
                    </div>
                  </div>

                  <div className="text-xs text-cyan-400 font-mono">A-RES EDGE HUB</div>
                </div>
              </div>

              {/* Camera Feed */}
              <div className="col-span-2 border border-gray-700/50 rounded-lg bg-gray-950 overflow-hidden relative aspect-video">
                {/* Mock Camera View */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
                  <div className="text-gray-600 text-sm">ENTRANCE MONITORING</div>
                </div>

                {/* Bounding Boxes */}
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

                {/* Camera Info Overlay */}
                <div className="absolute top-2 left-2 bg-gray-900/90 border border-cyan-500/50 px-3 py-1.5 rounded backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-cyan-400" />
                    <span className="text-xs text-gray-300">Anonymous Detection Active</span>
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-gray-500 font-mono">
                  <span>CAM-01 • 1920x1080 @ 30fps</span>
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Occupancy Card */}
          <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="size-5 text-cyan-400" />
              <span className="text-sm font-semibold text-gray-200">Current Occupancy</span>
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div className={`text-6xl font-bold ${getOccupancyColor()}`}>{occupancy}</div>
              <div className="text-gray-400 pb-2">
                <div className="text-sm">/ {maxCapacity}</div>
                <div className="text-xs">max capacity</div>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-gray-400">Capacity</span>
                <span className={`font-mono ${getOccupancyColor()}`}>{occupancyPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    occupancyPercentage > 80
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : occupancyPercentage > 60
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-r from-green-500 to-green-600"
                  }`}
                  style={{ width: `${occupancyPercentage}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {occupancyPercentage > 80 ? "⚠ High occupancy level" : "✓ Normal occupancy level"}
            </div>
          </div>

          {/* Local Alarm Status */}
          <div className="border border-green-500/30 rounded-lg bg-gradient-to-br from-green-900/20 to-green-800/10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="size-5 text-green-400" />
              <span className="text-sm font-semibold text-gray-200">Local Edge Alarm</span>
            </div>
            <div className="text-5xl font-bold text-green-400 mb-2">NORMAL</div>
            <div className="text-xs text-gray-400">All systems operational</div>
            <div className="mt-4 flex items-center gap-2">
              <div className="size-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-mono">System Status: OK</span>
            </div>
          </div>
        </div>

        {/* Sensors Grid */}
        <div className="border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">Sensor Network Status</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {sensors.map((sensor) => {
              const Icon = sensor.icon;
              return (
                <div
                  key={sensor.id}
                  className={`border rounded-lg p-3 ${getSensorStatusColor(sensor.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`size-5 ${
                      sensor.status === "critical" ? "text-red-400" :
                      sensor.status === "warning" ? "text-yellow-400" :
                      "text-green-400"
                    }`} />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getSensorStatusBadge(sensor.status)}`}>
                      {sensor.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{sensor.name}</div>
                  <div className="text-sm font-mono text-gray-200 mb-1">{sensor.value}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-mono">{sensor.id}</span>
                    <span className="text-gray-500">{sensor.lastUpdate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
