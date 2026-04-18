import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Edit2, Save, X } from 'lucide-react';

export const PageProfil = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profilData, setProfilData] = useState({
    nom: user ? user.nom : 'Amine Benali',
    email: user ? user.email : 'amine@example.com',
    telephone: '+213 5 55 12 34 56',
    aPropos: "Passionné de voyages et de découvertes architecturales. J'aime partager mes bonnes adresses et découvrir des lieux qui racontent une histoire unique à travers le monde."
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const saveProfile = () => {
    setIsEditing(false);
    alert('Profil mis à jour avec succès !');
  };

  const avisProfile = [
    {
      auteur: "Samia L.",
      date: "Mai 2026",
      texte: "Un hôte exceptionnel ! Amine a été très réactif et de bon conseil pour mon séjour à Alger."
    },
    {
      auteur: "Marc V.",
      date: "Avril 2024",
      texte: "Logement impeccable et accueil chaleureux. Je recommande vivement l'expérience avec Alexandre."
    },
    {
      auteur: "Fahd K.",
      date: "Mars 2026",
      texte: "Parfait de A à Z. La communication était fluide et le lieu magnifique."
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        
        <header style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center', borderBottom: '1px solid var(--surface-high)', paddingBottom: 'var(--spacing-16)', marginBottom: 'var(--spacing-12)' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--surface-high)', overflow: 'hidden' }}>
            <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&q=80" alt="Alexandre" style={{width:'100%', height:'100%', objectFit:'cover'}} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
              <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {profilData.nom}
              </h1>
              {!isEditing && (
                <button className="btn-outline" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--spacing-2) var(--spacing-4)' }}>
                  <Edit2 size={16} /> Modifier profile
                </button>
              )}
            </div>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>
              Membre depuis Juin 2021
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/dashboard-hote')}>
                Mon Dashboard Hôte
              </button>
              <button className="btn-outline" onClick={() => navigate('/reservations')}>
                Mes Voyages
              </button>
              <button className="btn-outline" onClick={() => navigate('/creer-annonce')}>
                Créer une annonce
              </button>
              {user && (
                <button className="btn-outline" style={{ color: 'var(--error)' }} onClick={handleLogout}>
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', gap: 'var(--spacing-16)', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 600px' }}>
            
            {isEditing ? (
              <section style={{ backgroundColor: 'var(--surface-lowest)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-ambient)', marginBottom: 'var(--spacing-16)' }}>
                <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-6)' }}>Modifier vos informations</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Nom complet</label>
                    <input type="text" value={profilData.nom} onChange={e => setProfilData({...profilData, nom: e.target.value})} style={{ padding: 'var(--spacing-3)', width: '100%', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-DEFAULT)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Email</label>
                    <input type="email" value={profilData.email} onChange={e => setProfilData({...profilData, email: e.target.value})} style={{ padding: 'var(--spacing-3)', width: '100%', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-DEFAULT)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Téléphone</label>
                    <input type="tel" value={profilData.telephone} onChange={e => setProfilData({...profilData, telephone: e.target.value})} style={{ padding: 'var(--spacing-3)', width: '100%', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-DEFAULT)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>À propos de moi</label>
                    <textarea rows="4" value={profilData.aPropos} onChange={e => setProfilData({...profilData, aPropos: e.target.value})} style={{ padding: 'var(--spacing-3)', width: '100%', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-DEFAULT)', resize: 'vertical' }} />
                  </div>
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
                <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-4)' }}>À propos de moi</h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', lineHeight: 1.6 }}>
                  {profilData.aPropos}
                </p>
                <div style={{ marginTop: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Email</span>
                    <span style={{ fontSize: 'var(--body-md)' }}>{profilData.email}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Téléphone</span>
                    <span style={{ fontSize: 'var(--body-md)' }}>{profilData.telephone}</span>
                  </div>
                </div>
              </section>
            )}

            <section>
              <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-8)' }}>Avis (12)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                {avisProfile.map((av, idx) => (
                  <div key={idx} style={{ paddingBottom: 'var(--spacing-6)', borderBottom: '1px solid var(--surface-high)' }}>
                    <h4 style={{ fontSize: 'var(--title-lg)', fontWeight: 'bold' }}>{av.auteur}</h4>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px', marginBottom: 'var(--spacing-4)' }}>{av.date}</p>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', fontStyle: 'italic' }}>"{av.texte}"</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer style={{ padding: 'var(--spacing-6) 0', borderTop: '1px solid var(--surface-high)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
        <Link to="#" className="footer-link">Confidentialité</Link>
        <Link to="#" className="footer-link">Conditions</Link>
        <Link to="#" className="footer-link">Plan du site</Link>
        <Link to="#" className="footer-link" style={{marginRight: 0}}>Destinations</Link>
      </footer>
      
      <BottomNavBar />
    </div>
  );
};
