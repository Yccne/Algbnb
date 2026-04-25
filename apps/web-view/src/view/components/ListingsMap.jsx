import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const ListingsMap = ({ listings }) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !import.meta.env.VITE_MAPTILER_KEY) {
      return undefined;
    }

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
      center: [3.0588, 36.7538],
      zoom: 5.5,
      attributionControl: true,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const validListings = listings.filter((listing) => Number.isFinite(listing.lat) && Number.isFinite(listing.lng));
    if (validListings.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    validListings.forEach((listing) => {
      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'listing-marker';
      markerElement.textContent = `${listing.prix} DZD`;
      markerElement.onclick = () => navigate(`/logement/${listing.id}`);

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
        `
          <div class="listing-popup">
            <strong>${escapeHtml(listing.titre)}</strong>
            <span>${escapeHtml(listing.ville || '')}</span>
            <span>${escapeHtml(String(listing.prix))} DZD / nuit</span>
          </div>
        `
      );

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([listing.lng, listing.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([listing.lng, listing.lat]);
    });

    map.fitBounds(bounds, { padding: 50, maxZoom: 12 });
  }, [listings, navigate]);

  if (!import.meta.env.VITE_MAPTILER_KEY) {
    return null;
  }

  return <div ref={mapContainerRef} className="results-map" />;
};
