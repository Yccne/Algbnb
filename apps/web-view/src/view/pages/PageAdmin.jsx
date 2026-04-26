import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { adminController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';

export const PageAdmin = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdminData = useCallback(async () => {
    if (!user || user.role_type !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [statsData, usersData, listingsData, disputesData] = await Promise.all([
        adminController.getAdminStats(),
        adminController.getAdminUsers(),
        adminController.getAdminListings(),
        adminController.getAdminDisputes(),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setListings(listingsData);
      setDisputes(disputesData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const updateUserStatus = async (id, statut_compte) => {
    try {
      await adminController.updateAdminUserStatus(id, statut_compte);
      setUsers((current) =>
        current.map((item) => (item.id === id ? { ...item, statut_compte } : item))
      );
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const updateListingValidation = async (id, validation_statut) => {
    try {
      await adminController.updateAdminListingValidation(id, validation_statut);
      setListings((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                validation_statut,
                est_actif: validation_statut === 'valide' ? item.est_actif : false,
              }
            : item
        )
      );
    } catch (updateError) {
      setError(updateError.message);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-3)' }}>
            <ShieldCheck size={24} />
            <h1 style={{ fontSize: 'var(--display-md)', lineHeight: 1.1 }}>Administration</h1>
          </div>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>
            Vue d ensemble des utilisateurs, annonces, litiges et indicateurs du site.
          </p>
        </header>

        {loading ? (
          <div className="spinner"></div>
        ) : !user || user.role_type !== 'admin' ? (
          <div style={{ padding: 'var(--spacing-10)', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
            Cette page est reservee aux administrateurs.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-8)' }}>
            {error ? (
              <div style={{ padding: 'var(--spacing-4)', backgroundColor: 'rgba(180, 35, 24, 0.08)', color: 'var(--error)', borderRadius: 'var(--radius-DEFAULT)' }}>
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
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>Utilisateurs</div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats?.nb_utilisateurs || 0}</div>
              </div>
              <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>Hotes</div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats?.nb_hotes || 0}</div>
              </div>
              <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>Voyageurs</div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats?.nb_voyageurs || 0}</div>
              </div>
              <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>Annonces</div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats?.nb_annonces || 0}</div>
              </div>
              <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>Reservations</div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats?.nb_reservations || 0}</div>
              </div>
              <div className="card" style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>Revenu total</div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 800 }}>{stats?.revenu_total || 0} DZD</div>
              </div>
            </section>

            <section style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
              <h2 style={{ fontSize: 'var(--title-lg)' }}>Utilisateurs</h2>
              {users.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: 'var(--spacing-4)', alignItems: 'center', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-DEFAULT)', backgroundColor: 'var(--surface-lowest)', boxShadow: 'var(--shadow-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.prenom} {item.nom}</div>
                    <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>{item.email || item.telephone || 'Sans contact'}</div>
                  </div>
                  <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                    {item.role_type} - {item.est_verifie ? 'verifie' : 'non verifie'}
                  </div>
                  <select className="input-field" value={item.statut_compte} onChange={(event) => updateUserStatus(item.id, event.target.value)} style={{ minWidth: '150px' }}>
                    <option value="actif">Actif</option>
                    <option value="suspendu">Suspendu</option>
                    <option value="bloque">Bloque</option>
                  </select>
                </div>
              ))}
            </section>

            <section style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
              <h2 style={{ fontSize: 'var(--title-lg)' }}>Moderation des annonces</h2>
              {listings.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: 'var(--spacing-4)', alignItems: 'center', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-DEFAULT)', backgroundColor: 'var(--surface-lowest)', boxShadow: 'var(--shadow-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.titre}</div>
                    <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>{item.ville} - {item.hote_prenom} {item.hote_nom}</div>
                  </div>
                  <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                    {item.est_actif ? 'Publiee' : 'Hors ligne'}
                  </div>
                  <select className="input-field" value={item.validation_statut} onChange={(event) => updateListingValidation(item.id, event.target.value)} style={{ minWidth: '150px' }}>
                    <option value="en_attente">En attente</option>
                    <option value="valide">Validee</option>
                    <option value="refuse">Refusee</option>
                  </select>
                </div>
              ))}
            </section>

            <section style={{ display: 'grid', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-16)' }}>
              <h2 style={{ fontSize: 'var(--title-lg)' }}>Litiges</h2>
              {disputes.length === 0 ? (
                <div style={{ padding: 'var(--spacing-5)', backgroundColor: 'var(--surface-lowest)', borderRadius: 'var(--radius-DEFAULT)' }}>
                  Aucun litige ouvert pour le moment.
                </div>
              ) : (
                disputes.map((item) => (
                  <div key={item.id} style={{ padding: 'var(--spacing-5)', backgroundColor: 'var(--surface-lowest)', borderRadius: 'var(--radius-DEFAULT)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 'var(--spacing-2)' }}>{item.sujet}</div>
                    <div style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>{item.description}</div>
                    <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>{item.auteur_prenom} {item.auteur_nom} - {item.statut}</div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};
