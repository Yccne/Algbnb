import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarClock,
  CheckCircle,
  Eye,
  Edit2,
  Flag,
  MessageSquare,
  Plus,
  Power,
  RefreshCw,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import { dashboardController, echangesController, logementController, reservationController } from '@algbnb/controller-client';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';

const fallbackImage = 'https://placehold.co/150x150?text=Annonce';

const statusLabel = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  terminee: 'Terminée',
  refusee: 'Refusée',
  annulee_hote: "Annulée par l'hôte",
  annulee_voyageur: 'Annulée par le voyageur',
  annulee_admin: "Annulée par l'administration",
};

const cancelledStatuses = ['annulee_hote', 'annulee_voyageur', 'annulee_admin', 'refusee'];

const notificationLabel = (type) => {
  if (String(type).startsWith('rappel')) return 'Rappel';
  if (type === 'message') return 'Message';
  if (type === 'annulation') return 'Annulation';
  if (type === 'echange') return 'Échange';
  return 'Réservation';
};

const exchangeStatusLabel = {
  discussion: 'Discussion',
  proposee: 'Dates proposées',
  contre_proposee: 'Contre-proposition',
  contrepartie_proposee: 'Accord final requis',
  acceptee: 'Accepté',
  refusee: 'Refusé',
  annulee: 'Annulé',
};

