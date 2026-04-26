import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock3, MapPin, Star, Wallet } from 'lucide-react';
import { avisController, reservationController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';

const fallbackImage = 'https://placehold.co/300x300?text=Reservation';

const cancelledStatuses = ['annulee_hote', 'annulee_voyageur', 'refusee'];

const statusLabel = {
  en_attente: 'En attente',
  confirmee: 'Confirmee',
  terminee: 'Terminee',
  refusee: 'Refusee',
  annulee_hote: 'Annulee par l hote',
  annulee_voyageur: 'Annulee par le voyageur',
};

const emptyReview = {
  note_logement: 5,
  note_hote: 5,
  commentaire: '',
};

export const PageMesReservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [submittingReviewId, setSubmittingReviewId] = useState(null);
  const [reviewForms, setReviewForms] = useState({});
  const navigate = useNavigate();

  const loadReservations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await reservationController.getReservationsVoyageur();
      setReservations(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = reservations.filter((reservation) => {
      if (cancelledStatuses.includes(reservation.statut)) {
        return false;
      }
      const startDate = new Date(`${reservation.date_arrivee}T00:00:00`);
      return startDate >= today;
    }).length;

    const pending = reservations.filter((reservation) => reservation.statut === 'en_attente').length;
    const completed = reservations.filter((reservation) => reservation.statut === 'terminee').length;
    const cancelled = reservations.filter((reservation) =>
      cancelledStatuses.includes(reservation.statut)
    ).length;

    return { upcoming, pending, completed, cancelled };
  }, [reservations]);

  const handleCancel = async (event, reservationId) => {
    event.stopPropagation();
    if (!window.confirm('Annuler cette reservation ?')) {
      return;
    }

    setCancellingId(reservationId);
    setError('');
    try {
      await reservationController.annulerReservation(
        reservationId,
        'Annulation depuis le tableau de bord voyageur'
      );
      await loadReservations();
    } catch (cancelError) {
      setError(cancelError.message);
    } finally {
      setCancellingId(null);
    }
  };

  const startReview = (reservationId) => {
    setReviewingId(reservationId);
    setReviewForms((current) => ({
      ...current,
      [reservationId]: current[reservationId] || { ...emptyReview },
    }));
    setError('');
  };

  const updateReviewField = (reservationId, key, value) => {
    setReviewForms((current) => ({
      ...current,
      [reservationId]: {
        ...(current[reservationId] || emptyReview),
        [key]: value,
      },
    }));
  };

  const submitReview = async (event, reservationId) => {
    event.stopPropagation();
    const review = reviewForms[reservationId] || emptyReview;

    setSubmittingReviewId(reservationId);
    setError('');
    try {
      await avisController.laisserAvis({
        id_reservation: reservationId,
        note_logement: Number(review.note_logement),
        note_hote: Number(review.note_hote),
        commentaire: review.commentaire,
      });

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === reservationId ? { ...reservation, has_review: true } : reservation
        )
      );
      setReviewingId(null);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmittingReviewId(null);
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

      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        <header style={{ marginBottom: 'var(--spacing-12)' }}>
          <h1
            style={{
              fontSize: 'var(--display-md)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--spacing-4)',
              lineHeight: 1.1,
            }}
          >
            Voyages
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-6)' }}>
            Retrouve tes reservations, les statuts de sejour et les avis a laisser apres voyage.
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Explorer les logements
          </button>
        </header>

        {loading ? (
          <div className="spinner"></div>
        ) : !user ? (
          <div
            style={{
              padding: 'var(--spacing-10)',
              backgroundColor: 'var(--surface-low)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <h3 style={{ marginBottom: 'var(--spacing-3)' }}>Connexion requise</h3>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-6)' }}>
              Connecte-toi pour voir tes reservations.
            </p>
            <button className="btn-primary" onClick={() => navigate('/connexion')}>
              Se connecter
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
            {error ? (
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'rgba(180, 35, 24, 0.08)',
                  color: 'var(--error)',
                  borderRadius: 'var(--radius-DEFAULT)',
                }}
              >
                {error}
              </div>
            ) : null}

            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--spacing-5)',
              }}
            >
              <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                  Sejours a venir
                </div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats.upcoming}</div>
              </div>
              <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                  En attente
                </div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats.pending}</div>
              </div>
              <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                  Sejours termines
                </div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats.completed}</div>
              </div>
              <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                  Annulees ou refusees
                </div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats.cancelled}</div>
              </div>
            </section>

            {reservations.length === 0 ? (
              <div
                style={{
                  marginTop: 'var(--spacing-4)',
                  textAlign: 'center',
                  backgroundColor: 'var(--surface-lowest)',
                  padding: 'var(--spacing-12)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-ambient)',
                }}
              >
                <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>
                  Aucune reservation pour le moment
                </h3>
                <p style={{ color: 'var(--on-surface-variant)' }}>
                  Quand tu reserves un logement, il apparait ici immediatement.
                </p>

              </div>
            ) : (
              <section style={{ display: 'grid', gap: 'var(--spacing-5)' }}>
                {reservations.map((reservation) => {
                  const review = reviewForms[reservation.id] || emptyReview;
                  const canReview = reservation.statut === 'terminee' && !reservation.has_review;

                  return (
                    <div
                      key={reservation.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '120px 1fr',
                        gap: 'var(--spacing-5)',
                        padding: 'var(--spacing-5)',
                        backgroundColor: 'var(--surface-lowest)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-ambient)',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/logement/${reservation.id_logement}`)}
                    >
                      <div
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: 'var(--radius-DEFAULT)',
                          backgroundColor: 'var(--surface-high)',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={reservation.photos?.[0] || fallbackImage}
                          alt={reservation.titre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 'var(--spacing-4)',
                            flexWrap: 'wrap',
                            marginBottom: 'var(--spacing-2)',
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                fontSize: 'var(--title-lg)',
                                fontWeight: 'bold',
                                marginBottom: 'var(--spacing-2)',
                              }}
                            >
                              {reservation.titre}
                            </h3>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--on-surface-variant)',
                                marginBottom: '4px',
                                fontSize: 'var(--body-sm)',
                              }}
                            >
                              <Calendar size={16} />
                              <span>
                                {reservation.date_arrivee} au {reservation.date_depart}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--on-surface-variant)',
                                marginBottom: '4px',
                                fontSize: 'var(--body-sm)',
                              }}
                            >
                              <MapPin size={16} />
                              <span>{reservation.ville || reservation.adresse}</span>
                            </div>
                          </div>

                          <span
                            className={
                              reservation.statut === 'confirmee'
                                ? 'badge badge-success'
                                : reservation.statut === 'en_attente'
                                  ? 'badge badge-warning'
                                  : cancelledStatuses.includes(reservation.statut)
                                    ? 'badge badge-error'
                                    : 'badge badge-neutral'
                            }
                            style={{ height: 'fit-content' }}
                          >
                            {statusLabel[reservation.statut] || reservation.statut}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: 'var(--spacing-5)',
                            flexWrap: 'wrap',
                            color: 'var(--on-surface-variant)',
                            fontSize: 'var(--body-sm)',
                            marginBottom: 'var(--spacing-4)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock3 size={15} />
                            {reservation.nb_voyageurs} voyageur(s)
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Wallet size={15} />
                            {reservation.montant_total || 0} DZD
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                          <button
                            className="btn-outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/logement/${reservation.id_logement}`);
                            }}
                          >
                            Voir le logement
                          </button>

                          {reservation.statut === 'en_attente' || reservation.statut === 'confirmee' ? (
                            <button
                              className="btn-ghost"
                              onClick={(event) => handleCancel(event, reservation.id)}
                              disabled={cancellingId === reservation.id}
                              style={{ color: 'var(--error)' }}
                            >
                              {cancellingId === reservation.id ? 'Annulation...' : 'Annuler la reservation'}
                            </button>
                          ) : null}

                          {canReview ? (
                            <button
                              className="btn-ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                startReview(reservation.id);
                              }}
                            >
                              Laisser un avis
                            </button>
                          ) : null}

                          {reservation.has_review ? (
                            <span className="badge badge-success">Avis deja laisse</span>
                          ) : null}
                        </div>

                        {reviewingId === reservation.id ? (
                          <form
                            onSubmit={(event) => submitReview(event, reservation.id)}
                            style={{
                              marginTop: 'var(--spacing-5)',
                              padding: 'var(--spacing-5)',
                              borderRadius: 'var(--radius-DEFAULT)',
                              backgroundColor: 'var(--surface-low)',
                              display: 'grid',
                              gap: 'var(--spacing-4)',
                            }}
                          >
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: 'var(--spacing-4)',
                              }}
                            >
                              <label style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
                                <span>Note du logement</span>
                                <select
                                  className="input-field"
                                  value={review.note_logement}
                                  onChange={(event) =>
                                    updateReviewField(reservation.id, 'note_logement', event.target.value)
                                  }
                                >
                                  {[5, 4, 3, 2, 1].map((value) => (
                                    <option key={value} value={value}>
                                      {value}/5
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
                                <span>Note de l hote</span>
                                <select
                                  className="input-field"
                                  value={review.note_hote}
                                  onChange={(event) =>
                                    updateReviewField(reservation.id, 'note_hote', event.target.value)
                                  }
                                >
                                  {[5, 4, 3, 2, 1].map((value) => (
                                    <option key={value} value={value}>
                                      {value}/5
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <textarea
                              className="input-field"
                              rows="4"
                              placeholder="Partage ton experience"
                              value={review.commentaire}
                              onChange={(event) =>
                                updateReviewField(reservation.id, 'commentaire', event.target.value)
                              }
                            />

                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                              <button className="btn-primary" type="submit" disabled={submittingReviewId === reservation.id}>
                                {submittingReviewId === reservation.id ? 'Envoi...' : 'Publier l avis'}
                              </button>
                              <button
                                className="btn-outline"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setReviewingId(null);
                                }}
                              >
                                Annuler
                              </button>
                            </div>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </div>
        )}
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
        <p style={{ marginBottom: 'var(--spacing-4)' }}>2026 algbnb</p>
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
