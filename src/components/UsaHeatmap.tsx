import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip } from "react-tooltip";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface UsaHeatmapProps {
  data: { id: string; value: number }[];
}

export default function UsaHeatmap({ data }: UsaHeatmapProps) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map(d => d.value), 1);
  }, [data]);

  const colorScale = scaleLinear<string>()
    .domain([0, maxCount])
    .range(["#DBEAFE", "#0A3266"]); // ENVI colors (Light gray-blue to ENVI Blue)

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      if (d && d.id) {
        // Data from db is likely full uppercase names, e.g. "TEXAS", "CALIFORNIA"
        map.set(d.id.toUpperCase(), d.value);
      }
    });
    return map;
  }, [data]);

  return (
    <div className="w-full h-full min-h-[300px] relative" data-tooltip-id="usa-map-tooltip">
      <ComposableMap projection="geoAlbersUsa" style={{ width: "100%", height: "100%" }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map(geo => {
              const stateName = geo.properties.name.toUpperCase();
              const count = dataMap.get(stateName) || 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={count > 0 ? colorScale(count) : "#F0F4F8"}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  data-tooltip-content={`${geo.properties.name}: ${count} envíos`}
                  data-tooltip-id="usa-map-tooltip"
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#FFD100", outline: "none", cursor: "pointer" },
                    pressed: { fill: "#E5BC00", outline: "none" }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      <Tooltip id="usa-map-tooltip" place="top" style={{ backgroundColor: '#232323', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} />
    </div>
  );
}
