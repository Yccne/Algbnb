import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPinned, Search, SlidersHorizontal } from 'lucide-react';
import { logementController } from '@algbnb/controller-client';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { LogementCard } from '../components/LogementCard';
import { ListingsMap } from '../components/ListingsMap';
import { LocationSearchInput, getSuggestionGeoFilters, normalizeSearchText } from '../components/LocationSearchInput';

const availableEquipements = [
  { value: 'Wi-Fi', label: 'Wi-Fi' },
  { value: 'Cuisine equipee', label: 'Cuisine équipée' },
  { value: 'Animaux acceptes', label: 'Animaux acceptés' },
  { value: 'Piscine', label: 'Piscine' },
  { value: 'Parking', label: 'Parking' },
  { value: 'Climatisation', label: 'Climatisation' },
];

const readFilters = (searchParams) => ({
  search: searchParams.get('search') || '',
  type: searchParams.get('type') || '',
  prixMin: searchParams.get('prixMin') || '',
  prixMax: searchParams.get('prixMax') || '',
  chambres: searchParams.get('chambres') || '',
  lits: searchParams.get('lits') || '',
  voyageurs: searchParams.get('voyageurs') || '',
  dateArrivee: searchParams.get('dateArrivee') || '',
  dateDepart: searchParams.get('dateDepart') || '',
  sort: searchParams.get('sort') || '',
  placeLat: searchParams.get('placeLat') || '',
  placeLng: searchParams.get('placeLng') || '',
  placeMinLat: searchParams.get('placeMinLat') || '',
  placeMaxLat: searchParams.get('placeMaxLat') || '',
  placeMinLng: searchParams.get('placeMinLng') || '',
  placeMaxLng: searchParams.get('placeMaxLng') || '',
  placeLabel: searchParams.get('placeLabel') || '',
  annulationGratuite: searchParams.get('annulationGratuite') === 'true',
  bienNote: searchParams.get('bienNote') === 'true',
  hoteVerifie: searchParams.get('hoteVerifie') === 'true',
  equipements: searchParams.get('equipements') ? searchParams.get('equipements').split(',').filter(Boolean) : [],
});

const buildSearchParams = (filters) => {
  const next = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) next.set(key, value.join(','));
      return;
    }
    if (typeof value === 'boolean') {
      if (value) next.set(key, 'true');
      return;
    }
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      next.set(key, key === 'search' ? normalizeSearchText(value) : String(value).trim());
    }
  });
  return next;
};

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};

const validateSearchFilters = (filters) => {
  const errors = {};
  const prixMin = parseOptionalNumber(filters.prixMin);
  const prixMax = parseOptionalNumber(filters.prixMax);
  const voyageurs = parseOptionalNumber(filters.voyageurs);
  const chambres = parseOptionalNumber(filters.chambres);
  const lits = parseOptionalNumber(filters.lits);

  if (Number.isNaN(prixMin) || prixMin < 0) {
    errors.prix = 'Le prix minimum doit etre un nombre positif.';
  } else if (Number.isNaN(prixMax) || prixMax < 0) {
    errors.prix = 'Le prix maximum doit etre un nombre positif.';
  } else if (prixMin !== null && prixMax !== null && prixMin > prixMax) {
    errors.prix = 'Le prix maximum doit etre superieur au prix minimum.';
  }

  if (Number.isNaN(voyageurs) || (voyageurs !== null && voyageurs < 1)) {
    errors.voyageurs = 'Le nombre de voyageurs doit etre au moins 1.';
  }
  if (Number.isNaN(chambres) || (chambres !== null && chambres < 0)) {
    errors.chambres = 'Le nombre de chambres ne peut pas etre negatif.';
  }
  if (Number.isNaN(lits) || (lits !== null && lits < 0)) {
    errors.lits = 'Le nombre de lits ne peut pas etre negatif.';
  }

  if (filters.dateArrivee && filters.dateDepart && filters.dateDepart <= filters.dateArrivee) {
    errors.dates = 'La date de depart doit etre apres la date d arrivee.';
  }

  return errors;
};

