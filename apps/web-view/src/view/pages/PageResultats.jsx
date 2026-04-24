import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPinned, SlidersHorizontal } from 'lucide-react';
import { logementController } from '@algbnb/core';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { LogementCard } from '../components/LogementCard';
import { ListingsMap } from '../components/ListingsMap';
import { LocationSearchInput } from '../components/LocationSearchInput';

const availableEquipements = ['Wi-Fi', 'Cuisine equipee', 'Animaux acceptes', 'Piscine', 'Parking', 'Climatisation'];

export const PageResultats = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logements, setLogements] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef(null);

  const filters = useMemo(
    () => ({
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
    }),
    [searchParams]
  );

  const filtersKey = useMemo(() => searchParams.toString(), [searchParams]);

  const fetchResults = async (offset = 0, append = false) => {
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
  };

  useEffect(() => {
    fetchResults(0, false);
  }, [filtersKey]);

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
  }, [hasMore, loading, loadingMore, logements.length, filtersKey]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || (Array.isArray(value) && value.length === 0)) {
      next.delete(key);
    } else {
      next.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
    setSearchParams(next);
  };

  const toggleBooleanFilter = (key) => {
    updateFilter(key, !filters[key]);
  };

  const toggleEquipement = (equipement) => {
    const next = filters.equipements.includes(equipement)
      ? filters.equipements.filter((item) => item !== equipement)
      : [...filters.equipements, equipement];
    updateFilter('equipements', next);
  };

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

          <div style={{ backgroundColor: 'var(--surface-lowest)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-ambient)', padding: 'var(--spacing-5)', display: 'grid', gap: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPinned size={18} />
              <strong>Recherche et filtres</strong>
            </div>

            <div className="results-filter-grid">
              <LocationSearchInput
                value={filters.search}
                onChange={(value) => updateFilter('search', value)}
                onSelect={(suggestion) => updateFilter('search', suggestion.display_name || '')}
                placeholder="Lieu"
              />
              <input type="date" value={filters.dateArrivee} onChange={(event) => updateFilter('dateArrivee', event.target.value)} className="input-field" />
              <input type="date" value={filters.dateDepart} onChange={(event) => updateFilter('dateDepart', event.target.value)} className="input-field" />
              <input type="number" min="1" value={filters.voyageurs} onChange={(event) => updateFilter('voyageurs', event.target.value)} placeholder="Voyageurs" className="input-field" />
              <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} className="input-field">
                <option value="">Tous types</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="chambre">Chambre</option>
                <option value="villa">Villa</option>
                <option value="chalet">Chalet</option>
              </select>
              <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="input-field">
                <option value="">Pertinence / recents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix decroissant</option>
                <option value="rating_desc">Mieux notes</option>
                <option value="recent">Plus recents</option>
              </select>
              <input type="number" value={filters.prixMin} onChange={(event) => updateFilter('prixMin', event.target.value)} placeholder="Prix min" className="input-field" />
              <input type="number" value={filters.prixMax} onChange={(event) => updateFilter('prixMax', event.target.value)} placeholder="Prix max" className="input-field" />
              <input type="number" value={filters.chambres} onChange={(event) => updateFilter('chambres', event.target.value)} placeholder="Chambres min" className="input-field" />
              <input type="number" value={filters.lits} onChange={(event) => updateFilter('lits', event.target.value)} placeholder="Lits min" className="input-field" />
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
                    className={filters.equipements.includes(equipement) ? 'chip chip-active' : 'chip chip-default'}
                    onClick={() => toggleEquipement(equipement)}
                  >
                    {equipement}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
              <button type="button" className={filters.annulationGratuite ? 'chip chip-active' : 'chip chip-default'} onClick={() => toggleBooleanFilter('annulationGratuite')}>
                Annulation gratuite
              </button>
              <button type="button" className={filters.bienNote ? 'chip chip-active' : 'chip chip-default'} onClick={() => toggleBooleanFilter('bienNote')}>
                Bien note
              </button>
              <button type="button" className={filters.hoteVerifie ? 'chip chip-active' : 'chip chip-default'} onClick={() => toggleBooleanFilter('hoteVerifie')}>
                Hote verifie
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setSearchParams(new URLSearchParams())}
                style={{ marginLeft: 'auto' }}
              >
                Reinitialiser
              </button>
            </div>
          </div>
        </header>

        {import.meta.env.VITE_MAPTILER_KEY ? (
          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <ListingsMap listings={logements} />
          </div>
        ) : null}

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
            <p style={{ color: 'var(--on-surface-variant)' }}>Ajuste les filtres ou cree de nouvelles annonces cote hote.</p>
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
        <Link to="#" className="footer-link">
          Confidentialite
        </Link>
        <Link to="#" className="footer-link">
          Conditions
        </Link>
        <Link to="#" className="footer-link" style={{ marginRight: 0 }}>
          Assistance
        </Link>
      </footer>
      <BottomNavBar />
    </div>
  );
};
