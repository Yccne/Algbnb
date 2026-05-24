export const osmRasterStyle = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const getMapTilerKey = () => import.meta.env.VITE_MAPTILER_KEY?.trim();

export const isMapTilerEnabled = () => {
  const maptilerKey = getMapTilerKey();
  return Boolean(maptilerKey && maptilerKey !== 'replace_me');
};

export const getMapStyle = () => {
  const maptilerKey = getMapTilerKey();
  if (!isMapTilerEnabled()) {
    return osmRasterStyle;
  }
  const styleUrl = new URL('https://api.maptiler.com/maps/streets-v2/style.json');
  styleUrl.searchParams.set('key', maptilerKey);
  styleUrl.searchParams.set('language', 'fr');
  return styleUrl.toString();
};

export const mapLibreFrenchLocale = {
  'NavigationControl.ZoomIn': 'Zoomer',
  'NavigationControl.ZoomOut': 'Dézoomer',
  'NavigationControl.ResetBearing': 'Réinitialiser la rotation',
  'GeolocateControl.FindMyLocation': 'Trouver ma position',
  'GeolocateControl.LocationNotAvailable': 'Position indisponible',
  'FullscreenControl.Enter': 'Afficher en plein écran',
  'FullscreenControl.Exit': 'Quitter le plein écran',
  'AttributionControl.ToggleAttribution': 'Afficher les attributions',
};

export const installMapStyleFallback = (map) => {
  if (!map || !isMapTilerEnabled()) return () => {};

  let fallbackApplied = false;
  const applyFallback = () => {
    if (fallbackApplied) return;
    fallbackApplied = true;
    map.setStyle(osmRasterStyle);
  };

  const onError = (event) => {
    const details = [
      event?.error?.message,
      event?.error?.status,
      event?.error?.url,
      event?.sourceId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (
      details.includes('api.maptiler.com') ||
      details.includes('maptiler') ||
      details.includes('401') ||
      details.includes('403') ||
      details.includes('429')
    ) {
      applyFallback();
    }
  };

  map.on('error', onError);
  return () => map.off('error', onError);
};
