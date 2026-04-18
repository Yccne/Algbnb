import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LayoutDashboard, LogOut, Menu, X, Heart, MessageCircle, Calendar } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    fontWeight: '600',
    fontSize: 'var(--body-sm)',
    color: isActive(path) ? 'var(--primary)' : 'var(--on-surface-variant)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: 'var(--spacing-2) var(--spacing-3)',
    borderRadius: 'var(--radius-full)',
    transition: 'all 0.2s ease',
    backgroundColor: isActive(path) ? 'rgba(15, 110, 86, 0.06)' : 'transparent'
  });

  return (
    <nav className="glass-nav" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: 'var(--spacing-4) var(--spacing-6)',
      alignItems: 'center',
      maxWidth: '1120px',
      margin: '0 auto',
      width: '100%',
      backgroundColor: 'transparent'
    }}>
      <Link to="/" style={{ 
        fontFamily: 'var(--font-display)', 
        fontSize: '1.5rem',
        fontWeight: '800',
        color: 'var(--primary)',
        letterSpacing: '-0.05em'
      }}>
        algbnb
      </Link>
      
      {/* Desktop Nav */}
      <div style={{ display: 'none', gap: 'var(--spacing-3)', alignItems: 'center' }} className="desktop-controls">
        {user ? (
          <>
            <Link to="/dashboard-hote" style={navLinkStyle('/dashboard-hote')}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link to="/reservations" style={navLinkStyle('/reservations')}>
              <Calendar size={16} /> Voyages
            </Link>
            <Link to="/favoris" style={navLinkStyle('/favoris')}>
              <Heart size={16} /> Favoris
            </Link>
            <Link to="/messages" style={navLinkStyle('/messages')}>
              <MessageCircle size={16} /> Messages
            </Link>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--surface-high)', margin: '0 var(--spacing-2)' }} />
            <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--surface-high)', overflow: 'hidden', border: '2px solid var(--primary-container)' }}>
                <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontWeight: '600', fontSize: 'var(--body-sm)' }}>{user.nom}</span>
            </Link>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: 'var(--spacing-2)', borderRadius: '50%' }}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link to="/connexion" style={{ fontWeight: '600', fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', padding: 'var(--spacing-2) var(--spacing-4)' }}>Connexion</Link>
            <Link to="/connexion"><button className="btn-primary" style={{ padding: 'var(--spacing-3) var(--spacing-6)' }}>Inscription</button></Link>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface)' }}
        className="mobile-menu-btn"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(249, 249, 248, 0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 49,
          padding: 'var(--spacing-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
          animation: 'fadeIn 0.2s ease-out'
        }} className="mobile-menu-overlay">
          {user ? (
            <>
              <Link to="/profil" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>Mon Profil</Link>
              <Link to="/dashboard-hote" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>Dashboard Hôte</Link>
              <Link to="/reservations" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>Mes Voyages</Link>
              <Link to="/favoris" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>Favoris</Link>
              <Link to="/messages" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>Messages</Link>
              <div style={{ marginTop: 'auto' }}>
                <button className="btn-outline" onClick={handleLogout} style={{ width: '100%', padding: 'var(--spacing-4)', justifyContent: 'center' }}>
                  <LogOut size={18} /> Déconnexion
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/connexion" onClick={() => setMobileMenuOpen(false)}>
                <button className="btn-primary" style={{ width: '100%', padding: 'var(--spacing-4)', justifyContent: 'center' }}>Connexion / Inscription</button>
              </Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-controls { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
};
