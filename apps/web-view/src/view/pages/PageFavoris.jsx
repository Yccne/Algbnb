import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { LogementCard } from '../components/LogementCard';
import { logementController } from '@algbnb/core';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const PageFavoris = () => {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const all = await logementController.getLogements();
      // Simulate 2 favorites
      setLogements(all.slice(0, 2));
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        <header style={{ marginBottom: 'var(--spacing-12)' }}>
          <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: 'var(--spacing-4)', lineHeight: 1.1 }}>
            Favoris
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>
            Vos logements préférés, toujours à portée de main.
          </p>
        </header>

        {loading ? (
          <div className="spinner"></div>
        ) : logements.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 'var(--spacing-8)' 
          }}>
            {logements.map(logement => (
              <LogementCard key={logement.id} logement={logement} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-16)' }}>
            <Heart size={48} style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-4)' }} />
            <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>Aucun favori pour le moment</h3>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-8)' }}>Parcourez nos logements et ajoutez vos coups de cœur ici.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Explorer les logements</button>
          </div>
        )}
      </div>

      <footer style={{ padding: 'var(--spacing-6) 0', borderTop: '1px solid var(--surface-high)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
        <Link to="#" className="footer-link">Confidentialité</Link>
        <Link to="#" className="footer-link">Conditions</Link>
        <Link to="#" className="footer-link" style={{marginRight: 0}}>Aide</Link>
      </footer>
      <BottomNavBar />
    </div>
  );
};
