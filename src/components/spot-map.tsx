'use client';

import { useEffect, useRef, useState } from 'react';
import type { Spot } from '@/lib/types';

interface DefaultSpot {
  name: string;
  lat: number;
  lon: number;
  type: string;
  bestTide: string;
  bestTime: string;
  noaaStation: string;
  description: string;
}

interface SpotMapProps {
  spots?: (Spot | DefaultSpot)[];
  onSpotClick?: (spot: Spot | DefaultSpot) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
  singleSpot?: boolean;
}

const typeColors: Record<string, string> = {
  jetty: '#14b8a6',
  river_mouth: '#3b82f6',
  beach_surf: '#22c55e',
  bridge: '#f59e0b',
  rocky_point: '#a855f7',
  tidal_flat: '#06b6d4',
  deep_water: '#6366f1',
  inlet: '#0ea5e9',
};

export default function SpotMap({
  spots = [],
  onSpotClick,
  height = '400px',
  center = [-72.5, 41.25],
  zoom = 9,
  singleSpot = false,
}: SpotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet (client-side only)
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([L]) => {
      if (!mapRef.current) return;

      const map = L.default.map(mapRef.current, {
        center: [center[1], center[0]], // Leaflet uses [lat, lng]
        zoom: singleSpot ? 13 : zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tile layer (CartoDB Dark Matter — free, no key)
      L.default.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      // Add zoom control top-right
      L.default.control.zoom({ position: 'topright' }).addTo(map);

      // Add attribution bottom-right (small)
      L.default.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://carto.com">CARTO</a>')
        .addTo(map);

      // Add markers for each spot
      spots.forEach((spot) => {
        const lat = 'latitude' in spot ? spot.latitude : spot.lat;
        const lon = 'longitude' in spot ? spot.longitude : spot.lon;
        const spotType = 'spot_type' in spot ? spot.spot_type : spot.type;
        const color = typeColors[spotType] || '#14b8a6';

        const icon = L.default.divIcon({
          className: '',
          html: `<div style="
            width: ${singleSpot ? '16px' : '12px'};
            height: ${singleSpot ? '16px' : '12px'};
            background: ${color};
            border: 2px solid rgba(255,255,255,0.8);
            border-radius: 50%;
            box-shadow: 0 0 8px ${color}80, 0 0 16px ${color}40;
            cursor: pointer;
          "></div>`,
          iconSize: [singleSpot ? 16 : 12, singleSpot ? 16 : 12],
          iconAnchor: [singleSpot ? 8 : 6, singleSpot ? 8 : 6],
        });

        const marker = L.default.marker([lat, lon], { icon }).addTo(map);

        const popupContent = `
          <div style="background: #0f1f3d; color: white; padding: 12px; border-radius: 12px; min-width: 180px; border: 1px solid #1e3a5f;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${spot.name}</div>
            <div style="display: inline-block; background: ${color}20; color: ${color}; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">${spotType.replace('_', ' ')}</div>
            ${spot.description ? `<div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">${spot.description}</div>` : ''}
            <div style="display: flex; gap: 6px;">
              <a href="/spots/${'id' in spot ? spot.id : spot.name.toLowerCase().replace(/\s+/g, '-')}" style="flex: 1; text-align: center; padding: 6px 0; background: #14b8a6; color: #0a1628; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none;">Details</a>
              <a href="/log/new?spot=${'id' in spot ? spot.id : ''}" style="flex: 1; text-align: center; padding: 6px 0; background: #1e3a5f; color: #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none;">Log Catch</a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'custom-popup',
          maxWidth: 250,
        });

        marker.on('click', () => {
          if (onSpotClick) onSpotClick(spot);
        });
      });

      mapInstanceRef.current = map;
      setLoaded(true);

      // Fix map size after render
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [spots, center, zoom, singleSpot, onSpotClick]);

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a1628]">
          <div className="text-slate-400 text-sm">Loading map...</div>
        </div>
      )}
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          border-radius: 12px;
          padding: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-popup .leaflet-popup-tip {
          background: #0f1f3d;
          border: 1px solid #1e3a5f;
        }
      `}</style>
    </div>
  );
}
