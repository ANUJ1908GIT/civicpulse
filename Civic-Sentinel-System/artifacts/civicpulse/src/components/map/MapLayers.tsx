// src/components/map/MapLayers.tsx
// All Leaflet layer logic isolated here so main component stays clean
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
// @ts-ignore
import "leaflet.markercluster";
// @ts-ignore
import "leaflet.heat";
import type { MapReport, MapHotspot } from "./useMapData";
import { renderToStaticMarkup } from "react-dom/server";

// ── Severity config ──────────────────────────────────────────────────────────
const SEV = {
  critical: { color: "#ef4444", label: "CRITICAL" },
  high:     { color: "#f97316", label: "HIGH" },
  medium:   { color: "#eab308", label: "MEDIUM" },
  low:      { color: "#10b981", label: "LOW" },
};

const RISK = {
  critical: { color: "#ef4444" },
  high:     { color: "#f97316" },
  moderate: { color: "#eab308" },
  low:      { color: "#10b981" },
};

// ── Custom marker HTML ───────────────────────────────────────────────────────
function markerHtml(severity: string) {
  return `
    <div class="civic-marker-${severity}">
      <div class="civic-marker-inner">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    </div>`;
}

function hotspotHtml() {
  return `
    <div class="civic-marker-hotspot">
      <div class="civic-marker-inner">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
      </div>
    </div>`;
}

function makeIcon(severity: string) {
  return L.divIcon({
    html: markerHtml(severity),
    className: `civic-marker civic-marker-${severity}`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
  });
}

function makeHotspotIcon() {
  return L.divIcon({
    html: hotspotHtml(),
    className: "civic-marker civic-marker-hotspot",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
  });
}

// ── Popup HTML ───────────────────────────────────────────────────────────────
function reportPopupHtml(r: MapReport): string {
  const sev = SEV[r.severity] ?? SEV.medium;
  const statusDot = r.status === "resolved" ? "#10b981" : r.status === "in_progress" ? "#f59e0b" : "#60a5fa";
  const date = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `
    <div style="padding:14px 16px;min-width:240px;max-width:300px;font-family:monospace">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span style="font-size:9px;font-weight:700;letter-spacing:0.08em;padding:2px 8px;border-radius:999px;
          color:${sev.color};background:${sev.color}18;border:1px solid ${sev.color}40">
          ${sev.label}
        </span>
        <span style="font-size:9px;color:#64748b;margin-left:auto">#${r.id}</span>
      </div>
      <div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:6px;line-height:1.4">${r.title}</div>
      <div style="font-size:11px;color:#94a3b8;line-height:1.5;margin-bottom:10px">
        ${r.description.slice(0, 100)}${r.description.length > 100 ? "…" : ""}
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;border-top:1px solid rgba(255,255,255,0.07);padding-top:10px">
        ${r.neighborhood ? `<div style="font-size:10px;color:#64748b">📍 ${r.neighborhood}</div>` : ""}
        ${r.category ? `<div style="font-size:10px;color:#64748b">🏷 ${r.category}</div>` : ""}
        ${r.priorityScore != null ? `<div style="font-size:10px;color:#64748b">⚡ Priority: <span style="color:#0ea5e9;font-weight:700">${Math.round(r.priorityScore)}</span></div>` : ""}
        <div style="font-size:10px;color:#64748b;display:flex;align-items:center;gap:5px">
          <span style="width:7px;height:7px;border-radius:50%;background:${statusDot};display:inline-block"></span>
          ${r.status.replace("_", " ").toUpperCase()} · ${date}
        </div>
      </div>
      <a href="/track/${r.id}" style="display:block;margin-top:10px;text-align:center;padding:7px;
        background:rgba(14,165,233,0.12);border:1px solid rgba(14,165,233,0.3);border-radius:8px;
        color:#0ea5e9;font-size:10px;font-weight:700;letter-spacing:0.06em;text-decoration:none">
        VIEW FULL REPORT →
      </a>
    </div>`;
}

