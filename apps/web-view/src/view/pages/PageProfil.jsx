import React, { useEffect, useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { userController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';

const defaultAvatar = 'https://placehold.co/200x200?text=Profil';

export const PageProfil = () => {
  const { user, logout, updateProfile, savedCredentials, clearSavedCredentials } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', bio: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const data = await userController.getMyProfile();
        setProfile(data.user);
        setStats(data.stats);
        setForm({
          nom: data.user.nom || '',
          prenom: data.user.prenom || '',
          email: data.user.email || '',
          telephone: data.user.telephone || '',
          bio: data.user.bio || '',
        });
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    load();
  }, [user]);

  const saveProfile = async () => {
    try {
      const updated = await updateProfile(form);
      setProfile(updated);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  if (!user) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: 'var(--spacing-16)', textAlign: 'center' }}>Connecte-toi pour accéder à ton profil.</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        {profile && (
          <>
            <header style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center', borderBottom: '1px solid var(--surface-high)', paddingBottom: 'var(--spacing-16)', marginBottom: 'var(--spacing-12)' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--surface-high)', overflow: 'hidden' }}>
                <img src={profile.photo_profil || defaultAvatar} alt={profile.nomComplet} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                  <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{profile.nomComplet}</h1>
                  {!isEditing && (
                    <button className="btn-outline" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Edit2 size={16} /> Modifier
                    </button>
                  )}
                </div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>Membre depuis {profile.date_inscription?.slice(0, 10)}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-4)' }}>
                  <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                    <strong>{stats.nb_reservations || 0}</strong>
                    <div style={{ color: 'var(--on-surface-variant)' }}>Réservations</div>
                  </div>
                  <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                    <strong>{stats.nb_favoris || 0}</strong>
                    <div style={{ color: 'var(--on-surface-variant)' }}>Favoris</div>
                  </div>
                  <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                    <strong>{stats.nb_annonces || 0}</strong>
                    <div style={{ color: 'var(--on-surface-variant)' }}>Annonces</div>
                  </div>
                </div>
              </div>
            </header>

            {error && <div style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-4)', backgroundColor: 'rgba(180, 35, 24, 0.08)', color: 'var(--error)', borderRadius: 'var(--radius-DEFAULT)' }}>{error}</div>}

            {isEditing ? (
              <section style={{ backgroundColor: 'var(--surface-lowest)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-ambient)', marginBottom: 'var(--spacing-16)' }}>
                <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-6)' }}>Modifier mes informations</h2>
                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                  <input value={form.prenom} onChange={(event) => setForm((current) => ({ ...current, prenom: event.target.value }))} placeholder="Prénom" className="input-field" />
                  <input value={form.nom} onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))} placeholder="Nom" className="input-field" />
                  <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="input-field" />
                  <input value={form.telephone} onChange={(event) => setForm((current) => ({ ...current, telephone: event.target.value }))} placeholder="Téléphone" className="input-field" />
                  <textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder="Bio" rows="5" className="input-field" />
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-8)' }}>
                  <button className="btn-primary" onClick={saveProfile} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Save size={18} /> Enregistrer
                  </button>
                  <button className="btn-outline" onClick={() => setIsEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <X size={18} /> Annuler
                  </button>
                </div>
              </section>
            ) : (
              <section style={{ marginBottom: 'var(--spacing-16)' }}>
                <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-4)' }}>À propos</h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', lineHeight: 1.6 }}>{profile.bio || 'Aucune bio renseignée.'}</p>
                <div style={{ marginTop: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-4)' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Email</span>
                    <span style={{ fontSize: 'var(--body-md)' }}>{profile.email || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Téléphone</span>
                    <span style={{ fontSize: 'var(--body-md)' }}>{profile.telephone || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Rôle</span>
                    <span style={{ fontSize: 'var(--body-md)' }}>{profile.role_type}</span>
                  </div>
                </div>
              </section>
            )}

            {savedCredentials && (
              <button className="btn-outline" onClick={clearSavedCredentials} style={{ marginBottom: 'var(--spacing-2)' }}>
                🔐 Oublier mes identifiants
              </button>
            )}
            <button className="btn-outline" onClick={logout} style={{ color: 'var(--error)' }}>
              Déconnexion
            </button>
          </>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};