export const PageResultats = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logements, setLogements] = useState([]);
  const [mapLogements, setMapLogements] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [filterErrors, setFilterErrors] = useState({});
  const [draftFilters, setDraftFilters] = useState(() => readFilters(searchParams));
  const sentinelRef = useRef(null);

  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  useEffect(() => {
    setDraftFilters(filters);
    setFilterErrors(validateSearchFilters(filters));
  }, [filters]);

  const fetchResults = useCallback(async (offset = 0, append = false) => {
    const nextErrors = validateSearchFilters(filters);
    if (Object.keys(nextErrors).length > 0) {
      setFilterErrors(nextErrors);
      setLogements([]);
      setTotal(0);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      setError('');
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
      setFilterErrors({});
    }

    try {
      const data = await logementController.searchLogements({
        ...filters,
        limit: 12,
        offset,
      });

      setLogements((current) => (append ? [...current, ...data.items] : data.items));
      setTotal(data.total || 0);
      setHasMore(Boolean(data.has_more));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  const fetchMapResults = useCallback(async () => {
    const nextErrors = validateSearchFilters(filters);
    if (Object.keys(nextErrors).length > 0) {
      setMapLogements([]);
      setLoadingMap(false);
      return;
    }

    setLoadingMap(true);
    try {
      const data = await logementController.getMapLogements(filters);
      setMapLogements(data);
    } catch {
      setMapLogements([]);
    } finally {
      setLoadingMap(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchResults(0, false);
    fetchMapResults();
  }, [fetchMapResults, fetchResults]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) {
          fetchResults(logements.length, true);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchResults, hasMore, loading, loadingMore, logements.length]);

  const updateDraftFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const updateDraftSearch = (value) => {
    setDraftFilters((current) => ({
      ...current,
      search: value,
      placeLat: '',
      placeLng: '',
      placeMinLat: '',
      placeMaxLat: '',
      placeMinLng: '',
      placeMaxLng: '',
      placeLabel: '',
    }));
  };

  const selectDraftPlace = (suggestion) => {
    const geoFilters = getSuggestionGeoFilters(suggestion);
    setDraftFilters((current) => ({
      ...current,
      ...geoFilters,
    }));
  };

  const toggleBooleanFilter = (key) => {
    setDraftFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  const toggleEquipement = (equipement) => {
    setDraftFilters((current) => ({
      ...current,
      equipements: current.equipements.includes(equipement)
        ? current.equipements.filter((item) => item !== equipement)
        : [...current.equipements, equipement],
    }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    const nextErrors = validateSearchFilters(draftFilters);
    setFilterErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setLogements([]);
      setMapLogements([]);
      setTotal(0);
      setHasMore(false);
      setLoading(false);
      setLoadingMap(false);
      setError('');
      return;
    }
    setSearchParams(buildSearchParams(draftFilters));
  };

  const resetFilters = () => {
    const emptyFilters = readFilters(new URLSearchParams());
    setDraftFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  const mappedCount = mapLogements.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)).length;
  const filterErrorMessages = Object.values(filterErrors);

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        <header style={{ display: 'grid', gap: 'var(--spacing-8)', marginBottom: 'var(--spacing-12)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: 'var(--spacing-3)', lineHeight: 1.1 }}>
              {loading ? 'Recherche en cours...' : `${total} logement${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}`}
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>
              Affine tes résultats par lieu, dates, budget, équipements et qualité d'hôte.
            </p>
          </div>

          <form
            onSubmit={applyFilters}
            className="results-filter-panel"
          >
            <div className="results-filter-title">
              <MapPinned size={18} />
              <strong>Recherche et filtres</strong>
            </div>

            {filterErrorMessages.length > 0 ? (
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'rgba(180, 35, 24, 0.08)',
                  color: 'var(--error)',
                  borderRadius: 'var(--radius-DEFAULT)',
                  display: 'grid',
                  gap: '4px',
                }}
              >
                {filterErrorMessages.map((message) => (
                  <span key={message}>{message}</span>
                ))}
              </div>
            ) : null}

            <div className="results-filter-grid">
              <div className="filter-field filter-field-location">
                <LocationSearchInput
                  value={draftFilters.search}
                  onChange={updateDraftSearch}
                  onSelect={selectDraftPlace}
                  placeholder="Lieu"
                />
              </div>
              <input type="date" value={draftFilters.dateArrivee} onChange={(event) => updateDraftFilter('dateArrivee', event.target.value)} className="input-field filter-field" />
              <input type="date" value={draftFilters.dateDepart} onChange={(event) => updateDraftFilter('dateDepart', event.target.value)} className="input-field filter-field" />
              <input type="number" min="1" value={draftFilters.voyageurs} onChange={(event) => updateDraftFilter('voyageurs', event.target.value)} placeholder="Voyageurs" className="input-field filter-field" />
              <select value={draftFilters.type} onChange={(event) => updateDraftFilter('type', event.target.value)} className="input-field filter-field filter-select">
                <option value="">Tous types</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="chambre">Chambre</option>
                <option value="villa">Villa</option>
                <option value="chalet">Chalet</option>
              </select>
              <select value={draftFilters.sort} onChange={(event) => updateDraftFilter('sort', event.target.value)} className="input-field filter-field filter-select">
                <option value="">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating_desc">Mieux notés</option>
                <option value="recent">Plus récents</option>
              </select>
              <input type="number" value={draftFilters.prixMin} onChange={(event) => updateDraftFilter('prixMin', event.target.value)} placeholder="Prix min" className="input-field filter-field" />
              <input type="number" value={draftFilters.prixMax} onChange={(event) => updateDraftFilter('prixMax', event.target.value)} placeholder="Prix max" className="input-field filter-field" />
              <input type="number" value={draftFilters.chambres} onChange={(event) => updateDraftFilter('chambres', event.target.value)} placeholder="Chambres min" className="input-field filter-field" />
              <input type="number" value={draftFilters.lits} onChange={(event) => updateDraftFilter('lits', event.target.value)} placeholder="Lits min" className="input-field filter-field" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-3)' }}>
                <SlidersHorizontal size={18} />
                <strong>Equipements</strong>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                {availableEquipements.map((equipement) => (
                  <button
                    key={equipement.value}
                    type="button"
                    className={draftFilters.equipements.includes(equipement.value) ? 'chip chip-active' : 'chip chip-default'}
                    onClick={() => toggleEquipement(equipement.value)}
                  >
                    {equipement.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="results-filter-actions">
              <button type="button" className={draftFilters.annulationGratuite ? 'chip chip-active' : 'chip chip-default'} onClick={() => toggleBooleanFilter('annulationGratuite')}>
                Annulation gratuite
              </button>
              <button type="button" className={draftFilters.bienNote ? 'chip chip-active' : 'chip chip-default'} onClick={() => toggleBooleanFilter('bienNote')}>
                Bien noté
              </button>
              <button type="button" className={draftFilters.hoteVerifie ? 'chip chip-active' : 'chip chip-default'} onClick={() => toggleBooleanFilter('hoteVerifie')}>
                Hôte vérifié
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={resetFilters}
                style={{ marginLeft: 'auto' }}
              >
                Réinitialiser
              </button>
              <button type="submit" className="btn-primary" aria-label="Rechercher les logements">
                <Search size={18} /> Rechercher
              </button>
            </div>
          </form>
        </header>

        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <ListingsMap listings={mapLogements} />
          <p style={{ marginTop: 'var(--spacing-3)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
            {loadingMap
              ? 'Chargement de la carte...'
              : mappedCount > 0
                ? `${mappedCount} logement${mappedCount > 1 ? 's' : ''} affiché${mappedCount > 1 ? 's' : ''} sur la carte.`
                : 'Aucun logement avec coordonnées à afficher sur la carte pour cette recherche.'}
          </p>
        </div>

        {error ? (
          <div style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-4)', backgroundColor: 'rgba(180, 35, 24, 0.08)', color: 'var(--error)', borderRadius: 'var(--radius-DEFAULT)' }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="spinner"></div>
        ) : logements.length === 0 ? (
          <div style={{ padding: 'var(--spacing-10)', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-2)' }}>Aucun résultat</h3>
            <p style={{ color: 'var(--on-surface-variant)' }}>Essaie une ville plus simple, retire un filtre ou explore toutes les annonces disponibles.</p>
          </div>
        ) : (
          <>
            <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-5)' }}>
              {logements.length} affiché(s) sur {total}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-8)', marginBottom: 'var(--spacing-10)' }}>
              {logements.map((logement) => (
                <LogementCard key={logement.id} logement={logement} />
              ))}
            </div>

            {loadingMore ? <div className="spinner"></div> : null}
            {hasMore ? <div ref={sentinelRef} style={{ height: '12px' }} /> : null}
            {!hasMore ? (
              <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-16)' }}>
                Fin des résultats.
              </div>
            ) : null}
          </>
        )}
      </div>

      <footer style={{ padding: 'var(--spacing-6) 0', borderTop: '1px solid var(--surface-high)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', marginTop: 'auto' }}>
        <Link to="/confidentialite" className="footer-link">
          Confidentialité
        </Link>
        <Link to="/conditions" className="footer-link">
          Conditions
        </Link>
        <Link to="/aide" className="footer-link" style={{ marginRight: 0 }}>
          Assistance
        </Link>
      </footer>
      <BottomNavBar />
    </div>
  );
};
