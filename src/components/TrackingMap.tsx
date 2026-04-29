import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext.tsx';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
  label: string;
  date?: string;
  status?: string;
}

interface TrackingMapProps {
  events: any[];
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}

const RecenterMap = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

export default function TrackingMap({ events, origin, destination }: TrackingMapProps) {
  const { mode } = useTheme();
  
  // Filter events with coordinates
  const points: Location[] = events
    .filter(e => e.lat && e.lng)
    .map(e => ({
      lat: Number(e.lat),
      lng: Number(e.lng),
      label: e.evento,
      date: e.fecha_hora,
      status: e.estado_resultante
    }));

  const allCoords: [number, number][] = points.map(p => [p.lat, p.lng]);
  if (origin) allCoords.push([origin.lat, origin.lng]);
  if (destination) allCoords.push([destination.lat, destination.lng]);

  const center: [number, number] = allCoords.length > 0 
    ? allCoords[0]
    : [14.6349, -90.5069]; // Gt City default

  return (
    <div className={`h-[400px] w-full rounded-[32px] overflow-hidden relative z-0 border border-gray-100 dark:border-slate-800 shadow-xl transition-all duration-500`}>
      <MapContainer 
        center={center} 
        zoom={6} 
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: mode === 'dark' ? '#020617' : '#f8fafc' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className={mode === 'dark' ? 'map-tiles-dark' : ''}
        />
        
        {points.map((point, idx) => (
          <Marker key={idx} position={[point.lat, point.lng]}>
            <Popup className="custom-map-popup">
              <div className="font-sans p-1">
                <p className="font-black text-[10px] uppercase tracking-widest text-envi-azul dark:text-envi-celeste mb-1">{point.label}</p>
                <p className="text-[9px] text-gray-500 dark:text-slate-400 font-bold">{point.date}</p>
                {point.status && (
                  <span className="mt-2 inline-block px-3 py-1 rounded-full bg-envi-azul/10 text-envi-azul dark:text-envi-celeste text-[8px] font-black uppercase tracking-widest">
                    {point.status}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {allCoords.length > 1 && (
          <Polyline 
            positions={allCoords} 
            color={mode === 'dark' ? '#FFD100' : '#1E53A1'} 
            weight={4} 
            dashArray="10, 15" 
            opacity={0.8}
          />
        )}

        <RecenterMap points={allCoords} />
      </MapContainer>
      
      <style>{`
        .map-tiles-dark {
          filter: grayscale(100%) invert(100%) contrast(0.9) brightness(0.9);
        }
        .leaflet-bar a {
          background-color: ${mode === 'dark' ? '#0f172a' : '#ffffff'} !important;
          color: ${mode === 'dark' ? '#ffffff' : '#0f172a'} !important;
          border-bottom: 1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'} !important;
        }
        .custom-map-popup .leaflet-popup-content-wrapper {
          background-color: ${mode === 'dark' ? '#0f172a' : '#ffffff'};
          color: ${mode === 'dark' ? '#ffffff' : '#1e293b'};
          border-radius: 12px;
          padding: 4px;
        }
        .custom-map-popup .leaflet-popup-tip {
          background-color: ${mode === 'dark' ? '#0f172a' : '#ffffff'};
        }
      `}</style>
    </div>
  );
}
