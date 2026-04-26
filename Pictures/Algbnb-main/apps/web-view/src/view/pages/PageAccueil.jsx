import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Search,
  User as UserIcon,
} from 'lucide-react';
import { logementController } from '@algbnb/core';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { LogementCard } from '../components/LogementCard';
import { LocationSearchInput, normalizeSearchText } from '../components/LocationSearchInput';

const categories = ['Appartement', 'Maison', 'Chambre', 'Villa', 'Chalet'];

export const PageAccueil = () => {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [voyageurs, setVoyageurs] = useState('');
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await logementController.getLogements();
        setLogements(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const cleanSearch = normalizeSearchText(search);
    if (cleanSearch) params.set('search', cleanSearch);
    if (voyageurs) params.set('voyageurs', voyageurs);
    if (dateArrivee) params.set('dateArrivee', dateArrivee);
    if (dateDepart) params.set('dateDepart', dateDepart);
    navigate(`/resultats?${params.toString()}`);
  };

  return (
    <>
      <div className="glass-nav">
        <Navbar />
      </div>

      <div className="page-container" style={{ marginTop: 'var(--spacing-12)' }}>
        <div
          className="animate-fadeInUp"
          style={{ marginBottom: 'var(--spacing-12)', maxWidth: '760px' }}
        >
          <h1
            style={{
              fontSize: 'var(--display-lg)',
              lineHeight: '1.08',
              marginBottom: 'var(--spacing-4)',
              letterSpacing: '-0.03em',
            }}
          >
            Trouvez un logement,
            <br />
            pret a etre reserve.
          </h1>
          <p
            style={{
              color: 'var(--on-surface-variant)',
              fontSize: 'var(--title-lg)',
              fontWeight: '400',
              lineHeight: '1.5',
            }}
          >
            Recherchez, reservez et echangez avec des hotes en quelques clics.
          </p>
        </div>

        <div
          className="animate-fadeInUp"
          style={{ marginBottom: 'var(--spacing-16)', animationDelay: '0.1s' }}
        >
          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface-lowest)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--spacing-2) var(--spacing-3)',
              boxShadow: 'var(--shadow-ambient)',
              flexWrap: 'wrap',
              gap: 'var(--spacing-1)',
            }}
          >
            <div
              style={{
                flex: '1 1 260px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                padding: 'var(--spacing-3) var(--spacing-4)',
              }}
            >
              <MapPin size={20} color="var(--primary)" />
              <LocationSearchInput
                value={search}
                onChange={setSearch}
                onSelect={(suggestion) => {
                  setSearch(suggestion.searchValue || suggestion.displayLabel || '');
                }}
              />
            </div>
            <div
              style={{
                flex: '1 1 170px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                borderLeft: '1px solid var(--surface-high)',
              }}
            >
              <CalendarDays size={20} color="var(--primary)" />
              <input
                type="date"
                value={dateArrivee}
                onChange={(event) => setDateArrivee(event.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: 'var(--body-md)',
                  color: 'var(--on-surface)',
                }}
              />
            </div>
            <div
              style={{
                flex: '1 1 170px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                borderLeft: '1px solid var(--surface-high)',
              }}
            >
              <CalendarDays size={20} color="var(--primary)" />
              <input
                type="date"
                value={dateDepart}
                onChange={(event) => setDateDepart(event.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: 'var(--body-md)',
                  color: 'var(--on-surface)',
                }}
              />
            </div>
            <div
              style={{
                flex: '1 1 140px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                padding: 'var(--spacing-3) var(--spacing-4)',
                borderLeft: '1px solid var(--surface-high)',
              }}
            >
              <UserIcon size={20} color="var(--primary)" />
              <input
                type="number"
                min="1"
                placeholder="Voyageurs"
                value={voyageurs}
                onChange={(event) => setVoyageurs(event.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: 'var(--body-md)',
                  color: 'var(--on-surface)',
                }}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              aria-label="Rechercher"
              style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, flexShrink: 0 }}
            >
              <Search size={20} />
            </button>
          </form>
        </div>

        <div
          className="animate-fadeInUp"
          style={{
            display: 'flex',
            gap: 'var(--spacing-3)',
            flexWrap: 'wrap',
            marginBottom: 'var(--spacing-12)',
            animationDelay: '0.15s',
          }}
        >
          {categories.map((category) => (
            <button
              key={category}
              className="chip chip-default"
              onClick={() => navigate(`/resultats?type=${encodeURIComponent(category.toLowerCase())}`)}
              style={{ fontSize: 'var(--body-sm)', padding: 'var(--spacing-3) var(--spacing-5)' }}
            >
              {category}
            </button>
          ))}
        </div>

        <div
          className="animate-fadeInUp"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 'var(--spacing-6)',
            animationDelay: '0.2s',
          }}
        >
          <div>
            <h2 style={{ fontSize: 'var(--headline-md)' }}>Logements disponibles</h2>
            <p
              style={{
                color: 'var(--on-surface-variant)',
                fontSize: 'var(--body-md)',
                marginTop: 'var(--spacing-2)',
              }}
            >
              Decouvrez des logements adaptes a vos dates, votre budget et votre style de voyage.
            </p>
          </div>
          <Link to="/resultats" className="btn-ghost" style={{ flexShrink: 0 }}>
            Voir tout <ChevronRight size={18} />
          </Link>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : logements.length === 0 ? (
          <div
            style={{
              padding: 'var(--spacing-10)',
              backgroundColor: 'var(--surface-low)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-16)',
            }}
          >
            <h3 style={{ marginBottom: 'var(--spacing-3)' }}>Aucune annonce disponible pour le moment</h3>
            <p style={{ color: 'var(--on-surface-variant)' }}>
              De nouvelles annonces apparaitront ici des qu elles seront publiees.
            </p>
            <div style={{ marginTop: 'var(--spacing-6)' }}>
              <Link to="/creer-annonce" className="btn-primary">
                Publier un logement
              </Link>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--spacing-6)',
              marginBottom: 'var(--spacing-16)',
            }}
          >
            {logements.slice(0, 6).map((logement, index) => (
              <div
                key={logement.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${0.25 + index * 0.08}s` }}
              >
                <LogementCard logement={logement} />
              </div>
            ))}
          </div>
        )}

        <footer
          style={{
            paddingTop: 'var(--spacing-8)',
            display: 'flex',
            justifyContent: 'space-between',
            color: 'var(--on-surface-variant)',
            fontSize: 'var(--body-sm)',
          }}
        >
          <p>2026 algbnb.</p>
          <div>
            <Link to="/confidentialite" className="footer-link">
              Confidentialite
            </Link>
            <Link to="/conditions" className="footer-link">
              Conditions
            </Link>
            <Link to="/aide" className="footer-link" style={{ marginRight: 0 }}>
              Aide
            </Link>
          </div>
        </footer>
      </div>

      <BottomNavBar />
    </>
  );
};
