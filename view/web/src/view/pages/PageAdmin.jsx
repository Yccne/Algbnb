import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ban,
  Eye,
  EyeOff,
  Flag,
  History,
  Home,
  LogIn,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Unlock,
  UserCog,
  Users,
} from 'lucide-react';
import { adminController } from '@algbnb/controller-client';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';

const tabs = [
  { id: 'overview', label: 'Vue générale', icon: ShieldCheck },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'listings', label: 'Annonces', icon: Home },
  { id: 'disputes', label: 'Litiges', icon: Flag },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'reviews', label: 'Avis', icon: Star },
  { id: 'actions', label: 'Journal', icon: History },
];

const statusLabel = {
  actif: 'Actif',
  suspendu: 'Suspendu',
  bloque: 'Bloqué',
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  resolu: 'Résolu',
  ferme: 'Fermé',
  valide: 'Validée',
  refuse: 'Refusée',
  en_attente: 'En attente',
};

const badgeClass = (value) => {
  if (['actif', 'valide', 'resolu'].includes(value)) return 'badge badge-success';
  if (['ouvert', 'en_cours', 'en_attente', 'suspendu'].includes(value)) return 'badge badge-warning';
  if (['bloque', 'refuse', 'ferme'].includes(value)) return 'badge badge-error';
  return 'badge badge-neutral';
};

const includesText = (value) => String(value || '').trim();

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

const StatTile = ({ icon, label, value }) => {
  const IconComponent = icon;
  return (
    <div className="stat-card">
      <div>
        <span style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>{label}</span>
        <strong style={{ display: 'block', fontSize: 'var(--headline-lg)', marginTop: 'var(--spacing-2)' }}>{value ?? 0}</strong>
      </div>
      <IconComponent size={20} color="var(--primary)" />
    </div>
  );
};

const IdBadge = ({ label, value }) => (
  <span className="badge badge-neutral" title={`${label} ${value}`}>
    {label} #{value ?? '-'}
  </span>
);

const ActionButton = ({ icon: Icon, children, danger, ...props }) => (
  <button className={danger ? 'btn-ghost' : 'btn-outline'} style={danger ? { color: 'var(--error)' } : null} {...props}>
    {Icon ? <Icon size={16} /> : null}
    {children}
  </button>
);

const EmptyState = ({ children }) => (
  <div className="card" style={{ padding: 'var(--spacing-6)', color: 'var(--on-surface-variant)' }}>
    {children}
  </div>
);

