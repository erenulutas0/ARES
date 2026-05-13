export interface AresBuilding {
  building_id: string;
  type?: string;
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  urgency_score?: number;
  score_confidence?: number;
  score_breakdown?: {
    occupancy?: number;
    hazards?: number;
    vulnerability?: number;
  };
  occupancy?: number;
  vulnerability?: number;
  building_age?: number;
  structural_type?: string;
  floors?: number;
  adjacency_type?: string;
  soil_risk?: string;
  seismic_hazard?: string;
  smoke_detected?: boolean;
  gas_detected?: boolean;
  temperature?: number;
  local_alarm_level?: "NORMAL" | "WARNING" | "CRITICAL";
  local_alarm_reasons?: string[];
  local_alarm_action?: string;
  lat?: number;
  lon?: number;
  last_update?: string;
}

export interface AresAuthorityAlert {
  building_id: string;
  type?: string;
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  urgency_score?: number;
  score_confidence?: number;
  score_breakdown?: {
    occupancy?: number;
    hazards?: number;
    vulnerability?: number;
  };
  occupancy?: number;
  vulnerability?: number;
  smoke_detected?: boolean;
  gas_detected?: boolean;
  local_alarm_level?: "NORMAL" | "WARNING" | "CRITICAL";
  local_alarm_reasons?: string[];
  authority_unit?: string;
  recommended_action?: string;
  lat?: number;
  lon?: number;
  last_update?: string;
}

export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_ARES_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { protocol, hostname, port, origin } = window.location;
    if (port === "5173") return `${protocol}//${hostname}:8000`;
    return origin;
  }

  return "http://127.0.0.1:8000";
}

export async function fetchBuildings(): Promise<AresBuilding[]> {
  const response = await fetch(`${getApiBaseUrl()}/buildings`);
  if (!response.ok) throw new Error(`Buildings request failed: ${response.status}`);
  return response.json();
}

export async function fetchAuthorityAlerts(): Promise<AresAuthorityAlert[]> {
  const response = await fetch(`${getApiBaseUrl()}/authority/alerts`);
  if (!response.ok) throw new Error(`Authority request failed: ${response.status}`);
  return response.json();
}

export function percent(value?: number) {
  return Math.round(Math.max(0, Math.min(1, Number(value || 0))) * 100);
}

export function niceValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "Unknown";
  return String(value).replaceAll("_", " ");
}
