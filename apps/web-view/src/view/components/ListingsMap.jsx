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

const mapStyle = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

export const ListingsMap = ({ listings }) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
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

    const validListings = listings.filter((listing) => Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude));
    if (validListings.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    const duplicateCounts = new Map();
    const duplicateIndexes = new Map();
    validListings.forEach((listing) => {
      const key = `${Number(listing.latitude).toFixed(6)},${Number(listing.longitude).toFixed(6)}`;
      duplicateCounts.set(key, (duplicateCounts.get(key) || 0) + 1);
    });

    validListings.forEach((listing) => {
      const key = `${Number(listing.latitude).toFixed(6)},${Number(listing.longitude).toFixed(6)}`;
      const index = duplicateIndexes.get(key) || 0;
      duplicateIndexes.set(key, index + 1);
      const duplicateCount = duplicateCounts.get(key) || 1;
      const angle = (index / duplicateCount) * Math.PI * 2;
      const markerOffset = duplicateCount > 1
        ? [Math.cos(angle) * 22, Math.sin(angle) * 22]
        : [0, 0];

      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'listing-marker';
      markerElement.textContent = `${listing.prix} DZD`;
      markerElement.setAttribute('aria-label', `Voir ${listing.titre || 'ce logement'} sur la carte`);
      markerElement.title = listing.titre || 'Voir ce logement';
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

      const marker = new maplibregl.Marker({ element: markerElement, offset: markerOffset })
        .setLngLat([listing.longitude, listing.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([listing.longitude, listing.latitude]);
    });

    map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
  }, [listings, navigate]);

  return <div ref={mapContainerRef} className="results-map" />;
};