export const PageAdmin = () => {
  const { user, startImpersonation } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  const [dialog, setDialog] = useState(null);

  const loadAdminData = useCallback(async (term = search) => {
    if (!user || user.role_type !== 'admin') return;
    setLoading(true);
    setError('');
    const params = { limit: 80 };
    if (includesText(term)) params.search = term.trim();
    try {
      const [
        statsData,
        usersData,
        listingsData,
        conversationsData,
        reviewsData,
        disputesData,
        actionsData,
      ] = await Promise.all([
        adminController.getAdminStats(),
        adminController.getAdminUsers(params),
        adminController.getAdminListings(params),
        adminController.getAdminConversations(params),
        adminController.getAdminReviews(params),
        adminController.getAdminDisputes(params),
        adminController.getAdminActions({ ...params, limit: 60 }),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setListings(listingsData);
      setConversations(conversationsData);
      setReviews(reviewsData);
      setDisputes(disputesData);
      setActions(actionsData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [search, user]);

  useEffect(() => {
    loadAdminData('');
  }, [loadAdminData]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadAdminData(search), 350);
    return () => window.clearTimeout(timer);
  }, [search, loadAdminData]);

  const runWithNote = ({ key, title, description, run }) => {
    setDialog({ key, title, description, note: '', run, error: '' });
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    const note = dialog.note.trim();
    if (!note) {
      setDialog((current) => ({ ...current, error: 'Ajoute une note de modération pour le journal.' }));
      return;
    }
    setSaving(dialog.key);
    setError('');
    try {
      await dialog.run(note);
      setDialog(null);
      await loadAdminData(search);
      if (selectedConversation) {
        const messages = await adminController.getAdminConversationMessages(selectedConversation.conversation_id);
        setConversationMessages(messages);
      }
    } catch (mutationError) {
      setDialog((current) => ({ ...current, error: mutationError.message }));
    } finally {
      setSaving('');
    }
  };

  const impersonate = async (target) => {
    setSaving(`impersonate-${target.id}`);
    setError('');
    try {
      await startImpersonation(target.id);
      navigate('/');
    } catch (impersonationError) {
      setError(impersonationError.message);
    } finally {
      setSaving('');
    }
  };

  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setConversationMessages([]);
    setError('');
    try {
      const messages = await adminController.getAdminConversationMessages(conversation.conversation_id);
      setConversationMessages(messages);
      setActiveTab('messages');
    } catch (conversationError) {
      setError(conversationError.message);
    }
  };

  const overview = useMemo(() => (
    <div style={{ display: 'grid', gap: 'var(--spacing-6)' }}>
      <div className="stats-grid">
        <StatTile icon={Users} label="Utilisateurs" value={stats?.nb_utilisateurs} />
        <StatTile icon={Home} label="Annonces visibles" value={stats?.nb_annonces} />
        <StatTile icon={Flag} label="Litiges ouverts" value={stats?.nb_litiges_ouverts} />
        <StatTile icon={EyeOff} label="Messages masqués" value={stats?.nb_messages_masques} />
        <StatTile icon={Star} label="Avis masqués" value={stats?.nb_avis_masques} />
        <StatTile icon={Ban} label="Comptes surveillés" value={stats?.nb_comptes_surveilles} />
      </div>

      <div className="card" style={{ padding: 'var(--spacing-6)' }}>
        <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-3)' }}>Actions de modération</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-4)' }}>
          Comptes à suspendre, annonces à masquer, avis/messages à modérer et litiges ouverts avec les utilisateurs.
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <ActionButton icon={Users} onClick={() => setActiveTab('users')}>Voir utilisateurs</ActionButton>
          <ActionButton icon={Home} onClick={() => setActiveTab('listings')}>Voir annonces</ActionButton>
          <ActionButton icon={Flag} onClick={() => setActiveTab('disputes')}>Voir litiges</ActionButton>
          <ActionButton icon={History} onClick={() => setActiveTab('actions')}>Voir journal</ActionButton>
        </div>
      </div>
    </div>
  ), [stats]);

  const renderUsers = () => (
    <div className="admin-list">
      {users.length === 0 ? <EmptyState>Aucun utilisateur trouvé.</EmptyState> : null}
      {users.map((item) => (
        <article className="admin-row" key={item.id}>
          <div className="admin-row-main">
            <div className="row-badges">
              <IdBadge label="Utilisateur" value={item.id} />
              <span className={badgeClass(item.statut_compte)}>{statusLabel[item.statut_compte] || item.statut_compte}</span>
              <span className="badge badge-neutral">{item.role_type}</span>
            </div>
            <h3>{[item.prenom, item.nom].filter(Boolean).join(' ') || item.email}</h3>
            <p>{item.email || 'Email absent'} · {item.telephone || 'Téléphone absent'}</p>
            <p className="muted">{item.nb_annonces || 0} annonce(s), {item.nb_reservations_voyageur || 0} voyage(s), {item.nb_litiges || 0} litige(s)</p>
          </div>
          <div className="admin-row-actions">
            {item.role_type !== 'admin' ? (
              <ActionButton
                icon={LogIn}
                disabled={saving === `impersonate-${item.id}` || item.statut_compte !== 'actif'}
                onClick={() => impersonate(item)}
              >
                Se connecter comme
              </ActionButton>
            ) : null}
            {item.role_type === 'admin' ? (
              <span className="badge badge-neutral">Admin non impersonnable</span>
            ) : item.statut_compte === 'actif' ? (
              <>
                <ActionButton
                  icon={Ban}
                  danger
                  disabled={saving === `user-suspend-${item.id}`}
                  onClick={() => runWithNote({
                    key: `user-suspend-${item.id}`,
                    title: `Suspendre utilisateur #${item.id}`,
                    description: item.email,
                    run: (note) => adminController.updateAdminUserStatus(item.id, 'suspendu', note),
                  })}
                >
                  Suspendre
                </ActionButton>
                <ActionButton
                  icon={Ban}
                  danger
                  disabled={saving === `user-block-${item.id}`}
                  onClick={() => runWithNote({
                    key: `user-block-${item.id}`,
                    title: `Bloquer utilisateur #${item.id}`,
                    description: item.email,
                    run: (note) => adminController.updateAdminUserStatus(item.id, 'bloque', note),
                  })}
                >
                  Bloquer
                </ActionButton>
              </>
            ) : (
              <ActionButton
                icon={Unlock}
                disabled={saving === `user-active-${item.id}`}
                onClick={() => runWithNote({
                  key: `user-active-${item.id}`,
                  title: `Réactiver utilisateur #${item.id}`,
                  description: item.email,
                  run: (note) => adminController.updateAdminUserStatus(item.id, 'actif', note),
                })}
              >
                Réactiver
              </ActionButton>
            )}
          </div>
        </article>
      ))}
    </div>
  );

  const renderListings = () => (
    <div className="admin-list">
      {listings.length === 0 ? <EmptyState>Aucune annonce trouvée.</EmptyState> : null}
      {listings.map((item) => (
        <article className="admin-row" key={item.id}>
          <div className="listing-thumb">
            {item.photos?.[0] ? <img src={item.photos[0]} alt={item.titre} /> : <Home size={28} />}
          </div>
          <div className="admin-row-main">
            <div className="row-badges">
              <IdBadge label="Annonce" value={item.id} />
              <IdBadge label="Hôte" value={item.id_hote} />
              <span className={item.est_actif ? 'badge badge-success' : 'badge badge-error'}>{item.est_actif ? 'Visible' : 'Masquée'}</span>
              <span className={badgeClass(item.validation_statut)}>{statusLabel[item.validation_statut] || item.validation_statut}</span>
            </div>
            <h3>{item.titre}</h3>
            <p>{item.ville || item.adresse} · {item.hote_prenom} {item.hote_nom} · {item.hote_email}</p>
            <p className="muted">{item.nb_reservations || 0} réservation(s), {item.nb_avis || 0} avis, note {item.note_moyenne || 0}/5</p>
          </div>
          <div className="admin-row-actions">
            {item.est_actif ? (
              <ActionButton
                icon={EyeOff}
                danger
                disabled={saving === `listing-hide-${item.id}`}
                onClick={() => runWithNote({
                  key: `listing-hide-${item.id}`,
                  title: `Masquer annonce #${item.id}`,
                  description: item.titre,
                  run: (note) => adminController.updateAdminListingPublication(item.id, false, note),
                })}
              >
                Masquer
              </ActionButton>
            ) : (
              <ActionButton
                icon={Eye}
                disabled={saving === `listing-show-${item.id}`}
                onClick={() => runWithNote({
                  key: `listing-show-${item.id}`,
                  title: `Réactiver annonce #${item.id}`,
                  description: item.titre,
                  run: (note) => adminController.updateAdminListingPublication(item.id, true, note),
                })}
              >
                Réactiver
              </ActionButton>
            )}
          </div>
        </article>
      ))}
    </div>
  );

  const renderDisputes = () => (
    <div className="admin-list">
      {disputes.length === 0 ? <EmptyState>Aucun litige trouvé.</EmptyState> : null}
      {disputes.map((item) => (
        <article className="admin-row" key={item.id}>
          <div className="admin-row-main">
            <div className="row-badges">
              <IdBadge label="Litige" value={item.id} />
              <IdBadge label="Réservation" value={item.id_reservation} />
              <IdBadge label="Conversation" value={item.id_conversation} />
              <span className={badgeClass(item.statut)}>{statusLabel[item.statut] || item.statut}</span>
            </div>
            <h3>{item.sujet}</h3>
            <p>{item.logement_titre || 'Réservation'} · voyageur #{item.voyageur_id || '-'} · hôte #{item.hote_id || '-'}</p>
            <p className="muted">{item.description}</p>
          </div>
          <div className="admin-row-actions">
            {item.id_conversation ? (
              <ActionButton
                icon={MessageSquare}
                onClick={() => {
                  const conversation = conversations.find((conv) => Number(conv.conversation_id) === Number(item.id_conversation));
                  if (conversation) openConversation(conversation);
                  else navigate('/messages', { state: { conversationId: item.id_conversation } });
                }}
              >
                Conversation
              </ActionButton>
            ) : null}
            {item.voyageur_id ? (
              <ActionButton icon={UserCog} onClick={() => impersonate({ id: item.voyageur_id, statut_compte: 'actif' })}>Voir voyageur</ActionButton>
            ) : null}
            {item.hote_id ? (
              <ActionButton icon={UserCog} onClick={() => impersonate({ id: item.hote_id, statut_compte: 'actif' })}>Voir hôte</ActionButton>
            ) : null}
            {item.statut !== 'resolu' ? (
              <ActionButton
                icon={Flag}
                disabled={saving === `dispute-resolve-${item.id}`}
                onClick={() => runWithNote({
                  key: `dispute-resolve-${item.id}`,
                  title: `Résoudre litige #${item.id}`,
                  description: item.sujet,
                  run: (note) => adminController.updateAdminDispute(item.id, { statut: 'resolu', resolution_note: note, note }),
                })}
              >
                Résoudre
              </ActionButton>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );

  const renderMessages = () => (
    <div className="messages-admin-grid">
      <div className="admin-list">
        {conversations.length === 0 ? <EmptyState>Aucune conversation trouvée.</EmptyState> : null}
        {conversations.map((item) => (
          <button
            className={`admin-row conversation-button ${selectedConversation?.conversation_id === item.conversation_id ? 'selected' : ''}`}
            key={item.conversation_id}
            onClick={() => openConversation(item)}
          >
            <div className="admin-row-main">
              <div className="row-badges">
                <IdBadge label="Conversation" value={item.conversation_id} />
                <IdBadge label="Utilisateur" value={item.utilisateur1_id} />
                <IdBadge label="Utilisateur" value={item.utilisateur2_id} />
                {item.nb_messages_masques > 0 ? <span className="badge badge-error">{item.nb_messages_masques} masqué(s)</span> : null}
              </div>
              <h3>{item.utilisateur1_prenom} {item.utilisateur1_nom} ↔ {item.utilisateur2_prenom} {item.utilisateur2_nom}</h3>
              <p>{item.dernier_message || (item.derniere_photo ? 'Photo envoyée' : 'Aucun message')}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="card conversation-panel">
        {!selectedConversation ? (
          <p className="muted">Sélectionne une conversation pour lire les messages et preuves photo.</p>
        ) : (
          <>
            <div className="row-badges" style={{ marginBottom: 'var(--spacing-4)' }}>
              <IdBadge label="Conversation" value={selectedConversation.conversation_id} />
            </div>
            <div className="admin-message-list">
              {conversationMessages.map((message) => (
                <div className="admin-message" key={message.id}>
                  <div className="row-badges">
                    <IdBadge label="Message" value={message.id} />
                    <IdBadge label="Expéditeur" value={message.id_expediteur} />
                    <span className={message.est_visible ? 'badge badge-success' : 'badge badge-error'}>{message.est_visible ? 'Visible' : 'Masqué'}</span>
                  </div>
                  <strong>{message.expediteur_prenom} {message.expediteur_nom}</strong>
                  {message.photo_url ? <img src={message.photo_url} alt="Preuve envoyée" className="message-proof" /> : null}
                  {message.contenu ? <p>{message.contenu}</p> : null}
                  <small>{formatDate(message.date_envoi)}</small>
                  <div style={{ marginTop: 'var(--spacing-3)' }}>
                    <ActionButton
                      icon={message.est_visible ? EyeOff : Eye}
                      danger={message.est_visible}
                      disabled={saving === `message-${message.id}`}
                      onClick={() => runWithNote({
                        key: `message-${message.id}`,
                        title: `${message.est_visible ? 'Masquer' : 'Restaurer'} message #${message.id}`,
                        description: message.contenu || 'Message photo',
                        run: (note) => adminController.updateAdminMessageVisibility(message.id, !message.est_visible, note),
                      })}
                    >
                      {message.est_visible ? 'Masquer' : 'Restaurer'}
                    </ActionButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="admin-list">
      {reviews.length === 0 ? <EmptyState>Aucun avis trouvé.</EmptyState> : null}
      {reviews.map((item) => (
        <article className="admin-row" key={item.id}>
          <div className="admin-row-main">
            <div className="row-badges">
              <IdBadge label="Avis" value={item.id} />
              <IdBadge label="Voyageur" value={item.id_voyageur} />
              <IdBadge label="Hôte" value={item.id_hote} />
              <IdBadge label="Logement" value={item.id_logement} />
              <span className={item.est_visible ? 'badge badge-success' : 'badge badge-error'}>{item.est_visible ? 'Visible' : 'Masqué'}</span>
            </div>
            <h3>{item.logement_titre}</h3>
            <p>{item.commentaire || 'Aucun commentaire textuel.'}</p>
            <p className="muted">Logement {item.note_logement}/5 · hôte {item.note_hote}/5</p>
          </div>
          <div className="admin-row-actions">
            {item.id_reservation ? (
              <ActionButton
                icon={Flag}
                disabled={saving === `review-dispute-${item.id}`}
                onClick={() => runWithNote({
                  key: `review-dispute-${item.id}`,
                  title: `Créer un litige depuis l'avis #${item.id}`,
                  description: item.commentaire || item.logement_titre,
                  run: (note) => adminController.createAdminDispute({
                    id_reservation: item.id_reservation,
                    id_ouverture: item.id_voyageur,
                    sujet: `Avis #${item.id} - ${item.logement_titre}`,
                    description: `${note}\n\nCommentaire signale : ${item.commentaire || 'Aucun commentaire textuel.'}`,
                    priorite: 'normale',
                    note,
                  }),
                })}
              >
                Créer un litige
              </ActionButton>
            ) : null}
            <ActionButton
              icon={item.est_visible ? EyeOff : Eye}
              danger={item.est_visible}
              disabled={saving === `review-${item.id}`}
              onClick={() => runWithNote({
                key: `review-${item.id}`,
                title: `${item.est_visible ? 'Masquer' : 'Restaurer'} avis #${item.id}`,
                description: item.commentaire,
                run: (note) => adminController.updateAdminReviewVisibility(item.id, !item.est_visible, note),
              })}
            >
              {item.est_visible ? 'Masquer' : 'Restaurer'}
            </ActionButton>
          </div>
        </article>
      ))}
    </div>
  );

  const renderActions = () => (
    <div className="admin-list">
      {actions.length === 0 ? <EmptyState>Aucune action journalisée.</EmptyState> : null}
      {actions.map((item) => (
        <article className="admin-row" key={item.id}>
          <div className="admin-row-main">
            <div className="row-badges">
              <IdBadge label="Action" value={item.id} />
              <IdBadge label="Admin" value={item.id_admin} />
              <IdBadge label={item.cible_type || 'Cible'} value={item.cible_id} />
            </div>
            <h3>{item.action}</h3>
            <p>{item.note || 'Action sans note.'}</p>
            <p className="muted">{item.admin_prenom} {item.admin_nom} · {formatDate(item.date_action)}</p>
          </div>
        </article>
      ))}
    </div>
  );

  const renderActiveTab = () => {
    if (activeTab === 'overview') return overview;
    if (activeTab === 'users') return renderUsers();
    if (activeTab === 'listings') return renderListings();
    if (activeTab === 'disputes') return renderDisputes();
    if (activeTab === 'messages') return renderMessages();
    if (activeTab === 'reviews') return renderReviews();
    return renderActions();
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-12)', paddingBottom: 'var(--spacing-16)' }}>
        <header style={{ marginBottom: 'var(--spacing-8)' }}>
          <h1 style={{ fontSize: 'var(--display-md)', marginBottom: 'var(--spacing-3)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <ShieldCheck size={34} /> Administration
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-sm)', maxWidth: '840px' }}>
            Console de modération pour suspendre des comptes, masquer annonces/avis/messages, suivre les litiges et tracer les décisions.
          </p>
        </header>

        <section className="card admin-toolbar">
          <div className="admin-search">
            <Search size={20} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher ID, utilisateur, annonce, conversation, litige..."
            />
          </div>
          <ActionButton icon={RefreshCw} onClick={() => loadAdminData(search)} disabled={loading}>Actualiser</ActionButton>
          <div className="admin-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} className={activeTab === tab.id ? 'tab-button active' : 'tab-button'} onClick={() => setActiveTab(tab.id)}>
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {error ? <div className="alert-error" style={{ marginTop: 'var(--spacing-5)' }}>{error}</div> : null}
        {loading ? <div className="spinner" style={{ margin: 'var(--spacing-10) auto' }} /> : (
          <section style={{ marginTop: 'var(--spacing-6)' }}>{renderActiveTab()}</section>
        )}
      </main>

      {dialog ? (
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3>{dialog.title}</h3>
            {dialog.description ? <p className="muted">{dialog.description}</p> : null}
            <label style={{ display: 'grid', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
              <span>Note de modération</span>
              <textarea
                className="input-field"
                rows={4}
                value={dialog.note}
                onChange={(event) => setDialog((current) => ({ ...current, note: event.target.value, error: '' }))}
                placeholder="Explique la raison de l'action pour le journal admin."
              />
            </label>
            {dialog.error ? <div className="alert-error" style={{ marginTop: 'var(--spacing-3)' }}>{dialog.error}</div> : null}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-5)' }}>
              <ActionButton icon={RotateCcw} onClick={() => setDialog(null)}>Annuler</ActionButton>
              <button className="btn-primary" disabled={saving === dialog.key} onClick={confirmDialog}>
                {saving === dialog.key ? 'Application...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNavBar />
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: var(--spacing-4);
        }
        .stat-card,
        .admin-row,
        .card {
          background: var(--surface-lowest);
          border: 1px solid var(--outline-variant);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-ambient);
        }
        .stat-card {
          padding: var(--spacing-5);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--spacing-4);
        }
        .admin-toolbar {
          padding: var(--spacing-4);
          display: grid;
          gap: var(--spacing-4);
        }
        .admin-search {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          background: var(--surface-low);
          border-radius: var(--radius-DEFAULT);
          padding: 0 var(--spacing-4);
          min-height: 52px;
        }
        .admin-search input {
          border: 0;
          outline: 0;
          background: transparent;
          width: 100%;
          font: inherit;
          color: var(--on-surface);
        }
        .admin-tabs,
        .row-badges,
        .admin-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-2);
          align-items: center;
        }
        .tab-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 0;
          padding: var(--spacing-3) var(--spacing-4);
          border-radius: var(--radius-full);
          background: var(--surface-low);
          color: var(--on-surface-variant);
          font-weight: 700;
          cursor: pointer;
        }
        .tab-button.active {
          background: var(--primary-container);
          color: var(--primary);
          box-shadow: inset 0 0 0 1px var(--primary);
        }
        .admin-list {
          display: grid;
          gap: var(--spacing-4);
        }
        .admin-row {
          padding: var(--spacing-5);
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: var(--spacing-4);
          align-items: center;
          text-align: left;
          color: inherit;
        }
        .admin-row-main {
          min-width: 0;
          display: grid;
          gap: var(--spacing-2);
        }
        .admin-row-main h3 {
          font-size: var(--title-md);
          margin: 0;
        }
        .admin-row-main p {
          margin: 0;
          color: var(--on-surface-variant);
        }
        .muted {
          color: var(--on-surface-variant);
          margin: 0;
        }
        .listing-thumb {
          width: 92px;
          height: 72px;
          border-radius: var(--radius-DEFAULT);
          background: var(--surface-low);
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .listing-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .messages-admin-grid {
          display: grid;
          grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
          gap: var(--spacing-5);
        }
        .conversation-button {
          width: 100%;
          cursor: pointer;
        }
        .conversation-button.selected {
          border-color: var(--primary);
        }
        .conversation-panel {
          padding: var(--spacing-5);
          min-height: 420px;
        }
        .admin-message-list {
          display: grid;
          gap: var(--spacing-4);
          max-height: 620px;
          overflow: auto;
        }
        .admin-message {
          border: 1px solid var(--outline-variant);
          border-radius: var(--radius-DEFAULT);
          padding: var(--spacing-4);
          display: grid;
          gap: var(--spacing-2);
        }
        .message-proof {
          max-width: min(360px, 100%);
          max-height: 240px;
          object-fit: cover;
          border-radius: var(--radius-DEFAULT);
          border: 1px solid var(--outline-variant);
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: grid;
          place-items: center;
          z-index: 80;
          padding: var(--spacing-4);
        }
        .modal-card {
          width: min(520px, 100%);
          background: var(--surface-lowest);
          border-radius: var(--radius-lg);
          padding: var(--spacing-6);
          box-shadow: var(--shadow-strong);
        }
        @media (max-width: 760px) {
          .admin-row,
          .messages-admin-grid {
            grid-template-columns: 1fr;
          }
          .admin-row-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
};
