import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState } from "react";

type Hotspot = {
  id: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  riskLevel: string;
  confidence: number;
  predictedIssues: string[];
};

export default function HotspotMap({
  hotspots,
}: {
  hotspots: Hotspot[];
}) {
  const [selected, setSelected] = useState<Hotspot | null>(null);

  const getColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "moderate":
        return "#eab308";
      default:
        return "#22c55e";
    }
  };

  const validHotspots = hotspots.filter(
    (h) =>
      typeof h.latitude === "number" &&
      typeof h.longitude === "number"
  );

  return (
    <div className="h-[450px] rounded-xl overflow-hidden">
      <Map
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialViewState={{
          latitude: 26.8467,
          longitude: 80.9462,
          zoom: 11,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
        {validHotspots.map((spot) => (
          <Marker
            key={spot.id}
            latitude={spot.latitude}
            longitude={spot.longitude}
          >
            <div
              onClick={() => setSelected(spot)}
              style={{
                backgroundColor: getColor(spot.riskLevel),
              }}
              className="w-4 h-4 rounded-full border-2 border-white cursor-pointer"
            />
          </Marker>
        ))}

        {selected && (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            closeOnClick={false}
            onClose={() => setSelected(null)}
          >
            <div className="text-xs">
              <h3 className="font-bold">
                {selected.neighborhood}
              </h3>

              <p>
                Risk: {selected.riskLevel}
              </p>

              <p>
                Confidence:
                {" "}
                {Math.round(selected.confidence * 100)}%
              </p>

              <p>
                {selected.predictedIssues?.join(", ")}
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}