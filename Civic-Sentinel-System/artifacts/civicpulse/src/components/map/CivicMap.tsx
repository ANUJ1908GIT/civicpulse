// src/components/map/CivicMap.tsx
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./map.css";

import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Map, Flame, Layers, Radio, RefreshCw, Search,
  X, ChevronDown, AlertCircle, CheckCircle2, Clock,
  Eye, EyeOff, BarChart3, Zap
} from "lucide-react";
import { useMapData } from "./useMapData";
import { HeatmapLayer, ReportMarkers, HotspotMarkers, FlyTo } from "./MapLayers";
import { useTheme } from "@/components/theme-provider";

// ── Types ────────────────────────────────────────────────────────────────────
type LayerState = {
  reports:  boolean;
  heatmap:  boolean;
  hotspots: boolean;
};

// ── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [28.6139, 77.209];
const DEFAULT_ZOOM = 12;

const DARK_TILE  = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILE = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const SEV_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#10b981",
};

// ── Sub-components ───────────────────────────────────────────────────────────
function LayerToggle({
  label, icon: Icon, active, color, onClick,
}: { label: string; icon: React.ElementType; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all border ${
        active
          ? "text-foreground border-transparent"
          : "text-muted-foreground border-border/40 hover:border-border"
      }`}
      style={active ? { background: `${color}20`, borderColor: `${color}40`, color } : {}}
    >
      {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 opacity-40" />}
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold font-mono" style={{ color }}>{value}</span>
      <span className="text-[9px] font-mono text-muted-foreground tracking-wider">{label}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
interface CivicMapProps {
  height?: string;
  showControls?: boolean;
  theme?: "dark" | "light";
}

export default function CivicMap({ height = "600px", showControls = true, theme: themeProp }: CivicMapProps) {
  const { theme: themeCtx } = useTheme();
  const theme = themeProp ?? (themeCtx === "dark" ? "dark" : "light");
  const [layers,          setLayers]         = useState<LayerState>({ reports: true, heatmap: true, hotspots: true });
  const [severityFilter,  setSeverityFilter]  = useState("all");
  const [categoryFilter,  setCategoryFilter]  = useState("all");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [flyTarget,       setFlyTarget]       = useState<{ lat: number; lng: number } | null>(null);
  const [selectedId,      setSelectedId]      = useState<number | null>(null);
  const [showSearch,      setShowSearch]      = useState(false);
  const [showCatMenu,     setShowCatMenu]     = useState(false);
  const [isRefreshing,    setIsRefreshing]    = useState(false);

  const { reports, hotspots, heatmapData, categories, isLoading, refetch } = useMapData(severityFilter, categoryFilter);

  const toggleLayer = (key: keyof LayerState) =>
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSelect = useCallback((id: number) => {
    const r = reports.find(x => x.id === id);
    if (r) { setFlyTarget({ lat: r.lat, lng: r.lng }); setSelectedId(id); }
  }, [reports]);

  // Search filter
  const filteredReports = searchQuery.trim()
    ? reports.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.neighborhood ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports;

  // Stats
  const critCount = reports.filter(r => r.severity === "critical").length;
  const resolvedCount = reports.filter(r => r.status === "resolved").length;
  const inProgCount = reports.filter(r => r.status === "in_progress").length;

  const tileUrl = theme === "dark" ? DARK_TILE : LIGHT_TILE;

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-border/60 bg-card" style={{ height }}>

      {/* ── Top toolbar ── */}
      {showControls && (
        <div className="shrink-0 border-b border-border/60 bg-card/95 backdrop-blur px-4 py-2.5 flex items-center gap-3 flex-wrap">

          {/* Title */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-6 h-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Map className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-mono font-bold tracking-wider text-foreground">CIVIC INTELLIGENCE MAP</span>
            <div className="flex items-center gap-1 ml-1">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400">LIVE</span>
            </div>
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <LayerToggle label="REPORTS"  icon={AlertCircle} active={layers.reports}  color="#0ea5e9" onClick={() => toggleLayer("reports")} />
            <LayerToggle label="HEATMAP"  icon={Flame}       active={layers.heatmap}  color="#f97316" onClick={() => toggleLayer("heatmap")} />
            <LayerToggle label="HOTSPOTS" icon={Zap}         active={layers.hotspots} color="#8b5cf6" onClick={() => toggleLayer("hotspots")} />
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setShowSearch(s => !s)}
                className="w-7 h-7 rounded-lg border border-border/60 bg-card flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                {showSearch ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 200 }}
                    exit={{ opacity: 0, width: 0 }}
                    className="absolute right-8 top-0 overflow-hidden"
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="map-search-box"
                    />
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Severity filter */}
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="h-7 text-[10px] font-mono bg-card border border-border/60 rounded-lg px-2 text-muted-foreground hover:border-border focus:outline-none focus:border-primary/50"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-7 text-[10px] font-mono bg-card border border-border/60 rounded-lg px-2 text-muted-foreground hover:border-border focus:outline-none focus:border-primary/50 max-w-[120px]"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
              ))}
            </select>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="w-7 h-7 rounded-lg border border-border/60 bg-card flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* ── Map area ── */}
      <div className="relative w-full h-[520px] min-h-[520px] bg-slate-200">

        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[500] flex items-center justify-center bg-background/80 backdrop-blur"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center">
                  <Map className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <p className="text-xs font-mono text-muted-foreground">LOADING INTELLIGENCE MAP...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ width: "100%", height: "520px" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  maxZoom={19}
/>

<ZoomControl position="bottomright" />

<ReportMarkers
  reports={filteredReports}
  visible={layers.reports}
  onSelect={handleSelect}
/>

<HotspotMarkers
  hotspots={hotspots}
  visible={layers.hotspots}
/>

<HeatmapLayer
  data={heatmapData}
  visible={layers.heatmap}
/>

{flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
        </MapContainer>

        {/* ── Bottom stats strip ── */}
        {showControls && (
          <div className="absolute bottom-10 left-3 z-[400]">
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl border border-border/60 bg-card/90 backdrop-blur">
              <StatBadge label="TOTAL"    value={reports.length} color="#0ea5e9" />
              <div className="w-px h-6 bg-border/60" />
              <StatBadge label="CRITICAL" value={critCount}      color="#ef4444" />
              <div className="w-px h-6 bg-border/60" />
              <StatBadge label="ACTIVE"   value={inProgCount}    color="#f59e0b" />
              <div className="w-px h-6 bg-border/60" />
              <StatBadge label="RESOLVED" value={resolvedCount}  color="#10b981" />
            </div>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="absolute top-3 right-3 z-[400]">
          <div className="px-3 py-2.5 rounded-xl border border-border/60 bg-card/90 backdrop-blur">
            <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">SEVERITY</div>
            <div className="flex flex-col gap-1.5">
              {Object.entries(SEV_COLORS).map(([sev, color]) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
                  <span className="text-[10px] font-mono capitalize" style={{ color: severityFilter === sev ? color : undefined }}>
                    {sev}
                  </span>
                </button>
              ))}
              <div className="border-t border-border/40 pt-1.5 mt-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" style={{ boxShadow: "0 0 6px rgba(139,92,246,0.8)" }} />
                  <span className="text-[10px] font-mono text-muted-foreground">hotspot</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search results panel ── */}
        <AnimatePresence>
          {showSearch && searchQuery && filteredReports.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-3 left-3 z-[400] w-72 max-h-64 overflow-y-auto rounded-xl border border-border/60 bg-card/95 backdrop-blur"
            >
              <div className="p-2 border-b border-border/40">
                <span className="text-[10px] font-mono text-muted-foreground">{filteredReports.length} results for "{searchQuery}"</span>
              </div>
              {filteredReports.slice(0, 8).map(r => (
                <button
                  key={r.id}
                  onClick={() => { handleSelect(r.id); setShowSearch(false); setSearchQuery(""); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-border/20 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SEV_COLORS[r.severity] }} />
                    <span className="text-xs font-medium truncate">{r.title}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 ml-4">
                    {r.neighborhood ?? "—"} · {r.severity}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
