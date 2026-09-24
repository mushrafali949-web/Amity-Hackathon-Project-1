'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const pickupIcon = L.divIcon({
  className: 'pickup-driver-marker',
  html: `<div style="background-color: #ea580c; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">
    A
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const dropoffIcon = L.divIcon({
  className: 'dropoff-driver-marker',
  html: `<div style="background-color: #0d9488; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">
    B
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface DriverRouteMapProps {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  restaurantName: string;
  ngoName: string;
  routeCoordinates: [number, number][];
}

export default function DriverRouteMap({
  startLat,
  startLng,
  endLat,
  endLng,
  restaurantName,
  ngoName,
  routeCoordinates,
}: DriverRouteMapProps) {
  const centerLat = (startLat + endLat) / 2;
  const centerLng = (startLng + endLng) / 2;

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-3xl overflow-hidden border border-stone-800 shadow-md">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup Marker (Restaurant) */}
        <Marker position={[startLat, startLng]} icon={pickupIcon}>
          <Popup>
            <div className="text-xs p-1">
              <strong className="text-orange-700">Pickup:</strong> {restaurantName}
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker (NGO) */}
        <Marker position={[endLat, endLng]} icon={dropoffIcon}>
          <Popup>
            <div className="text-xs p-1">
              <strong className="text-teal-700">Drop-off:</strong> {ngoName}
            </div>
          </Popup>
        </Marker>

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#ea580c',
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
