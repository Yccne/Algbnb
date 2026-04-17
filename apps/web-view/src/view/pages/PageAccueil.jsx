import React, { useEffect, useState } from 'react';
import { logementController } from '@algbnb/core';
import { LogementCard } from '../components/LogementCard';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { ChevronRight, Search, MapPin, Calendar, User as UserIcon, Sparkles, Shield, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const categories = [
  { label: 'Villas', emoji: '🏡' },
  { label: 'Maisons traditionnelles', emoji: '🏛️' },
  { label: 'Appartements', emoji: '🏙️' },
  { label: 'Bord de mer', emoji: '🌊' },
  { label: 'Sahara', emoji: '🐪' },
  { label: 'Luxe', emoji: '✨' },
];

export const PageAccueil = () => {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lieu, setLieu] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/resultats');
  };

  useEffect(() => {
    const fetchLogements = async () => {
      setLoading(true);
      const data = await logementController.getLogements(); 
      setLogements(data);
      setLoading(false);
    };
    fetchLogements();
  }, []);

  return (
    <>
      <div className="glass-nav">
        <Navbar />
      </div>
      <div className="page-container" style={{ marginTop: 'var(--spacing-12)' }}>
        
        {/* Hero Section */}
        <div className="animate-fadeInUp" style={{ marginBottom: 'var(--spacing-12)', maxWidth: '800px' }}>
          <h1 style={{ fontSize: 'var(--display-lg)', lineHeight: '1.08', marginBottom: 'var(--spacing-4)', letterSpacing: '-0.03em' }}>
            L'art de séjourner<br/>en toute sérénité.
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--title-lg)', fontWeight: '400', lineHeight: '1.5' }}>
            Découvrez des demeures d'exception, curatées pour leur caractère unique et leur confort absolu.
          </p>
        </div>

        {/* Search Bar - CDC 3.1 */}
        <div className="animate-fadeInUp" style={{ marginBottom: 'var(--spacing-16)', animationDelay: '0.1s' }}>
          <form onSubmit={handleSearch} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: 'var(--surface-lowest)', 
            borderRadius: 'var(--radius-full)', 
            padding: 'var(--spacing-2) var(--spacing-3)', 
            boxShadow: 'var(--shadow-ambient)',
            flexWrap: 'wrap',
            gap: 'var(--spacing-1)'
          }}>
            <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-3) var(--spacing-4)', borderRight: '1px solid var(--surface-high)' }}>
              <MapPin size={20} color="var(--primary)" />
              <input type="text" placeholder="Où allez-vous ?" value={lieu} onChange={e => setLieu(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 'var(--body-md)', color: 'var(--on-surface)' }} />
            </div>
            <div style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-3) var(--spacing-4)', borderRight: '1px solid var(--surface-high)' }}>
              <Calendar size={20} color="var(--primary)" />
              <input type="text" placeholder="Arrivée - Départ" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => { if(!e.target.value) e.target.type = 'text'; }} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 'var(--body-md)', color: 'var(--on-surface)' }} />
            </div>
            <div style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-3) var(--spacing-4)' }}>
              <UserIcon size={20} color="var(--primary)" />
              <input type="number" min="1" placeholder="Voyageurs" style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 'var(--body-md)', color: 'var(--on-surface)' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, flexShrink: 0 }}>
              <Search size={20} />
            </button>
          </form>
        </div>

        {/* Category Chips */}
        <div className="animate-fadeInUp" style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap', marginBottom: 'var(--spacing-12)', animationDelay: '0.15s' }}>
          {categories.map((cat, idx) => (
            <button key={idx} className="chip chip-default" onClick={() => navigate('/resultats')} style={{ fontSize: 'var(--body-sm)', padding: 'var(--spacing-3) var(--spacing-5)' }}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Popular Listings */}
        <div className="animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-6)', animationDelay: '0.2s' }}>
          <div>
            <h2 style={{ fontSize: 'var(--headline-md)' }}>Logements populaires</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', marginTop: 'var(--spacing-2)' }}>Les escapades les plus prisées par notre communauté.</p>
          </div>
          <Link to="/resultats" className="btn-ghost" style={{ flexShrink: 0 }}>
            Voir tout <ChevronRight size={18} />
          </Link>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--spacing-6)',
            marginBottom: 'var(--spacing-16)'
          }}>
            {logements.slice(0, 3).map((logement, idx) => (
              <div key={logement.id} className="animate-fadeInUp" style={{ animationDelay: `${0.25 + idx * 0.08}s` }}>
                <LogementCard logement={logement} />
              </div>
            ))}
          </div>
        )}

        {/* Value Props - Tonal surface change instead of borders */}
        <div style={{ padding: 'var(--spacing-12)', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-16)' }}>
          <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-8)', textAlign: 'center' }}>Pourquoi choisir algbnb ?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-8)' }}>
            <div style={{ textAlign: 'center', padding: 'var(--spacing-6)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-4)' }}>
                <Shield size={24} color="var(--on-secondary-container)" />
              </div>
              <h4 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-2)' }}>Hôtes Certifiés</h4>
              <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, fontSize: 'var(--body-sm)' }}>Chaque hôte passe un entretien rigoureux pour garantir un accueil d'exception.</p>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--spacing-6)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-4)' }}>
                <Sparkles size={24} color="var(--on-secondary-container)" />
              </div>
              <h4 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-2)' }}>Expériences Locales</h4>
              <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, fontSize: 'var(--body-sm)' }}>Accédez à des activités secrètes et authentiques recommandées par vos hôtes.</p>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--spacing-6)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-4)' }}>
                <Star size={24} color="var(--on-secondary-container)" />
              </div>
              <h4 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-2)' }}>Sans Commission</h4>
              <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, fontSize: 'var(--body-sm)' }}>Plateforme locale sans frais de commission, des tarifs justes pour tous.</p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ padding: 'var(--spacing-8)', backgroundColor: 'var(--surface-lowest)', borderRadius: 'var(--radius-lg)', display: 'flex', gap: 'var(--spacing-6)', alignItems: 'center', marginBottom: 'var(--spacing-16)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '3px solid var(--primary-container)' }}>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80" alt="Jean-Marc" style={{width:'100%', height:'100%', objectFit:'cover'}} />
          </div>
          <div>
            <p style={{ fontStyle: 'italic', fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-2)', lineHeight: 1.4 }}>"Ma priorité est que chaque voyageur se sente comme chez lui, avec une touche de luxe en plus."</p>
            <p style={{ fontWeight: '600' }}>Jean-Marc <span style={{ color: 'var(--on-surface-variant)', fontWeight: '400' }}>— Super Hôte depuis 5 ans</span></p>
          </div>
        </div>

        <footer style={{ paddingTop: 'var(--spacing-8)', display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
          <p>© 2026 algbnb. Tous droits réservés.</p>
          <div>
            <Link to="#" className="footer-link">À propos</Link>
            <Link to="#" className="footer-link">Aide</Link>
            <Link to="#" className="footer-link" style={{marginRight: 0}}>Contact</Link>
          </div>
        </footer>
      </div>
      <BottomNavBar />
    </>
  );
};
