'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icons in Next.js
const customIcon = (color: string) =>
  L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      <div style="background: white; width: 6px; height: 6px; border-radius: 50%;"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

const ngoBaseIcon = L.divIcon({
  className: 'ngo-base-marker',
  html: `<div style="background-color: #0d9488; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 10px rgba(13,148,136,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 14px;">
    ★
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface NgoConsoleMapProps {
  ngoLat: number;
  ngoLng: number;
  radiusKm: number;
  ngoName: string;
  donations: Array<{
    id: string;
    title: string;
    quantity_kg: number;
    diet: string;
    risk_score: number;
    approx_lat: number;
    approx_lng: number;
    area_label?: string;
  }>;
  onSelectDonation?: (id: string) => void;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function NgoConsoleMap({
  ngoLat,
  ngoLng,
  radiusKm,
  ngoName,
  donations,
  onSelectDonation,
}: NgoConsoleMapProps) {
  return (
    <div className="w-full h-full min-h-[350px] relative rounded-3xl overflow-hidden border border-stone-200 shadow-sm">
      <MapContainer
        center={[ngoLat, ngoLng]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater lat={ngoLat} lng={ngoLng} />

        {/* NGO Base Marker */}
        <Marker position={[ngoLat, ngoLng]} icon={ngoBaseIcon}>
          <Popup>
            <div className="p-1 text-xs">
              <div className="font-bold text-teal-800">{ngoName} (Base)</div>
              <div className="text-stone-500">Coverage Radius: {radiusKm} km</div>
            </div>
          </Popup>
        </Marker>

        {/* Coverage Radius Circle */}
        <Circle
          center={[ngoLat, ngoLng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#0d9488',
            fillColor: '#0d9488',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 6',
          }}
        />

        {/* Donation Pins */}
        {donations.map((d) => {
          const color =
            d.risk_score >= 65 ? '#ef4444' : d.risk_score >= 35 ? '#f59e0b' : '#10b981';

          return (
            <Marker
              key={d.id}
              position={[d.approx_lat, d.approx_lng]}
              icon={customIcon(color)}
            >
              <Popup>
                <div className="p-1.5 space-y-1.5 text-xs min-w-[140px]">
                  <div className="font-bold text-stone-900 leading-tight">{d.title}</div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>{d.quantity_kg} kg</span>
                    <span className="capitalize">{d.diet}</span>
                  </div>
                  {d.area_label && (
                    <div className="text-[10px] text-stone-400 truncate">{d.area_label}</div>
                  )}
                  {onSelectDonation && (
                    <button
                      type="button"
                      onClick={() => onSelectDonation(d.id)}
                      className="w-full py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] mt-1"
                    >
                      Inspect / Claim
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
