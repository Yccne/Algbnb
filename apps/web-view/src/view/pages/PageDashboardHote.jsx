import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarClock,
  Eye,
  Edit2,
  Plus,
  Power,
  Star,
  Trash2,
} from 'lucide-react';
import { dashboardController, logementController, reservationController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';

const fallbackImage = 'https://placehold.co/150x150?text=Annonce';

const statusLabel = {
  en_attente: 'En attente',
  confirmee: 'Confirmee',
  terminee: 'Terminee',
  refusee: 'Refusee',
  annulee_hote: 'Annulee par l hote',
  annulee_voyageur: 'Annulee par le voyageur',
};

const notificationLabel = (type) => {
  if (String(type).startsWith('rappel')) return 'Rappel';
  if (type === 'message') return 'Message';
  if (type === 'annulation') return 'Annulation';
  return 'Reservation';
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
};

export const PageDashboardHote = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardController.getHostDashboard();
      setDashboard(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [user]);

  const toggleStatus = async (annonce) => {
    try {
      await logementController.togglePublication(annonce.id, !annonce.est_actif);
      await loadDashboard();
    } catch (toggleError) {
      setError(toggleError.message);
    }
  };

  const deleteAnnonce = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) {
      return;
    }

    try {
      await logementController.supprimerLogement(id);
      await loadDashboard();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const updateReservationStatus = async (id, statut) => {
    try {
      await reservationController.updateReservationStatus(id, statut);
      await loadDashboard();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  if (!user) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-main)',
          minHeight: '100vh',
        }}
      >
        <Navbar />
        <div className="page-container" style={{ paddingTop: 'var(--spacing-16)' }}>
          Connecte-toi en hote pour acceder au dashboard.
        </div>
      </div>
    );
  }

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
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--spacing-12)',
            gap: 'var(--spacing-6)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h4
              style={{
                fontSize: 'var(--title-lg)',
                color: 'var(--on-surface-variant)',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              Espace hote
            </h4>
            <h1
              style={{
                fontSize: 'var(--display-md)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: 'var(--spacing-3)',
              }}
            >
              Pilotage des annonces et reservations
            </h1>
            <p
              style={{
                color: 'var(--on-surface-variant)',
                fontSize: 'var(--body-md)',
                maxWidth: '680px',
              }}
            >
              Vue recap de tes annonces, demandes, montants estimes et notifications de reservation.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
            <button className="btn-outline" onClick={() => navigate('/notifications')}>
              <Bell size={18} /> Notifications
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate('/creer-annonce')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} /> Nouvelle annonce
            </button>
          </div>
        </header>

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <>
            {error ? (
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'rgba(180, 35, 24, 0.08)',
                  color: 'var(--error)',
                  borderRadius: 'var(--radius-DEFAULT)',
                  marginBottom: 'var(--spacing-8)',
                }}
              >
                {error}
              </div>
            ) : null}

            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-2)' }}>
                Bonjour, {user.prenom || user.nom}
              </h2>
              <p
                style={{
                  color: 'var(--on-surface-variant)',
                  fontSize: 'var(--body-md)',
                  marginBottom: 'var(--spacing-6)',
                }}
              >
                Suis l activite de tes annonces, tes demandes et tes sejours en cours.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--spacing-5)',
                }}
              >
                <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                  <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                    Annonces actives
                  </div>
                  <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>
                    {dashboard?.stats?.nb_annonces_actives || 0}
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                  <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                    Reservations confirmees
                  </div>
                  <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>
                    {dashboard?.stats?.nb_reservations_confirmees || 0}
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                  <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                    Demandes en attente
                  </div>
                  <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>
                    {dashboard?.stats?.nb_reservations_en_attente || 0}
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                  <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                    Montant genere
                  </div>
                  <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>
                    {dashboard?.stats?.revenu_total || 0} DZD
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                  <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                    Note moyenne hote
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--headline-md)',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Star size={18} color="#f59e0b" fill="#f59e0b" />
                    {dashboard?.stats?.note_moyenne_hote || 0}
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                  <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                    Annulations
                  </div>
                  <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>
                    {dashboard?.stats?.nb_annulations || 0}
                  </div>
                </div>
              </div>
            </section>

            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 'var(--spacing-8)',
                marginBottom: 'var(--spacing-12)',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--surface-lowest)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-6)',
                  boxShadow: 'var(--shadow-ambient)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-5)',
                  }}
                >
                  <h3 style={{ fontSize: 'var(--title-lg)' }}>Notifications recentes</h3>
                  <button className="btn-ghost" onClick={() => navigate('/notifications')}>
                    Tout voir
                  </button>
                </div>

                {(dashboard?.notifications || []).length === 0 ? (
                  <p style={{ color: 'var(--on-surface-variant)' }}>
                    Aucune notification pour le moment.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    {dashboard.notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        style={{
                          padding: 'var(--spacing-4)',
                          borderRadius: 'var(--radius-DEFAULT)',
                          backgroundColor: notification.est_lue
                            ? 'var(--surface-low)'
                            : 'rgba(15, 110, 86, 0.07)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 'var(--spacing-3)',
                            marginBottom: 'var(--spacing-2)',
                          }}
                        >
                          <span className={notification.est_lue ? 'badge badge-neutral' : 'badge badge-success'}>
                            {notificationLabel(notification.type)}
                          </span>
                          <span style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>
                            {formatDate(notification.date_envoi)}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--body-sm)', lineHeight: 1.6 }}>
                          {notification.contenu}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface-lowest)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-6)',
                  boxShadow: 'var(--shadow-ambient)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: 'var(--spacing-5)',
                  }}
                >
                  <CalendarClock size={20} />
                  <h3 style={{ fontSize: 'var(--title-lg)' }}>Demandes a traiter</h3>
                </div>

                {(dashboard?.reservations || []).filter((item) => item.statut === 'en_attente').length === 0 ? (
                  <p style={{ color: 'var(--on-surface-variant)' }}>
                    Aucune demande en attente.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    {dashboard.reservations
                      .filter((item) => item.statut === 'en_attente')
                      .slice(0, 4)
                      .map((reservation) => (
                        <div
                          key={reservation.id}
                          style={{
                            padding: 'var(--spacing-4)',
                            borderRadius: 'var(--radius-DEFAULT)',
                            backgroundColor: 'var(--surface-low)',
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: 'var(--spacing-2)' }}>
                            {reservation.voyageur_prenom} {reservation.voyageur_nom}
                          </div>
                          <div
                            style={{
                              color: 'var(--on-surface-variant)',
                              fontSize: 'var(--body-sm)',
                              marginBottom: 'var(--spacing-3)',
                            }}
                          >
                            {reservation.logement_titre} • {reservation.date_arrivee} au {reservation.date_depart}
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                            <button
                              className="btn-primary"
                              onClick={() => updateReservationStatus(reservation.id, 'confirmee')}
                            >
                              Confirmer
                            </button>
                            <button
                              className="btn-outline"
                              onClick={() => updateReservationStatus(reservation.id, 'refusee')}
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>

            <section style={{ marginBottom: 'var(--spacing-12)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-6)',
                  gap: 'var(--spacing-4)',
                  flexWrap: 'wrap',
                }}
              >
                <h3 style={{ fontSize: 'var(--title-lg)' }}>Mes annonces</h3>
                <button className="btn-outline" onClick={() => navigate('/creer-annonce')}>
                  Ajouter une annonce
                </button>
              </div>

              {(dashboard?.logements || []).length === 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--surface-lowest)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-8)',
                    boxShadow: 'var(--shadow-ambient)',
                    color: 'var(--on-surface-variant)',
                  }}
                >
                  Aucune annonce creee pour le moment.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--spacing-5)' }}>
                  {dashboard.logements.map((annonce) => (
                    <div
                      key={annonce.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '88px 1fr auto',
                        gap: 'var(--spacing-5)',
                        alignItems: 'center',
                        padding: 'var(--spacing-5)',
                        backgroundColor: 'var(--surface-lowest)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-ambient)',
                      }}
                    >
                      <img
                        src={annonce.photos?.[0] || fallbackImage}
                        alt={annonce.titre}
                        style={{
                          width: '88px',
                          height: '88px',
                          borderRadius: 'var(--radius-DEFAULT)',
                          objectFit: 'cover',
                        }}
                      />

                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-3)',
                            flexWrap: 'wrap',
                            marginBottom: 'var(--spacing-2)',
                          }}
                        >
                          <h4 style={{ fontSize: 'var(--title-md)', fontWeight: 800 }}>{annonce.titre}</h4>
                          <span className={annonce.est_actif ? 'badge badge-success' : 'badge badge-neutral'}>
                            {annonce.est_actif ? 'En ligne' : 'En pause'}
                          </span>
                          <span className="badge badge-neutral">{annonce.validation_statut}</span>
                        </div>
                        <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                          {annonce.ville} • {annonce.prix} DZD / nuit
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 'var(--spacing-5)',
                            flexWrap: 'wrap',
                            color: 'var(--on-surface-variant)',
                            fontSize: 'var(--body-sm)',
                          }}
                        >
                          <span>{annonce.nb_reservations || 0} reservations</span>
                          <span>{annonce.revenu || 0} DZD generes</span>
                          <span>{annonce.note_moyenne || 0}/5 de note</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => navigate(`/logement/${annonce.id}`)}
                          title="Voir l annonce"
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            border: '1px solid var(--outline-variant)',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => toggleStatus(annonce)}
                          title="Activer ou desactiver"
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            border: '1px solid var(--outline-variant)',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Power size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/creer-annonce?id=${annonce.id}`)}
                          title="Modifier"
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            border: '1px solid var(--outline-variant)',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteAnnonce(annonce.id)}
                          title="Supprimer"
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            border: '1px solid var(--outline-variant)',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={18} color="var(--error)" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={{ marginBottom: 'var(--spacing-16)' }}>
              <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-6)' }}>
                Reservations recentes
              </h3>

              {(dashboard?.reservations || []).length === 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--surface-lowest)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-8)',
                    boxShadow: 'var(--shadow-ambient)',
                    color: 'var(--on-surface-variant)',
                  }}
                >
                  Pas encore de reservation.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                  {dashboard.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      style={{
                        padding: 'var(--spacing-5)',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--surface-lowest)',
                        boxShadow: 'var(--shadow-ambient)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 'var(--spacing-4)',
                          flexWrap: 'wrap',
                          marginBottom: 'var(--spacing-3)',
                        }}
                      >
                        <div>
                          <h4 style={{ fontSize: 'var(--title-md)', marginBottom: 'var(--spacing-1)' }}>
                            {reservation.voyageur_prenom} {reservation.voyageur_nom}
                          </h4>
                          <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                            {reservation.logement_titre} • du {reservation.date_arrivee} au {reservation.date_depart}
                          </div>
                        </div>
                        <span
                          className={
                            reservation.statut === 'confirmee'
                              ? 'badge badge-success'
                              : reservation.statut === 'en_attente'
                                ? 'badge badge-warning'
                                : reservation.statut === 'refusee' ||
                                    reservation.statut === 'annulee_hote' ||
                                    reservation.statut === 'annulee_voyageur'
                                  ? 'badge badge-error'
                                  : 'badge badge-neutral'
                          }
                        >
                          {statusLabel[reservation.statut] || reservation.statut}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 'var(--spacing-4)',
                          flexWrap: 'wrap',
                          color: 'var(--on-surface-variant)',
                          fontSize: 'var(--body-sm)',
                          marginBottom: reservation.statut === 'en_attente' ? 'var(--spacing-4)' : 0,
                        }}
                      >
                        <span>{reservation.nb_voyageurs} voyageur(s)</span>
                        <span>{reservation.montant_total || 0} DZD</span>
                      </div>

                      {reservation.statut === 'en_attente' ? (
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                          <button
                            className="btn-primary"
                            onClick={() => updateReservationStatus(reservation.id, 'confirmee')}
                          >
                            Confirmer
                          </button>
                          <button
                            className="btn-outline"
                            onClick={() => updateReservationStatus(reservation.id, 'refusee')}
                          >
                            Refuser
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};
