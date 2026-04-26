import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { notificationsController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { Bell, Calendar, Heart, LayoutDashboard, LogOut, Menu, MessageCircle, ShieldCheck, X } from 'lucide-react';

const defaultAvatar = 'https://placehold.co/100x100?text=U';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      if (!user) {
        setUnreadCount(0);
        return;
      }

      try {
        const summary = await notificationsController.getNotificationSummary();
        if (active) {
          setUnreadCount(summary.unread_count || 0);
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    };

    loadSummary();
    return () => {
      active = false;
    };
  }, [user, location.pathname]);

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
    backgroundColor: isActive(path) ? 'rgba(15, 110, 86, 0.06)' : 'transparent',
  });

  return (
    <nav
      className="glass-nav"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--spacing-4) var(--spacing-6)',
        alignItems: 'center',
        maxWidth: '1120px',
        margin: '0 auto',
        width: '100%',
        backgroundColor: 'transparent',
      }}
    >
      <Link
        to="/"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: '800',
          color: 'var(--primary)',
          letterSpacing: '-0.05em',
        }}
      >
        algbnb
      </Link>

      <div style={{ display: 'none', gap: 'var(--spacing-3)', alignItems: 'center' }} className="desktop-controls">
        {user ? (
          <>
            {(user.role_type === 'hote' || user.role_type === 'admin') && (
              <Link to="/dashboard-hote" style={navLinkStyle('/dashboard-hote')}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
            )}
            {user.role_type === 'admin' && (
              <Link to="/admin" style={navLinkStyle('/admin')}>
                <ShieldCheck size={16} /> Admin
              </Link>
            )}
            <Link to="/reservations" style={navLinkStyle('/reservations')}>
              <Calendar size={16} /> Voyages
            </Link>
            <Link to="/favoris" style={navLinkStyle('/favoris')}>
              <Heart size={16} /> Favoris
            </Link>
            <Link to="/messages" style={navLinkStyle('/messages')}>
              <MessageCircle size={16} /> Messages
            </Link>
            <Link to="/notifications" style={{ ...navLinkStyle('/notifications'), position: 'relative' }}>
              <Bell size={16} /> Notifications
              {unreadCount > 0 ? <span className="nav-count-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
            </Link>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--surface-high)', margin: '0 var(--spacing-2)' }} />
            <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-high)',
                  overflow: 'hidden',
                  border: '2px solid var(--primary-container)',
                }}
              >
                <img src={user.photo_profil || defaultAvatar} alt={user.nomComplet || user.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontWeight: '600', fontSize: 'var(--body-sm)' }}>{user.nomComplet || [user.prenom, user.nom].filter(Boolean).join(' ')}</span>
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Se deconnecter"
              title="Se deconnecter"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: 'var(--spacing-2)', borderRadius: '50%' }}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link to="/connexion" style={{ fontWeight: '600', fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', padding: 'var(--spacing-2) var(--spacing-4)' }}>
              Connexion
            </Link>
            <Link to="/connexion">
              <button className="btn-primary" style={{ padding: 'var(--spacing-3) var(--spacing-6)' }}>
                Inscription
              </button>
            </Link>
          </>
        )}
      </div>

      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface)' }}
        className="mobile-menu-btn"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(249, 249, 248, 0.95)',
            backdropFilter: 'blur(20px)',
            zIndex: 49,
            padding: 'var(--spacing-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          className="mobile-menu-overlay"
        >
          {user ? (
            <>
              <Link to="/profil" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>
                Mon profil
              </Link>
              {(user.role_type === 'hote' || user.role_type === 'admin') && (
                <Link to="/dashboard-hote" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>
                  Dashboard hote
                </Link>
              )}
              {user.role_type === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>
                  Administration
                </Link>
              )}
              <Link to="/reservations" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>
                Mes voyages
              </Link>
              <Link to="/favoris" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>
                Favoris
              </Link>
              <Link to="/messages" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>
                Messages
              </Link>
              <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} style={{ padding: 'var(--spacing-4)', fontSize: 'var(--title-lg)', fontWeight: '600' }}>
                Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
              </Link>
              <div style={{ marginTop: 'auto' }}>
                <button className="btn-outline" onClick={handleLogout} style={{ width: '100%', padding: 'var(--spacing-4)', justifyContent: 'center' }}>
                  <LogOut size={18} /> Deconnexion
                </button>
              </div>
            </>
          ) : (
            <Link to="/connexion" onClick={() => setMobileMenuOpen(false)}>
              <button className="btn-primary" style={{ width: '100%', padding: 'var(--spacing-4)', justifyContent: 'center' }}>
                Connexion / Inscription
              </button>
            </Link>
          )}
        </div>
      )}

      <style>{`
        .nav-count-badge {
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: var(--error);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }
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
