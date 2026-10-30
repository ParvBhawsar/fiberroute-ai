import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LiveMap({ points, onPointsChange, route, focus, infrastructure = [] }) {
  const el = useRef(null);
  const map = useRef(null);
  const layers = useRef(null);
  const handler = useRef(onPointsChange);
  const currentPoints = useRef(points);
  const [tileError, setTileError] = useState(false);
  handler.current = onPointsChange;
  currentPoints.current = points;
  useEffect(() => {
    const instance = L.map(el.current, { scrollWheelZoom: false }).setView([20.168, 73.83], 11);
    map.current = instance;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on('tileerror', () => setTileError(true))
      .on('load', () => setTileError(false))
      .addTo(instance);
    layers.current = L.layerGroup().addTo(instance);
    instance.on('click', (e) =>
      handler.current?.(
        currentPoints.current.length >= 2 ? [e.latlng] : [...currentPoints.current, e.latlng],
      ),
    );
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(el.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const group = layers.current;
    if (!group) return;
    group.clearLayers();
    points.forEach((p, i) => {
      const text = document.createElement('span');
      text.textContent = i === 0 ? 'A · Existing fiber node' : 'B · Target village';
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: 'route-pin',
          html: `<span class="pin-${i}">${i === 0 ? 'A' : 'B'}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      })
        .bindTooltip(text)
        .addTo(group);
    });
    if (route) {
      L.geoJSON(route.geometry, {
        style: {
          color: '#e0764d',
          weight: 5,
          opacity: 0.9,
          dashArray: route.source === 'straight-line' ? '8 7' : undefined,
        },
      }).addTo(group);
    } else if (points.length === 2)
      L.polyline(
        points.map((p) => [p.lat, p.lng]),
        { color: '#477b69', dashArray: '7 7', weight: 3 },
      ).addTo(group);
    infrastructure.forEach((p) => {
      const label = document.createElement('span');
      label.textContent = p.name;
      L.circleMarker([p.lat, p.lng], { radius: 5, color: '#456a8f', fillOpacity: 0.8 })
        .bindTooltip(label)
        .addTo(group);
    });
    if (points.length === 2)
      map.current.fitBounds(
        points.map((p) => [p.lat, p.lng]),
        { padding: [45, 45], maxZoom: 14 },
      );
  }, [points, route, infrastructure]);
  useEffect(() => {
    if (focus) map.current?.setView([focus.lat, focus.lng], 13);
  }, [focus]);
  return (
    <div className="live-map-wrap">
      <div
        ref={el}
        className="live-map"
        aria-label="Interactive route map. Click to set endpoints, or use coordinate inputs below."
      />
      {tileError && (
        <div className="map-error" role="status">
          Map tiles are unavailable. You can still enter endpoint coordinates below.
        </div>
      )}
    </div>
  );
}
