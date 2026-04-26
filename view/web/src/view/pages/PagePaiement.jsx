import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { reservationController } from '@algbnb/controller-client';
import { Navbar } from '../components/Navbar';

export const PageReservationConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reservationData = location.state;

  if (!reservationData) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: 'var(--spacing-16)', textAlign: 'center' }}>
          Aucune reservation en preparation.
        </div>
      </div>
    );
  }

  const {
    logement,
    dateArrivee,
    dateDepart,
    voyageurs,
    nuits,
    sousTotal,
    frais,
    total,
    modeReservation,
    politiqueAnnulation,
  } = reservationData;
  const requiresApproval = modeReservation !== 'instantanee';

  const handleReservation = async () => {
    setLoading(true);
    setError('');
    try {
      await reservationController.creerReservation({
        id_logement: logement.id,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        nb_voyageurs: voyageurs,
      });
      navigate('/reservations');
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-main)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />
      <div
        className="page-container"
        style={{ maxWidth: '600px', margin: 'var(--spacing-12) auto', flex: 1 }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--on-surface-variant)',
            fontSize: 'var(--body-md)',
            marginBottom: 'var(--spacing-8)',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={20} /> Retour
        </button>

        <h1
          style={{
            fontSize: 'var(--display-md)',
            letterSpacing: '-0.02em',
            marginBottom: 'var(--spacing-8)',
            lineHeight: 1.1,
          }}
        >
          Verifier et confirmer la reservation
        </h1>

        <div
          style={{
            marginBottom: 'var(--spacing-6)',
            padding: 'var(--spacing-5)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(15, 110, 86, 0.08)',
            color: 'var(--primary)',
          }}
        >
          Aucun paiement en ligne n est demande. Le montant ci-dessous sert de recapitulatif pour
          la reservation.
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-lowest)',
            padding: 'var(--spacing-8)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--outline-variant)',
          }}
        >
          <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-6)' }}>
            Details du sejour
          </h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            <span style={{ color: 'var(--on-surface-variant)' }}>Mode de reservation</span>
            <span style={{ fontWeight: 'bold' }}>
              {requiresApproval ? 'Demande avec validation de l hote' : 'Reservation instantanee'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            <span style={{ color: 'var(--on-surface-variant)' }}>Logement</span>
            <span style={{ fontWeight: 'bold' }}>{logement.titre}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            <span style={{ color: 'var(--on-surface-variant)' }}>Dates</span>
            <span style={{ fontWeight: 'bold' }}>
              {dateArrivee} - {dateDepart}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            <span style={{ color: 'var(--on-surface-variant)' }}>Voyageurs</span>
            <span style={{ fontWeight: 'bold' }}>{voyageurs}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-2)',
            }}
          >
            <span style={{ color: 'var(--on-surface-variant)' }}>
              {logement.prix} DZD x {nuits} nuit{nuits > 1 ? 's' : ''}
            </span>
            <span style={{ fontWeight: 'bold' }}>{sousTotal} DZD</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-6)',
            }}
          >
            <span style={{ color: 'var(--on-surface-variant)' }}>Frais de service estimatifs</span>
            <span style={{ fontWeight: 'bold' }}>{frais} DZD</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-6)',
            }}
          >
            <span style={{ color: 'var(--on-surface-variant)' }}>Annulation</span>
            <span style={{ fontWeight: 'bold' }}>{politiqueAnnulation || 'moderee'}</span>
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: '1px solid var(--surface-high)',
              margin: 'var(--spacing-6) 0',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-8)',
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Total</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{total} DZD</span>
          </div>

          {error ? (
            <div
              style={{
                marginBottom: 'var(--spacing-4)',
                padding: 'var(--spacing-4)',
                backgroundColor: 'rgba(180, 35, 24, 0.08)',
                color: 'var(--error)',
                borderRadius: 'var(--radius-DEFAULT)',
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            className="btn-primary"
            style={{ width: '100%', padding: 'var(--spacing-4)', fontSize: '1.1rem' }}
            onClick={handleReservation}
            disabled={loading}
          >
            {loading
              ? 'Creation de la reservation...'
              : requiresApproval
                ? 'Envoyer la demande'
                : 'Confirmer la reservation'}
          </button>

          <div
            style={{
              marginTop: 'var(--spacing-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--on-surface-variant)',
              fontSize: 'var(--body-sm)',
            }}
          >
            <Shield size={14} /> Confirmation securisee, sans paiement en ligne
          </div>
        </div>
      </div>

      <footer
        style={{
          padding: 'var(--spacing-6) 0',
          borderTop: '1px solid var(--surface-high)',
          textAlign: 'center',
          color: 'var(--on-surface-variant)',
          fontSize: 'var(--body-sm)',
        }}
      >
        <Link to="/confidentialite" className="footer-link">
          Confidentialite
        </Link>
        <Link to="/conditions" className="footer-link">
          Conditions
        </Link>
        <Link to="/aide" className="footer-link" style={{ marginRight: 0 }}>
          Aide
        </Link>
      </footer>
    </div>
  );
};
