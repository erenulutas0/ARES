import { useState, useEffect } from "react";
import {
  AlertTriangle,
  MapPin,
  Users,
  Flame,
  Wind,
  Wrench,
  Siren,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { fetchAuthorityAlerts, type AresAuthorityAlert } from "../lib/api";

interface EmergencyAlert {
  id: string;
  buildingId: string;
  buildingName: string;
  location: string;
  occupancy: number;
  urgencyScore: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommendedAction: string;
  responseUnit: string;
  responseIcon: "fire" | "rescue" | "gas" | "structural";
  status: "pending" | "dispatched" | "resolved";
}

export function AuthorityTerminal() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([
    {
      id: "ALR-001",
      buildingId: "BLD-0847",
      buildingName: "Residential Complex A",
      location: "District 3, Sector 12",
      occupancy: 47,
      urgencyScore: 87.5,
      priority: "CRITICAL",
      recommendedAction: "Search and Rescue + Municipal Structural Assessment",
      responseUnit: "SAR-3, STRUCT-1",
      responseIcon: "rescue",
      status: "pending",
    },
    {
      id: "ALR-002",
      buildingId: "BLD-1203",
      buildingName: "Office Tower B",
      location: "District 1, Sector 5",
      occupancy: 124,
      urgencyScore: 72.3,
      priority: "HIGH",
      recommendedAction: "Search and Rescue",
      responseUnit: "SAR-1",
      responseIcon: "rescue",
      status: "dispatched",
    },
    {
      id: "ALR-003",
      buildingId: "BLD-0589",
      buildingName: "Medical Center C",
      location: "District 2, Sector 8",
      occupancy: 89,
      urgencyScore: 68.1,
      priority: "HIGH",
      recommendedAction: "Municipal Structural Assessment",
      responseUnit: "STRUCT-2",
      responseIcon: "structural",
      status: "pending",
    },
    {
      id: "ALR-004",
      buildingId: "BLD-2145",
      buildingName: "School Building D",
      location: "District 4, Sector 15",
      occupancy: 156,
      urgencyScore: 54.2,
      priority: "MEDIUM",
      recommendedAction: "Municipal Structural Assessment",
      responseUnit: "STRUCT-3",
      responseIcon: "structural",
      status: "pending",
    },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [feedStatus, setFeedStatus] = useState<"OPERATIONAL" | "OFFLINE">("OFFLINE");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const iconForAlert = (alert: AresAuthorityAlert): EmergencyAlert["responseIcon"] => {
      if (alert.gas_detected) return "gas";
      if (alert.smoke_detected) return "fire";
      if ((alert.authority_unit || "").toLowerCase().includes("structural")) return "structural";
      return "rescue";
    };

    const mapAlert = (alert: AresAuthorityAlert, index: number): EmergencyAlert => ({
      id: `ALR-${String(index + 1).padStart(3, "0")}`,
      buildingId: alert.building_id,
      buildingName: alert.type || "Monitored Building",
      location: alert.lat && alert.lon ? `${alert.lat.toFixed(4)}, ${alert.lon.toFixed(4)}` : "Central feed location",
      occupancy: alert.occupancy || 0,
      urgencyScore: alert.urgency_score || 0,
      priority: alert.priority || "LOW",
      recommendedAction: alert.recommended_action || "Continue monitoring.",
      responseUnit: alert.authority_unit || "Monitoring Desk",
      responseIcon: iconForAlert(alert),
      status: (alert.priority === "CRITICAL" || alert.priority === "HIGH") ? "pending" : "dispatched",
    });

    const loadAlerts = async () => {
      try {
        const data = await fetchAuthorityAlerts();
        if (data.length > 0) {
          setAlerts(data.map(mapAlert));
        }
        setLastRefresh(new Date());
        setFeedStatus("OPERATIONAL");
      } catch {
        setFeedStatus("OFFLINE");
      }
    };

    loadAlerts();
    const timer = setInterval(loadAlerts, 2000);
    return () => clearInterval(timer);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500/20 border-red-500 text-red-400";
      case "HIGH":
        return "bg-orange-500/20 border-orange-500 text-orange-400";
      case "MEDIUM":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
      case "LOW":
        return "bg-green-500/20 border-green-500 text-green-400";
      default:
        return "bg-gray-500/20 border-gray-500 text-gray-400";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500 text-white";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-gray-900";
      case "LOW":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getResponseIcon = (icon: string) => {
    switch (icon) {
      case "fire":
        return <Flame className="size-5" />;
      case "gas":
        return <Wind className="size-5" />;
      case "structural":
        return <Wrench className="size-5" />;
      case "rescue":
        return <Siren className="size-5" />;
      default:
        return <AlertTriangle className="size-5" />;
    }
  };

  const pendingAlerts = alerts.filter((a) => a.status === "pending").length;
  const dispatchedAlerts = alerts.filter((a) => a.status === "dispatched").length;

  return (
    <div className="size-full bg-[#0a0e1a] p-6 overflow-auto">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 mb-2">AFAD Emergency Response Terminal</h1>
              <p className="text-gray-400">Live Feed from A-RES Central Coordination</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono text-cyan-400 mb-1">{currentTime.toLocaleTimeString()}</div>
              <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
                <RefreshCw className="size-3" />
                <span>Last refresh: {Math.floor((currentTime.getTime() - lastRefresh.getTime()) / 1000)}s ago</span>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-cyan-500/50 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">System Status</div>
                  <div className={`text-2xl font-bold ${feedStatus === "OPERATIONAL" ? "text-green-400" : "text-red-400"}`}>{feedStatus}</div>
                </div>
                <CheckCircle className="size-8 text-green-400" />
              </div>
            </div>
            <div className="border border-orange-500/50 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Pending Alerts</div>
                  <div className="text-2xl font-bold text-orange-400">{pendingAlerts}</div>
                </div>
                <AlertTriangle className="size-8 text-orange-400" />
              </div>
            </div>
            <div className="border border-blue-500/50 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Dispatched Units</div>
                  <div className="text-2xl font-bold text-blue-400">{dispatchedAlerts}</div>
                </div>
                <Siren className="size-8 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Alerts */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="size-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-gray-200">Prioritized Emergency Alerts</h2>
          </div>

          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-2 rounded-lg p-5 ${getPriorityColor(alert.priority)} transition-all hover:shadow-xl`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityBadgeColor(alert.priority)}`}>
                      {alert.priority}
                    </span>
                    <span className="font-mono text-sm text-cyan-400">{alert.id}</span>
                    {alert.status === "dispatched" && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/30 border border-blue-500 text-xs text-blue-300">
                        DISPATCHED
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-1">{alert.buildingName}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-4" />
                      <span>{alert.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Building ID:</span>
                      <span className="font-mono text-cyan-400">{alert.buildingId}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Urgency Score</div>
                  <div className="text-5xl font-bold text-white">{alert.urgencyScore.toFixed(1)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-700/50">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Occupancy</div>
                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-gray-300" />
                    <span className="text-xl font-bold text-gray-100">{alert.occupancy}</span>
                    <span className="text-sm text-gray-400">persons</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 mb-1">Recommended Action</div>
                  <div className="flex items-center gap-2">
                    {getResponseIcon(alert.responseIcon)}
                    <span className="text-base font-semibold text-gray-100">{alert.recommendedAction}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Assigned Response Unit</div>
                  <div className="font-mono text-base font-semibold text-cyan-400">{alert.responseUnit}</div>
                </div>
                {alert.status === "pending" && (
                  <button
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/20"
                    onClick={() => {
                      setAlerts(
                        alerts.map((a) =>
                          a.id === alert.id ? { ...a, status: "dispatched" as const } : a
                        )
                      );
                    }}
                  >
                    Dispatch Unit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Map Preview */}
        <div className="mt-6 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="size-5 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">Alert Locations Overview</span>
          </div>
          <div className="relative h-48 bg-gray-950 rounded-lg border border-gray-700/50 overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full" style={{
                backgroundImage: 'linear-gradient(to right, #1e3a8a 1px, transparent 1px), linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} />
            </div>

            {/* Alert markers */}
            {alerts.map((alert, index) => (
              <div
                key={alert.id}
                className="absolute group"
                style={{
                  left: `${15 + (index * 20)}%`,
                  top: `${40 + (index % 2) * 15}%`,
                }}
              >
                <div
                  className={`size-3 rounded-full ${
                    alert.priority === "CRITICAL"
                      ? "bg-red-500"
                      : alert.priority === "HIGH"
                      ? "bg-orange-500"
                      : alert.priority === "MEDIUM"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  } animate-pulse shadow-lg`}
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-cyan-500/50 px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                  <div className="text-gray-200 font-semibold">{alert.buildingId}</div>
                  <div className={`font-bold ${
                    alert.priority === "CRITICAL"
                      ? "text-red-400"
                      : alert.priority === "HIGH"
                      ? "text-orange-400"
                      : alert.priority === "MEDIUM"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}>
                    {alert.priority}
                  </div>
                </div>
              </div>
            ))}

            <div className="absolute top-2 left-2 bg-gray-900/90 border border-cyan-500/50 px-2 py-1 rounded backdrop-blur-sm text-xs text-cyan-400 font-mono">
              Istanbul Region
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
