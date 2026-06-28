// src/components/map/useMapData.ts
import { useListReports, useGetHotspots } from "@workspace/api-client-react";
import { useMemo } from "react";

export type MapReport = {
  id: number;
  title: string;
  description: string;
  lat: number;
  lng: number;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  category: string | null;
  neighborhood: string | null;
  priorityScore: number | null;
  createdAt: string;
};

export type MapHotspot = {
  id: number;
  neighborhood: string;
  lat: number;
  lng: number;
  riskLevel: string;
  reportCount: number;
  confidence: number;
  predictedIssues: string[];
};

// Fallback: generate plausible coords near a city center
// when real lat/lng is missing (common for demo data)
const CITY_CENTER = { lat: 28.6139, lng: 77.209 }; // Delhi default
function jitter(base: number, spread = 0.08) {
  return base + (Math.random() - 0.5) * spread;
}

let _seed = 1;
function seededJitter(id: number, base: number, spread = 0.1) {
  const s = Math.sin(id * 9301 + 49297) * 0.5 + 0.5;
  return base + (s - 0.5) * spread;
}

export function useMapData(severityFilter: string, categoryFilter: string) {
  const { data: rawReports, isLoading: reportsLoading, refetch: refetchReports } =
    useListReports({ limit: 200 });

  const { data: rawHotspots, isLoading: hotspotsLoading, refetch: refetchHotspots } =
    useGetHotspots();

  const reports: MapReport[] = useMemo(() => {
    const arr = Array.isArray(rawReports) ? rawReports : [];
    return arr
      .filter(r => severityFilter === "all" || r.severity === severityFilter)
      .filter(r => categoryFilter === "all" || r.category === categoryFilter)
      .map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        lat: r.latitude ?? seededJitter(r.id, CITY_CENTER.lat, 0.18),
        lng: r.longitude ?? seededJitter(r.id * 7, CITY_CENTER.lng, 0.18),
        severity: (r.severity as MapReport["severity"]) ?? "medium",
        status: r.status,
        category: r.category ?? null,
        neighborhood: r.neighborhood ?? null,
        priorityScore: r.priorityScore ?? null,
        createdAt: r.createdAt,
      }));
  }, [rawReports, severityFilter, categoryFilter]);

  const hotspots: MapHotspot[] = useMemo(() => {
    const arr = Array.isArray(rawHotspots) ? rawHotspots : [];
    return arr
      .filter(h => h.latitude != null && h.longitude != null)
      .map(h => ({
        id: h.id,
        neighborhood: h.neighborhood,
        lat: h.latitude!,
        lng: h.longitude!,
        riskLevel: h.riskLevel,
        reportCount: h.reportCount ?? 0,
        confidence: h.confidence,
        predictedIssues: h.predictedIssues ?? [],
      }));
  }, [rawHotspots]);

  // Heatmap data: [lat, lng, intensity]
  const heatmapData = useMemo(() =>
    reports.map(r => [
      r.lat, r.lng,
      r.severity === "critical" ? 1.0 :
      r.severity === "high"     ? 0.7 :
      r.severity === "medium"   ? 0.4 : 0.2,
    ] as [number, number, number]),
    [reports]
  );

  const categories = useMemo(() => {
    const arr = Array.isArray(rawReports) ? rawReports : [];
    return ["all", ...Array.from(new Set(arr.map(r => r.category).filter(Boolean)))] as string[];
  }, [rawReports]);

  return {
    reports,
    hotspots,
    heatmapData,
    categories,
    isLoading: reportsLoading || hotspotsLoading,
    refetch: () => { refetchReports(); refetchHotspots(); },
  };
}