const exchangeBadgeClass = (status) => {
  if (status === 'acceptee') return 'badge badge-success';
  if (['proposee', 'contre_proposee', 'contrepartie_proposee', 'discussion'].includes(status)) return 'badge badge-warning';
  if (['refusee', 'annulee'].includes(status)) return 'badge badge-error';
  return 'badge badge-neutral';
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
  const [echanges, setEchanges] = useState([]);
  const [exchangeForms, setExchangeForms] = useState({});
  const [exchangeErrors, setExchangeErrors] = useState({});
  const [visibleRefusalReasons, setVisibleRefusalReasons] = useState({});
  const [exchangeSaving, setExchangeSaving] = useState('');
  const [openingDisputeId, setOpeningDisputeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, exchangeData] = await Promise.all([
        dashboardController.getHostDashboard(),
        user?.role_type === 'hote' ? echangesController.getMyExchanges() : Promise.resolve([]),
      ]);
      setDashboard(data);
      setEchanges(exchangeData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [user, loadDashboard]);

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

  const openDispute = async (reservation) => {
    setOpeningDisputeId(reservation.id);
    setError('');
    try {
      const result = await reservationController.ouvrirLitige(
        reservation.id,
        `Litige ouvert par l'hote depuis la reservation #${reservation.id}.`
      );
      navigate('/messages', { state: { conversationId: result.conversationId } });
    } catch (disputeError) {
      setError(disputeError.message);
    } finally {
      setOpeningDisputeId(null);
    }
  };

  const updateExchangeForm = (exchangeId, key, value) => {
    setExchangeForms((current) => ({
      ...current,
      [exchangeId]: {
        ...(current[exchangeId] || {}),
        [key]: value,
      },
    }));
    setExchangeErrors((current) => ({ ...current, [exchangeId]: '' }));
  };

  const setExchangeLocalError = (exchangeId, message) => {
    setExchangeErrors((current) => ({ ...current, [exchangeId]: message }));
  };

  const isValidDateRange = (start, end) => Boolean(start && end && end > start);

  const requireExchangeRange = (exchangeId, start, end, label) => {
    if (!start || !end) {
      setExchangeLocalError(exchangeId, `${label} : renseigne les deux dates.`);
      return false;
    }
    if (!isValidDateRange(start, end)) {
      setExchangeLocalError(exchangeId, `${label} : la date de fin doit etre apres la date de debut.`);
      return false;
    }
    return true;
  };

  const toggleExchangePreference = async (annonce) => {
    if (user?.role_type !== 'hote') {
      setError("Seuls les hôtes peuvent ouvrir une annonce à l'échange.");
      return;
    }

    const nextOpen = !annonce.echange_ouvert;
    const message = nextOpen
      ? annonce.echange_message || 'Ouvert à un échange de logement entre hôtes.'
      : '';

    setExchangeSaving(`pref-${annonce.id}`);
    setError('');
    try {
      await echangesController.updateExchangePreference(annonce.id, {
        est_ouvert: nextOpen,
        message,
      });
      await loadDashboard();
    } catch (preferenceError) {
      setError(preferenceError.message);
    } finally {
      setExchangeSaving('');
    }
  };

  const submitRequesterDates = async (exchange) => {
    const form = exchangeForms[exchange.id] || {};
    const start = form.demandeur_date_debut || exchange.demandeur_date_debut || '';
    const end = form.demandeur_date_fin || exchange.demandeur_date_fin || '';
    if (!requireExchangeRange(exchange.id, start, end, 'Sejour demandeur')) {
      return;
    }
    setExchangeSaving(`requester-${exchange.id}`);
    setError('');
    try {
      await echangesController.proposeRequesterDates(exchange.id, {
        demandeur_date_debut: start,
        demandeur_date_fin: end,
      });
      await loadDashboard();
    } catch (exchangeError) {
      setExchangeLocalError(exchange.id, exchangeError.message);
    } finally {
      setExchangeSaving('');
    }
  };

  const respondReceiver = async (exchange, decision) => {
    const form = exchangeForms[exchange.id] || {};
    const payload = { decision };
    if (decision === 'accepter' || decision === 'contre_proposer') {
      const receiverStart = form.receveur_date_debut || exchange.receveur_date_debut || '';
      const receiverEnd = form.receveur_date_fin || exchange.receveur_date_fin || '';
      if (!requireExchangeRange(exchange.id, receiverStart, receiverEnd, 'Sejour receveur')) {
        return;
      }
      payload.receveur_date_debut = receiverStart;
      payload.receveur_date_fin = receiverEnd;
    }
    if (decision === 'contre_proposer') {
      const requesterStart = form.demandeur_date_debut || exchange.demandeur_date_debut || '';
      const requesterEnd = form.demandeur_date_fin || exchange.demandeur_date_fin || '';
      if (!requireExchangeRange(exchange.id, requesterStart, requesterEnd, 'Nouvelle periode demandeur')) {
        return;
      }
      payload.demandeur_date_debut = requesterStart;
      payload.demandeur_date_fin = requesterEnd;
    }
    if (decision === 'refuser') {
      const reason = String(form.motif_refus || '').trim();
      if (!reason) {
        setExchangeLocalError(exchange.id, 'Indique le motif du refus.');
        return;
      }
      payload.motif_refus = reason;
    }

    setExchangeSaving(`receiver-${exchange.id}`);
    setError('');
    try {
      await echangesController.respondAsReceiver(exchange.id, payload);
      await loadDashboard();
    } catch (exchangeError) {
      setExchangeLocalError(exchange.id, exchangeError.message);
    } finally {
      setExchangeSaving('');
    }
  };

  const decideFinal = async (exchange, decision) => {
    const form = exchangeForms[exchange.id] || {};
    const payload = { decision };
    if (decision === 'refuser') {
      const reason = String(form.motif_refus_final || '').trim();
      if (!reason) {
        setExchangeLocalError(exchange.id, 'Indique le motif du refus final.');
        return;
      }
      payload.motif_refus = reason;
    }

    setExchangeSaving(`final-${exchange.id}`);
    setError('');
    try {
      await echangesController.decideFinal(exchange.id, payload);
      await loadDashboard();
    } catch (exchangeError) {
      setExchangeLocalError(exchange.id, exchangeError.message);
    } finally {
      setExchangeSaving('');
    }
  };

  const cancelExchange = async (exchange) => {
    if (!window.confirm("Annuler cette demande d'échange ?")) {
      return;
    }

    setExchangeSaving(`cancel-${exchange.id}`);
    setError('');
    try {
      await echangesController.cancelExchange(exchange.id, {
        motif_annulation: 'Annulation depuis le dashboard hôte.',
      });
      await loadDashboard();
    } catch (exchangeError) {
      setExchangeLocalError(exchange.id, exchangeError.message);
    } finally {
      setExchangeSaving('');
    }
  };

  const renderExchangeActions = (exchange) => {
    const isRequester = String(exchange.id_hote_demandeur) === String(user?.id);
    const isReceiver = String(exchange.id_hote_receveur) === String(user?.id);
    const form = exchangeForms[exchange.id] || {};
    const disabled = exchangeSaving.endsWith(`-${exchange.id}`);

    if (isRequester && ['discussion', 'proposee', 'contre_proposee'].includes(exchange.statut)) {
      return (
        <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
          {exchange.statut === 'contre_proposee' ? (
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
              L'autre hôte a envoyé une contre-proposition. Tu peux l'accepter, refuser avec motif, ou renvoyer une nouvelle période.
            </p>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-3)' }}>
            <input
              type="date"
              className="input-field"
              value={form.demandeur_date_debut || exchange.demandeur_date_debut || ''}
              onChange={(event) => updateExchangeForm(exchange.id, 'demandeur_date_debut', event.target.value)}
            />
            <input
              type="date"
              className="input-field"
              value={form.demandeur_date_fin || exchange.demandeur_date_fin || ''}
              onChange={(event) => updateExchangeForm(exchange.id, 'demandeur_date_fin', event.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
            <button className="btn-primary" disabled={disabled} onClick={() => submitRequesterDates(exchange)}>
              <CheckCircle size={17} /> {exchange.statut === 'contre_proposee' ? 'Renvoyer ces dates' : 'Proposer ces dates'}
            </button>
            {exchange.statut === 'contre_proposee' ? (
              <button className="btn-primary" disabled={disabled} onClick={() => decideFinal(exchange, 'accepter')}>
                <CheckCircle size={17} /> Accepter la contre-proposition
              </button>
            ) : null}
            <button className="btn-outline" disabled={disabled} onClick={() => navigate('/messages', { state: { conversationId: exchange.id_conversation } })}>
              <MessageSquare size={17} /> Discuter
            </button>
            {exchange.statut === 'contre_proposee' ? (
              <>
                <input
                  className="input-field"
                  value={form.motif_refus_final || ''}
                  onChange={(event) => updateExchangeForm(exchange.id, 'motif_refus_final', event.target.value)}
                  placeholder="Motif si tu refuses"
                  style={{ minWidth: '240px', flex: '1 1 240px' }}
                />
                <button className="btn-ghost" disabled={disabled} onClick={() => decideFinal(exchange, 'refuser')}>
                  <XCircle size={17} /> Refuser
                </button>
              </>
            ) : (
              <button className="btn-ghost" disabled={disabled} onClick={() => cancelExchange(exchange)}>
                Annuler
              </button>
            )}
          </div>
        </div>
      );
    }

    if (isReceiver && exchange.statut === 'proposee') {
      return (
        <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
            Renseigne tes dates de contrepartie, ou ajuste aussi les dates demandées pour faire une contre-proposition.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-3)' }}>
            <input
              type="date"
              className="input-field"
              value={form.demandeur_date_debut || exchange.demandeur_date_debut || ''}
              onChange={(event) => updateExchangeForm(exchange.id, 'demandeur_date_debut', event.target.value)}
            />
            <input
              type="date"
              className="input-field"
              value={form.demandeur_date_fin || exchange.demandeur_date_fin || ''}
              onChange={(event) => updateExchangeForm(exchange.id, 'demandeur_date_fin', event.target.value)}
            />
            <input
              type="date"
              className="input-field"
              value={form.receveur_date_debut || exchange.receveur_date_debut || ''}
              onChange={(event) => updateExchangeForm(exchange.id, 'receveur_date_debut', event.target.value)}
            />
            <input
              type="date"
              className="input-field"
              value={form.receveur_date_fin || exchange.receveur_date_fin || ''}
              onChange={(event) => updateExchangeForm(exchange.id, 'receveur_date_fin', event.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
            <button className="btn-primary" disabled={disabled} onClick={() => respondReceiver(exchange, 'accepter')}>
              <CheckCircle size={17} /> Envoyer mes dates
            </button>
            <button className="btn-outline" disabled={disabled} onClick={() => respondReceiver(exchange, 'contre_proposer')}>
              <RefreshCw size={17} /> Faire une contre-proposition
            </button>
            <button className="btn-outline" disabled={disabled} onClick={() => navigate('/messages', { state: { conversationId: exchange.id_conversation } })}>
              <MessageSquare size={17} /> Discuter
            </button>
            <input
              className="input-field"
              value={form.motif_refus || ''}
              onChange={(event) => updateExchangeForm(exchange.id, 'motif_refus', event.target.value)}
              placeholder="Motif si tu refuses"
              style={{ minWidth: '220px', flex: '1 1 220px' }}
            />
            <button className="btn-ghost" disabled={disabled} onClick={() => respondReceiver(exchange, 'refuser')}>
              <XCircle size={17} /> Refuser
            </button>
          </div>
        </div>
      );
    }

    if (isRequester && exchange.statut === 'contrepartie_proposee') {
      return (
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <button className="btn-primary" disabled={disabled} onClick={() => decideFinal(exchange, 'accepter')}>
            <CheckCircle size={17} /> Accepter l'échange
          </button>
          <button className="btn-outline" disabled={disabled} onClick={() => navigate('/messages', { state: { conversationId: exchange.id_conversation } })}>
            <MessageSquare size={17} /> Discuter
          </button>
          <button className="btn-ghost" disabled={disabled} onClick={() => decideFinal(exchange, 'refuser')}>
            <XCircle size={17} /> Refuser
          </button>
          <input
            className="input-field"
            value={form.motif_refus_final || ''}
            onChange={(event) => updateExchangeForm(exchange.id, 'motif_refus_final', event.target.value)}
            placeholder="Motif si tu refuses"
            style={{ minWidth: '240px', flex: '1 1 240px' }}
          />
        </div>
      );
    }

    if (['discussion', 'proposee', 'contre_proposee', 'contrepartie_proposee'].includes(exchange.statut)) {
      return (
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <button className="btn-outline" disabled={disabled} onClick={() => navigate('/messages', { state: { conversationId: exchange.id_conversation } })}>
            <MessageSquare size={17} /> Discuter
          </button>
          <button className="btn-ghost" disabled={disabled} onClick={() => cancelExchange(exchange)}>
            Annuler
          </button>
        </div>
      );
    }

    return (
      <button className="btn-outline" onClick={() => navigate('/messages', { state: { conversationId: exchange.id_conversation } })}>
        <MessageSquare size={17} /> Voir la conversation
      </button>
    );
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
          Connecte-toi en hôte pour accéder au dashboard.
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
              Espace hôte
            </h4>
            <h1
              style={{
                fontSize: 'var(--display-md)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: 'var(--spacing-3)',
              }}
            >
              Pilotage des annonces et réservations
            </h1>
            <p
              style={{
                color: 'var(--on-surface-variant)',
                fontSize: 'var(--body-md)',
                maxWidth: '680px',
              }}
            >
              Vue récap de tes annonces, demandes, montants estimés et notifications de réservation.
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
                Suis l'activité de tes annonces, tes demandes et tes séjours en cours.
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
                    Réservations confirmées
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
                    Montant généré
                  </div>
                  <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>
                    {dashboard?.stats?.revenu_total || 0} DZD
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                  <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>
                    Note moyenne hôte
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
                  <h3 style={{ fontSize: 'var(--title-lg)' }}>Notifications récentes</h3>
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
                  <h3 style={{ fontSize: 'var(--title-lg)' }}>Demandes à traiter</h3>
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
                            {reservation.logement_titre} • {formatDate(reservation.date_arrivee)} au {formatDate(reservation.date_depart)}
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
                          {user?.role_type === 'hote' ? (
                            <span className={annonce.echange_ouvert ? 'badge badge-success' : 'badge badge-neutral'}>
                              {annonce.echange_ouvert ? "Ouvert à l'échange" : 'Échange fermé'}
                            </span>
                          ) : null}
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
                          <span>{annonce.nb_reservations || 0} réservations</span>
                          <span>{annonce.revenu || 0} DZD générés</span>
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
                        {user?.role_type === 'hote' ? (
                          <button
                            onClick={() => toggleExchangePreference(annonce)}
                            disabled={exchangeSaving === `pref-${annonce.id}`}
                            title="Ouvrir ou fermer l'échange"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              border: '1px solid var(--outline-variant)',
                              background: annonce.echange_ouvert ? 'var(--primary-container)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              opacity: exchangeSaving === `pref-${annonce.id}` ? 0.6 : 1,
                            }}
                          >
                            <RefreshCw size={18} />
                          </button>
                        ) : null}
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

            {user?.role_type === 'hote' ? (
              <section style={{ marginBottom: 'var(--spacing-12)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--spacing-4)',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--spacing-6)',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-2)' }}>
                      Échanges entre hôtes
                    </h3>
                    <p style={{ color: 'var(--on-surface-variant)' }}>
                      Active une annonce, discute avec un autre hôte, puis valide les dates des deux logements.
                    </p>
                  </div>
                  <button className="btn-outline" onClick={() => navigate('/resultats')}>
                    Voir les logements ouverts
                  </button>
                </div>

                {echanges.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: 'var(--surface-lowest)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--spacing-8)',
                      boxShadow: 'var(--shadow-ambient)',
                      color: 'var(--on-surface-variant)',
                    }}
                  >
                    Aucun échange en cours. Ouvre une annonce à l'échange ou propose un échange depuis une fiche logement.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 'var(--spacing-5)' }}>
                    {echanges.map((exchange) => {
                      const isRequester = String(exchange.id_hote_demandeur) === String(user.id);
                      const ownTitle = isRequester ? exchange.logement_demandeur_titre : exchange.logement_receveur_titre;
                      const otherTitle = isRequester ? exchange.logement_receveur_titre : exchange.logement_demandeur_titre;
                      const otherHost = isRequester
                        ? `${exchange.hote_receveur_prenom || ''} ${exchange.hote_receveur_nom || ''}`.trim()
                        : `${exchange.hote_demandeur_prenom || ''} ${exchange.hote_demandeur_nom || ''}`.trim();

                      return (
                        <article
                          key={exchange.id}
                          style={{
                            backgroundColor: 'var(--surface-lowest)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-5)',
                            boxShadow: 'var(--shadow-ambient)',
                            display: 'grid',
                            gap: 'var(--spacing-4)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                            <div>
                              <h4 style={{ fontSize: 'var(--title-md)', marginBottom: 'var(--spacing-1)' }}>
                                {ownTitle} contre {otherTitle}
                              </h4>
                              <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                                Avec {otherHost || 'un autre hôte'} - demande #{exchange.id}
                              </p>
                            </div>
                            <span className={exchangeBadgeClass(exchange.statut)}>
                              {exchangeStatusLabel[exchange.statut] || exchange.statut}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                              gap: 'var(--spacing-4)',
                              color: 'var(--on-surface-variant)',
                              fontSize: 'var(--body-sm)',
                            }}
                          >
                            <div style={{ backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-DEFAULT)', padding: 'var(--spacing-4)' }}>
                              <strong style={{ color: 'var(--on-surface)' }}>Séjour demandeur</strong>
                              <div>{exchange.demandeur_date_debut && exchange.demandeur_date_fin ? `${formatDate(exchange.demandeur_date_debut)} au ${formatDate(exchange.demandeur_date_fin)}` : 'Dates à proposer'}</div>
                            </div>
                            <div style={{ backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-DEFAULT)', padding: 'var(--spacing-4)' }}>
                              <strong style={{ color: 'var(--on-surface)' }}>Séjour receveur</strong>
                              <div>{exchange.receveur_date_debut && exchange.receveur_date_fin ? `${formatDate(exchange.receveur_date_debut)} au ${formatDate(exchange.receveur_date_fin)}` : 'Dates à confirmer'}</div>
                            </div>
                          </div>

                          {exchangeErrors[exchange.id] ? (
                            <div style={{ color: 'var(--error)', fontSize: 'var(--body-sm)' }}>
                              {exchangeErrors[exchange.id]}
                            </div>
                          ) : null}

                          {exchange.motif_refus ? (
                            <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
                              <button
                                type="button"
                                className="btn-outline"
                                onClick={() =>
                                  setVisibleRefusalReasons((current) => ({
                                    ...current,
                                    [exchange.id]: !current[exchange.id],
                                  }))
                                }
                                style={{ justifySelf: 'start' }}
                              >
                                <Eye size={16} /> {visibleRefusalReasons[exchange.id] ? 'Masquer le motif' : 'Voir le motif du refus'}
                              </button>
                              {visibleRefusalReasons[exchange.id] ? (
                                <p style={{ color: 'var(--error)', fontSize: 'var(--body-sm)' }}>
                                  {exchange.motif_refus}
                                </p>
                              ) : null}
                            </div>
                          ) : null}

                          {renderExchangeActions(exchange)}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}

            <section style={{ marginBottom: 'var(--spacing-16)' }}>
              <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-6)' }}>
                Réservations récentes
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
                  Pas encore de réservation.
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
                            {reservation.logement_titre} • du {formatDate(reservation.date_arrivee)} au {formatDate(reservation.date_depart)}
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
                                    reservation.statut === 'annulee_voyageur' ||
                                    reservation.statut === 'annulee_admin'
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

                      {!cancelledStatuses.includes(reservation.statut) ? (
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap', marginTop: 'var(--spacing-3)' }}>
                          <button
                            className="btn-outline"
                            onClick={() => openDispute(reservation)}
                            disabled={openingDisputeId === reservation.id}
                          >
                            <Flag size={16} /> {openingDisputeId === reservation.id ? 'Ouverture...' : 'Ouvrir un litige'}
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
