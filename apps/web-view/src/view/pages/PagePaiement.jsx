import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { reservationController } from '@algbnb/core';
import { ArrowLeft, Shield } from 'lucide-react';

export const PagePaiement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Use state passed from PageLogement if available, else fallback
  const reservationData = location.state || {
    logement: { id: 1, titre: 'Dar El Dey - Casbah', prix: 18000 },
    dateArrivee: '2026-06-01',
    dateDepart: '2026-06-05',
    voyageurs: 2,
    nuits: 4,
    sousTotal: 72000,
    frais: 8640,
    total: 80640
  };

  const { logement, dateArrivee, dateDepart, voyageurs, nuits, sousTotal, frais, total } = reservationData;

  const handlePayment = async () => {
    setLoading(true);
    try {
      await reservationController.reserver({ 
        logementId: logement.id, 
        voyageurId: 2, 
        dateArrivee, 
        dateDepart, 
        total 
      });
      alert('Réservation confirmée ! Vous allez être redirigé vers vos voyages.');
      navigate('/reservations');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="page-container" style={{ maxWidth: '600px', margin: 'var(--spacing-12) auto', flex: 1 }}>
        
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', marginBottom: 'var(--spacing-8)', cursor: 'pointer' }}>
          <ArrowLeft size={20} /> Retour
        </button>

        <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: 'var(--spacing-8)', lineHeight: 1.1 }}>
          Confirmer et payer
        </h1>
        
        <div style={{ backgroundColor: 'var(--surface-lowest)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
          <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-6)' }}>Détails du voyage</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Logement</span>
            <span style={{ fontWeight: 'bold' }}>{logement.titre}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Dates</span>
            <span style={{ fontWeight: 'bold' }}>{dateArrivee} - {dateDepart}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Voyageurs</span>
            <span style={{ fontWeight: 'bold' }}>{voyageurs} voyageur{voyageurs > 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>{logement.prix} DZD x {nuits} {nuits > 1 ? 'nuits' : 'nuit'}</span>
            <span style={{ fontWeight: 'bold' }}>{sousTotal} DZD</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Frais de service algbnb</span>
            <span style={{ fontWeight: 'bold' }}>{frais} DZD</span>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--surface-high)', margin: 'var(--spacing-6) 0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-8)' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Total</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{total} DZD</span>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: 'var(--spacing-4)', fontSize: '1.1rem' }}
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Traitement en cours...' : 'Confirmer et payer'}
          </button>

          <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
            <Shield size={14} /> Paiement sécurisé et crypté
          </div>
        </div>
      </div>

      <footer style={{ padding: 'var(--spacing-6) 0', borderTop: '1px solid var(--surface-high)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
        <Link to="#" className="footer-link">Confidentialité</Link>
        <Link to="#" className="footer-link">Conditions</Link>
        <Link to="#" className="footer-link" style={{marginRight: 0}}>Aide</Link>
      </footer>
    </div>
  );
};
