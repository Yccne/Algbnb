import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';

export const PageDashboardHote = () => {
  const navigate = useNavigate();

  const [annonces, setAnnonces] = useState([
    { id: 1, titre: 'Dar El Dey - Casbah', ville: 'Alger', prix: 18000, active: true },
    { id: 2, titre: 'Appartement Haut Standing Hydra', ville: 'Alger', prix: 22000, active: true },
    { id: 3, titre: 'Chalet Cap Carbon', ville: 'Béjaïa', prix: 12000, active: false },
  ]);

  const toggleStatus = (id) => {
    setAnnonces(annonces.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAnnonce = (id) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      setAnnonces(annonces.filter(a => a.id !== id));
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-16)' }}>
          <div>
            <h4 style={{ fontSize: 'var(--title-lg)', color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-2)' }}>Algbnb Hôte</h4>
            <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Édition Luxe</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
             <button className="btn-primary" onClick={() => navigate('/creer-annonce')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <Plus size={18} /> Nouvelle annonce
             </button>
             <div style={{ textAlign: 'right' }}>
               <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'bold' }}>Alexandre D.</h3>
               <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>Super-hôte</p>
             </div>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--surface-high)', cursor: 'pointer' }} onClick={() => navigate('/profil')}></div>
          </div>
        </header>

        <section style={{ marginBottom: 'var(--spacing-16)' }}>
          <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-2)' }}>Bonjour, Alexandre</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', marginBottom: 'var(--spacing-8)' }}>
            Voici un aperçu de vos performances pour le mois de Juin.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-6)' }}>
            <div className="card" style={{ padding: 'var(--spacing-8)', cursor: 'pointer' }} onClick={() => navigate('/resultats')}>
               <h3 style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', fontWeight: 'normal', marginBottom: 'var(--spacing-2)' }}>Annonces actives</h3>
               <p style={{ fontSize: 'var(--headline-md)', fontWeight: 'bold' }}>12</p>
            </div>
            <div className="card" style={{ padding: 'var(--spacing-8)', cursor: 'pointer' }} onClick={() => navigate('/reservations')}>
               <h3 style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', fontWeight: 'normal', marginBottom: 'var(--spacing-2)' }}>Réservations ce mois</h3>
               <p style={{ fontSize: 'var(--headline-md)', fontWeight: 'bold' }}>48</p>
            </div>
            <div className="card" style={{ padding: 'var(--spacing-8)' }}>
               <h3 style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', fontWeight: 'normal', marginBottom: 'var(--spacing-2)' }}>Revenus ce mois</h3>
               <p style={{ fontSize: 'var(--headline-md)', fontWeight: 'bold' }}>125 000 DZD</p>
            </div>
            <div className="card" style={{ padding: 'var(--spacing-8)' }}>
               <h3 style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', fontWeight: 'normal', marginBottom: 'var(--spacing-2)' }}>Taux d'occupation</h3>
               <p style={{ fontSize: 'var(--headline-md)', fontWeight: 'bold' }}>92 %</p>
            </div>
          </div>
        </section>

        {/* Section: Mes Annonces */}
        <section style={{ marginBottom: 'var(--spacing-16)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
            <h3 style={{ fontSize: 'var(--title-lg)' }}>Mes annonces</h3>
            <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 'var(--body-sm)' }} onClick={() => navigate('/resultats')}>Voir toutes</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {annonces.map(annonce => (
              <div key={annonce.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-6)', backgroundColor: 'var(--surface-lowest)', borderRadius: 'var(--radius-DEFAULT)', boxShadow: 'var(--shadow-ambient)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-high)' }}></div>
                  <div>
                    <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'bold' }}>{annonce.titre}</h4>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>{annonce.ville} • {annonce.prix} DZD / nuit</p>
                    <span style={{ display: 'inline-block', marginTop: 'var(--spacing-2)', fontSize: '12px', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: annonce.active ? 'var(--primary-container)' : 'var(--surface-high)', color: annonce.active ? 'var(--on-primary-container)' : 'var(--on-surface-variant)' }}>
                      {annonce.active ? 'En ligne' : 'En pause'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                  <button onClick={() => toggleStatus(annonce.id)} title={annonce.active ? "Mettre en pause" : "Activer"} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--outline-variant)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Power size={18} color={annonce.active ? "var(--warning)" : "var(--primary)"} />
                  </button>
                  <button onClick={() => navigate('/creer-annonce')} title="Modifier" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--outline-variant)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit2 size={18} color="var(--on-surface-variant)" />
                  </button>
                  <button onClick={() => deleteAnnonce(annonce.id)} title="Supprimer" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--outline-variant)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={18} color="var(--error)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-12)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
              <h3 style={{ fontSize: 'var(--title-lg)' }}>Prochaines réservations</h3>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 'var(--body-sm)' }} onClick={() => navigate('/reservations')}>Voir tout</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--surface-high)', cursor: 'pointer' }} onClick={() => navigate('/logement/1')}>
                 <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'bold' }}>Sarah Mitchell</h4>
                 <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>2 adultes • Dar El Dey - Casbah</p>
              </div>
              <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--surface-high)', cursor: 'pointer' }} onClick={() => navigate('/logement/2')}>
                 <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'bold' }}>Marc Lefebvre</h4>
                 <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>1 voyageur • Appartement Haut Standing Hydra</p>
              </div>
              <div style={{ padding: 'var(--spacing-4)', cursor: 'pointer' }} onClick={() => navigate('/logement/3')}>
                 <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'bold' }}>Léa Dubois</h4>
                 <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>4 voyageurs • Chalet Cap Carbon</p>
              </div>
            </div>
          </div>

          <div>
             <div className="card" style={{ padding: 'var(--spacing-8)', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary)', border: 'none', marginBottom: 'var(--spacing-8)' }}>
                <h4 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-2)' }}>Devenez Hôte Élite</h4>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--body-sm)', lineHeight: 1.6 }}>Réalisez 5 réservations supplémentaires sans annulation pour débloquer le badge Élite.</p>
             </div>
             
             <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-6)' }}>Messages récents</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--surface-high)', cursor: 'pointer' }} onClick={() => navigate('/messages')}>
                 <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'bold' }}>Julien Petit</h4>
                 <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>"Est-il possible d'arriver plus tôt pour..."</p>
              </div>
              <div style={{ padding: 'var(--spacing-4)', cursor: 'pointer' }} onClick={() => navigate('/messages')}>
                 <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'bold' }}>Chloé Bernard</h4>
                 <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>"Merci beaucoup pour les conseils sur les..."</p>
              </div>
            </div>
          </div>
        </section>

      </div>
      <BottomNavBar />
    </div>
  );
};
