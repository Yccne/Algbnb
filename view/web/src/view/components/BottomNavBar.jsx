import React from 'react';
import { Search, Heart, Calendar, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Recherche', icon: Search },
  { path: '/favoris', label: 'Favoris', icon: Heart },
  { path: '/reservations', label: 'Réservations', icon: Calendar },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
  { path: '/profil', label: 'Profil', icon: User },
];

export const BottomNavBar = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.path} 
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
              gap: '4px'
            }}
          >
            <Icon size={24} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400' }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
