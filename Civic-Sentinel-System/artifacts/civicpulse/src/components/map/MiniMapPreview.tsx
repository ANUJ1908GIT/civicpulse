// src/components/map/MiniMapPreview.tsx
// Lightweight read-only map preview for dashboard.
// Reuses useMapData + MapLayers — zero data logic duplication.

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./map.css";

import { MapContainer, TileLayer } from "react-leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Radio, Maximize2, MapPin, AlertTriangle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useMapData } from "./useMapData";
import { HeatmapLayer, HotspotMarkers } from "./MapLayers";
import * as L from "leaflet";
// @ts-ignore
import "leaflet.markercluster";

// ── Constants ─────────────────────────────────────────────────────────────────
const DARK_TILE   = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILE  = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const CITY_CENTER: [number, number] = [28.6139, 77.209];
const MINI_ZOOM   = 11;
const MAX_MARKERS = 25;

const SEV_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#10b981",
};

// ── Disable all map interactions ──────────────────────────────────────────────
function DisableInteractions() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    map.dragging.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
    // Remove tap handler if present
    if ((map as any).tap) (map as any).tap.disable();
  }, [map]);
  return null;
}

// ── Lightweight marker layer (no heavy clustering for mini view) ───────────────
function MiniReportMarkers({ reports }: { reports: Array<{ id: number; lat: number; lng: number; severity: string }> }) {
  const map = useMap();
  const groupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (groupRef.current) { map.removeLayer(groupRef.current); groupRef.current = null; }
    if (reports.length === 0) return;

    const group = L.layerGroup();

    reports.slice(0, MAX_MARKERS).forEach(r => {
      const color  = SEV_COLORS[r.severity] ?? "#0ea5e9";
      const isPulse = r.severity === "critical";

      // Simple circle marker — lighter than divIcon for performance
      const marker = L.circleMarker([r.lat, r.lng], {
        radius:      r.severity === "critical" ? 7 : r.severity === "high" ? 6 : 5,
        fillColor:   color,
        color:       "rgba(0,0,0,0.4)",
        weight:      1.5,
        opacity:     1,
        fillOpacity: 0.85,
      });

      // No popups on mini map — clicking navigates to /map instead
      group.addLayer(marker);
    });

    group.addTo(map);
    groupRef.current = group;
    return () => { if (groupRef.current) map.removeLayer(groupRef.current); };
  }, [reports, map]);

  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MiniMapPreview() {
  const { reports, hotspots, heatmapData, isLoading } = useMapData("all", "all");
  const { theme } = useTheme();
  const tileUrl = theme === "dark" ? DARK_TILE : LIGHT_TILE;

  const hasData = reports.length > 0 || hotspots.length > 0;

  return (
      <motion.div
        className="relative w-full h-full overflow-hidden border border-border/60 bg-slate-100 dark:bg-[#060d1a] cursor-pointer group"
        whileHover={{ borderColor: "rgba(14,165,233,0.45)" }}
        transition={{ duration: 0.2 }}
      >
        {/* Glow border on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none z-[600]"
          initial={{ boxShadow: "0 0 0px rgba(14,165,233,0)" }}
          whileHover={{ boxShadow: "0 0 18px rgba(14,165,233,0.18), inset 0 0 18px rgba(14,165,233,0.04)" }}
          transition={{ duration: 0.25 }}
        />

        {/* ── Map ── */}
        {true ? (
          <MapContainer
            center={CITY_CENTER}
            zoom={MINI_ZOOM}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            boxZoom={false}
            keyboard={false}
            touchZoom={false}
          >
            <TileLayer url={tileUrl} maxZoom={19} />
            <DisableInteractions />
            <HeatmapLayer
              data={heatmapData}
              visible={true}
            />
            <MiniReportMarkers reports={reports} />
            <HotspotMarkers hotspots={hotspots} visible={true} />
          </MapContainer>
        ) : (
          /* ── Empty state ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 dark:bg-[#060d1a]">
            {/* Faint grid */}
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mini-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(14,165,233,0.5)" strokeWidth="0.4"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mini-grid)"/>
            </svg>
            <MapPin className="w-7 h-7 text-muted-foreground/20" />
            <p className="text-xs font-mono text-muted-foreground/60 font-semibold">No active incidents</p>
            <p className="text-[10px] font-mono text-muted-foreground/35">Everything looks clear.</p>
          </div>
        )}

        {/* ── Top-left badge ── */}
        <div className="absolute top-2 left-2.5 z-[500] flex items-center gap-1.5 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80 backdrop-blur border border-border/50">
            <Radio className="w-2.5 h-2.5 text-primary animate-pulse" />
            <span className="text-[9px] font-mono text-primary/90 tracking-widest font-bold">LIVE HOTSPOT MAP</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-emerald-500/15 backdrop-blur border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400">
              <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold">LIVE</span>
          </div>
        </div>

        {/* ── Top-right expand ── */}
        <div className="absolute top-2 right-2.5 z-[500] pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur border border-border/50">
            <Maximize2 className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[9px] font-mono text-muted-foreground tracking-wider">EXPAND</span>
          </div>
        </div>

        {/* ── Bottom hover CTA ── */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-[500]"
          style={{ pointerEvents: "auto" }}
          initial={{ opacity: 0, y: 6 }}
          whileHover={{ opacity: 1, y: 0 }}
        >
          <Link href="/map">
            <div className="mx-2 mb-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-background/90 backdrop-blur border border-primary/30 cursor-pointer">
              <span className="text-[10px] font-mono font-bold text-primary tracking-wider">
                Open Full Intelligence Map →
              </span>
            </div>
          </Link>
        </motion.div>

        {/* ── Scanline vignette overlay ── */}
        <div
          className="absolute inset-0 z-[490] pointer-events-none rounded-xl"
          style={{
            background: "radial-gradient(ellipse at center, transparent 55%, rgba(6,13,26,0.55) 100%)",
          }}
        />

        {/* ── Report count pill (bottom-left corner) ── */}
        {reports.length > 0 && (
          <div className="absolute bottom-2 left-2.5 z-[500] pointer-events-none">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80 backdrop-blur border border-border/50">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] font-mono text-muted-foreground">
                <span className="text-foreground font-bold">{reports.length}</span> incidents
              </span>
            </div>
          </div>
        )}
      </motion.div>
  );
}