function hotspotPopupHtml(h: MapHotspot): string {
  const riskColor = RISK[h.riskLevel as keyof typeof RISK]?.color ?? "#eab308";
  return `
    <div style="padding:14px 16px;min-width:220px;font-family:monospace">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:9px;font-weight:700;letter-spacing:0.08em;padding:2px 8px;border-radius:999px;
          color:${riskColor};background:${riskColor}18;border:1px solid ${riskColor}40">
          ${h.riskLevel.toUpperCase()} RISK
        </span>
      </div>
      <div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:8px">${h.neighborhood}</div>
      <div style="display:flex;gap:12px;margin-bottom:8px">
        <div style="text-align:center">
          <div style="font-size:18px;font-weight:700;color:${riskColor}">${h.reportCount}</div>
          <div style="font-size:9px;color:#64748b">REPORTS</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:18px;font-weight:700;color:#a78bfa">${Math.round(h.confidence * 100)}%</div>
          <div style="font-size:9px;color:#64748b">CONFIDENCE</div>
        </div>
      </div>
      ${h.predictedIssues.length > 0 ? `
        <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:8px">
          <div style="font-size:9px;color:#64748b;margin-bottom:4px;letter-spacing:0.06em">PREDICTED ISSUES</div>
          ${h.predictedIssues.slice(0, 3).map(i =>
            `<div style="font-size:10px;color:#94a3b8;margin-bottom:2px">· ${i}</div>`
          ).join("")}
        </div>` : ""}
    </div>`;
}

// ── Heatmap Layer Component ──────────────────────────────────────────────────
export function HeatmapLayer({ data, visible }: { data: [number, number, number][]; visible: boolean }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
      return;
    }
    if (data.length === 0) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    // @ts-ignore
    layerRef.current = L.heatLayer(data, {
      radius: 35, blur: 25, maxZoom: 14, max: 1.0,
      gradient: { 0.0: "#0ea5e9", 0.3: "#8b5cf6", 0.6: "#f97316", 1.0: "#ef4444" },
    }).addTo(map);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [data, visible, map]);

  return null;
}

// ── Clustered Report Markers ─────────────────────────────────────────────────
export function ReportMarkers({
  reports, visible, onSelect,
}: {
  reports: MapReport[];
  visible: boolean;
  onSelect: (id: number) => void;
}) {
  const map = useMap();
  const groupRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (groupRef.current) { map.removeLayer(groupRef.current); groupRef.current = null; }
    if (!visible || reports.length === 0) return;

    // @ts-ignore
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (c: L.MarkerCluster) => {
        const count = c.getChildCount();
        const size = count < 10 ? "small" : count < 30 ? "medium" : "large";
        return L.divIcon({ html: `<div><span>${count}</span></div>`, className: `marker-cluster marker-cluster-${size}`, iconSize: L.point(40, 40) });
      },
    });

    reports.forEach(r => {
      const marker = L.marker([r.lat, r.lng], { icon: makeIcon(r.severity) });
      marker.bindPopup(reportPopupHtml(r), { maxWidth: 320, className: "civic-popup" });
      marker.on("click", () => onSelect(r.id));
      cluster.addLayer(marker);
    });

    cluster.addTo(map);
    groupRef.current = cluster;
    return () => { if (groupRef.current) map.removeLayer(groupRef.current); };
  }, [reports, visible, map, onSelect]);

  return null;
}

// ── Hotspot Markers ──────────────────────────────────────────────────────────
export function HotspotMarkers({ hotspots, visible }: { hotspots: MapHotspot[]; visible: boolean }) {
  const map = useMap();
  const groupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (groupRef.current) { map.removeLayer(groupRef.current); groupRef.current = null; }
    if (!visible || hotspots.length === 0) return;

    const group = L.layerGroup();
    hotspots.forEach(h => {
      const marker = L.marker([h.lat, h.lng], { icon: makeHotspotIcon() });
      marker.bindPopup(hotspotPopupHtml(h), { maxWidth: 300, className: "civic-popup" });
      // Circle overlay
      L.circle([h.lat, h.lng], {
        radius: 400,
        color: RISK[h.riskLevel as keyof typeof RISK]?.color ?? "#eab308",
        fillOpacity: 0.07,
        weight: 1,
        dashArray: "4 4",
      }).addTo(group);
      marker.addTo(group);
    });

    group.addTo(map);
    groupRef.current = group;
    return () => { if (groupRef.current) map.removeLayer(groupRef.current); };
  }, [hotspots, visible, map]);

  return null;
}

// ── Fly-to helper ────────────────────────────────────────────────────────────
export function FlyTo({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.flyTo([lat, lng], 15, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}
