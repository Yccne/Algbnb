import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { favorisController } from '@algbnb/controller-client';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { LogementCard } from '../components/LogementCard';

export const PageFavoris = () => {
  const { user } = useAuth();
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await favorisController.getFavoris();
        setLogements(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        <header style={{ marginBottom: 'var(--spacing-12)' }}>
          <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: 'var(--spacing-4)', lineHeight: 1.1 }}>Favoris</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>Retrouve rapidement les logements que tu souhaites comparer ou réserver plus tard.</p>
        </header>

        {loading ? (
          <div className="spinner"></div>
        ) : error ? (
          <div style={{ padding: 'var(--spacing-4)', backgroundColor: 'rgba(180, 35, 24, 0.08)', color: 'var(--error)', borderRadius: 'var(--radius-DEFAULT)' }}>{error}</div>
        ) : logements.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-8)' }}>
            {logements.map((logement) => (
              <LogementCard
                key={logement.id}
                logement={logement}
                initialFavorite
                onFavoriteChange={(next) => {
                  if (!next) {
                    setLogements((current) => current.filter((item) => item.id !== logement.id));
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-16)' }}>
            <Heart size={48} style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-4)' }} />
            <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>Aucun favori pour le moment</h3>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-8)' }}>
              Ajoute des logements a tes favoris depuis les cartes ou la fiche detail.
            </p>
          </div>
        )}
      </div>

      <BottomNavBar />
    </div>
  );
};
