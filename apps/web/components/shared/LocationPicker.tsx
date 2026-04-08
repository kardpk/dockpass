"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const DEFAULT_CENTER: [number, number] = [-80.1918, 25.7617]; // Miami
const DEFAULT_ZOOM = 12;

export function LocationPicker({
  lat,
  lng,
  onLocationChange,
  address,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [geocodeStatus, setGeocodeStatus] = useState<
    "none" | "from-address" | "manual"
  >(lat ? "manual" : "none");

  const placeMarker = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      if (!mapRef.current) return;

      if (markerRef.current) {
        markerRef.current.setLngLat(lngLat);
      } else {
        const marker = new mapboxgl.Marker({
          color: "#0C447C",
          draggable: true,
        })
          .setLngLat(lngLat)
          .addTo(mapRef.current);

        marker.on("dragend", () => {
          const pos = marker.getLngLat();
          onLocationChange(pos.lat, pos.lng);
          setGeocodeStatus("manual");
        });

        markerRef.current = marker;
      }

      onLocationChange(lngLat.lat, lngLat.lng);
    },
    [onLocationChange]
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: lat && lng ? [lng, lat] : DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("click", (e) => {
      placeMarker({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      setGeocodeStatus("manual");
    });

    mapRef.current = map;

    // Place initial marker if coordinates exist
    if (lat && lng) {
      placeMarker({ lat, lng });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geocode address on change
  useEffect(() => {
    if (!address || address.length < 5 || !MAPBOX_TOKEN) return;

    const timer = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(address);
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&types=poi,address&country=US&limit=1`
        );
        const data = await res.json();
        const feature = data.features?.[0];

        if (feature && mapRef.current) {
          const [fLng, fLat] = feature.center;
          mapRef.current.flyTo({ center: [fLng, fLat], zoom: 15 });
          placeMarker({ lat: fLat, lng: fLng });
          setGeocodeStatus("from-address");
        }
      } catch {
        // Silent fail — user can still manually click the map
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [address, placeMarker]);

  return (
    <div>
      <div
        ref={mapContainer}
        className="w-full h-[400px] rounded-card border border-border overflow-hidden"
      />

      <div className="mt-tight">
        {geocodeStatus === "none" && (
          <p className="text-caption text-grey-text">
            Tap map to set your exact dock location
          </p>
        )}
        {geocodeStatus === "from-address" && (
          <p className="text-caption text-success-text">
            📍 Location set from address
          </p>
        )}
        {geocodeStatus === "manual" && (
          <p className="text-caption text-success-text">
            📍 Location set — guests will navigate here
          </p>
        )}
        {lat && lng && (
          <p className="text-[11px] text-grey-text mt-[2px]">
            {Math.abs(lat).toFixed(4)}° {lat >= 0 ? "N" : "S"},{" "}
            {Math.abs(lng).toFixed(4)}° {lng >= 0 ? "E" : "W"}
          </p>
        )}
      </div>
    </div>
  );
}
