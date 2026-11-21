import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
const markerIcon = L.divIcon({
  className: "campus-marker",
  html: "<span></span>",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});
export default function LocationPicker({ value, onChange, readOnly = false }) {
  const container = useRef(null),
    callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    const initial = value || { lat: 14.5995, lng: 120.9842 };
    const map = L.map(container.current, { scrollWheelZoom: false }).setView(
      [initial.lat, initial.lng],
      16,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    const marker = L.marker([initial.lat, initial.lng], {
      draggable: !readOnly,
      icon: markerIcon,
    }).addTo(map);
    if (!readOnly) {
      const change = (latlng) => {
        marker.setLatLng(latlng);
        callback.current?.({
          lat: Number(latlng.lat.toFixed(6)),
          lng: Number(latlng.lng.toFixed(6)),
        });
      };
      map.on("click", (e) => change(e.latlng));
      marker.on("dragend", () => change(marker.getLatLng()));
    }
    return () => map.remove();
  }, []);
  return (
    <div
      className="map-container"
      ref={container}
      aria-label={
        readOnly
          ? "Reported issue location"
          : "Choose issue location by clicking the map or dragging the marker"
      }
    />
  );
}
