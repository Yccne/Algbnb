import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPinned, Search, SlidersHorizontal } from 'lucide-react';
import { logementController } from '@algbnb/controller-client';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { LogementCard } from '../components/LogementCard';
import { ListingsMap } from '../components/ListingsMap';
import { LocationSearchInput, normalizeSearchText } from '../components/LocationSearchInput';

const availableEquipements = ['Wi-Fi', 'Cuisine equipee', 'Animaux acceptes', 'Piscine', 'Parking', 'Climatisation'];

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
  const [draftFilters, setDraftFilters] = useState(() => readFilters(searchParams));
  const sentinelRef = useRef(null);

  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const fetchResults = useCallback(async (offset = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
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
    setSearchParams(buildSearchParams(draftFilters));
  };

  const resetFilters = () => {
    const emptyFilters = readFilters(new URLSearchParams());
    setDraftFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  const mappedCount = mapLogements.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)).length;

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        <header style={{ display: 'grid', gap: 'var(--spacing-8)', marginBottom: 'var(--spacing-12)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: 'var(--spacing-3)', lineHeight: 1.1 }}>
              {loading ? 'Recherche en cours...' : `${total} logement${total > 1 ? 's' : ''} trouve${total > 1 ? 's' : ''}`}
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>
              Affine tes resultats par lieu, dates, budget, equipements et qualite d hote.
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

            <div className="results-filter-grid">
              <div className="filter-field filter-field-location">
                <LocationSearchInput
                  value={draftFilters.search}
                  onChange={(value) => updateDraftFilter('search', value)}
                  onSelect={(suggestion) => updateDraftFilter('search', suggestion.searchValue || suggestion.displayLabel || '')}
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
                <option value="">Pertinence / recents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix decroissant</option>
                <option value="rating_desc">Mieux notes</option>
                <option value="recent">Plus recents</option>
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
                    key={equipement}
                    type="button"
                    className={draftFilters.equipements.includes(equipement) ? 'chip chip-active' : 'chip chip-default'}
                    onClick={() => toggleEquipement(equipement)}
                  >
                    {equipement}
                  </button>
                ))}
              </div>
            </div>

            <div className="results-filter-actions">
              <button type="button" className={draftFilters.annulationGratuite ? 'chip chip-active' : 'chip chip-default'} onClick={() => toggleBooleanFilter('annulationGratuite')}>
                Annulation gratuite
              </button>
              <button type="button" className={draftFilters.bienNote ? 'chip chip-active' : 'chip chip-default'} onClick={() => toggleBooleanFilter('bienNote')}>
                Bien note
              </button>
              <button type="button" className={draftFilters.hoteVerifie ? 'chip chip-active' : 'chip chip-default'} onClick={() => toggleBooleanFilter('hoteVerifie')}>
                Hote verifie
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={resetFilters}
                style={{ marginLeft: 'auto' }}
              >
                Reinitialiser
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
                ? `${mappedCount} logement${mappedCount > 1 ? 's' : ''} affiche${mappedCount > 1 ? 's' : ''} sur la carte.`
                : 'Aucun logement avec coordonnees a afficher sur la carte pour cette recherche.'}
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
            <h3 style={{ marginBottom: 'var(--spacing-2)' }}>Aucun resultat</h3>
            <p style={{ color: 'var(--on-surface-variant)' }}>Essaie une ville plus simple, retire un filtre ou explore toutes les annonces disponibles.</p>
          </div>
        ) : (
          <>
            <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-5)' }}>
              {logements.length} affiche(s) sur {total}
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
                Fin des resultats.
              </div>
            ) : null}
          </>
        )}
      </div>

      <footer style={{ padding: 'var(--spacing-6) 0', borderTop: '1px solid var(--surface-high)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', marginTop: 'auto' }}>
        <Link to="/confidentialite" className="footer-link">
          Confidentialite
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
