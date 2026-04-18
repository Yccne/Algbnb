import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export const PageMesReservations = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const reservations = [
    {
      id: 1,
      titre: 'Dar El Dey - Casbah',
      dates: '12 - 18 Juillet 2026',
      details: '2 voyageurs · Alger, Algérie',
      logementId: 1
    },
    {
      id: 2,
      titre: 'Villa Oranaise avec Piscine',
      dates: '24 - 27 Décembre 2026',
      details: '4 voyageurs · Oran, Algérie',
      logementId: 2
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        <header style={{ marginBottom: 'var(--spacing-16)' }}>
          <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: 'var(--spacing-4)', lineHeight: 1.1 }}>
            Voyages
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>
            Gérez vos réservations passées et à venir.
          </p>
        </header>

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
            {reservations.map(res => (
              <div 
                key={res.id} 
                style={{ display: 'flex', gap: 'var(--spacing-6)', paddingBottom: 'var(--spacing-8)', borderBottom: '1px solid var(--surface-high)', cursor: 'pointer' }}
                onClick={() => navigate(`/logement/${res.logementId}`)}
              >
                <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-DEFAULT)', backgroundColor: 'var(--surface-high)', overflow: 'hidden' }}>
                  {res.id === 1 ? (
                    <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=80" style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/>
                  ) : (
                    <img src="https://images.unsplash.com/photo-1449844908441-8829872d2607?w=300&q=80" style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--title-lg)', fontWeight: 'bold', marginBottom: 'var(--spacing-2)' }}>{res.titre}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>
                    <Calendar size={16} /> <span>{res.dates}</span>
                  </div>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>{res.details}</p>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 'var(--spacing-8)', textAlign: 'center', backgroundColor: 'var(--surface-lowest)', padding: 'var(--spacing-12)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>Aucune réservation pour le moment.</h3>
              <p style={{ color: 'var(--on-surface-variant)' }}>Il est temps de dépoussiérer vos valises et de commencer à planifier votre prochaine aventure.</p>
              <button className="btn-primary" style={{ marginTop: 'var(--spacing-8)' }} onClick={() => navigate('/')}>
                Commencer l'exploration
              </button>
            </div>
          </div>
        )}
      </div>

      <footer style={{ padding: 'var(--spacing-6) 0', borderTop: '1px solid var(--surface-high)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
        <p style={{ marginBottom: 'var(--spacing-4)' }}>© 2024 algbnb - Curateur Digital</p>
        <Link to="#" className="footer-link">Confidentialité</Link>
        <Link to="#" className="footer-link">Conditions</Link>
        <Link to="#" className="footer-link" style={{marginRight: 0}}>Assistance</Link>
      </footer>
      
      <BottomNavBar />
    </div>
  );
};
