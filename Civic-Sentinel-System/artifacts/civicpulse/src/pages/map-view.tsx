// src/pages/map-view.tsx
// Full-page map view — add route "/map" in App.tsx
import CivicMap from "@/components/map/CivicMap";
import { motion } from "framer-motion";
import { Map } from "lucide-react";

export default function MapView() {
  return (
    <div className="flex flex-col p-3 sm:p-5 md:p-7 gap-4 sm:gap-5" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-primary" />
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight">INTELLIGENCE MAP</h1>
          </div>
          <p className="text-muted-foreground text-xs font-mono ml-3.5">
            Real-time geospatial view · Click markers for details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl border border-primary/20 bg-primary/8 flex items-center justify-center">
            <Map className="w-4 h-4 text-primary" />
          </div>
        </div>
      </motion.div>

      {/* Full map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="flex-1"
        style={{ minHeight: 520, height: "calc(100vh - 12rem)" }}
      >
        <CivicMap height="100%" showControls={true} />
      </motion.div>
    </div>
  );
}
