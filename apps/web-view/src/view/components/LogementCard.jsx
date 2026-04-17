import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';

export const LogementCard = ({ logement }) => {
  const [isFav, setIsFav] = useState(false);

  return (
    <Link to={`/logement/${logement.id}`} className="card" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      textDecoration: 'none',
      color: 'inherit'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
      }}>
        <img 
          src={logement.photos[0]} 
          alt={logement.titre}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
        
        {/* Rating Badge - glass effect */}
        <div style={{
          position: 'absolute',
          top: 'var(--spacing-3)',
          right: 'var(--spacing-3)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: 'var(--label-sm)',
          fontWeight: '700'
        }}>
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          {logement.note}
        </div>

        {/* Favorite button - glass effect */}
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFav(!isFav); }}
          style={{
            position: 'absolute',
            top: 'var(--spacing-3)',
            left: 'var(--spacing-3)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Heart size={16} color={isFav ? '#ef4444' : '#191c1c'} fill={isFav ? '#ef4444' : 'none'} />
        </button>

        {/* Price chip on image */}
        <div style={{
          position: 'absolute',
          bottom: 'var(--spacing-3)',
          left: 'var(--spacing-3)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontWeight: '700',
          fontSize: 'var(--body-sm)'
        }}>
          {logement.prix} DZD <span style={{ fontWeight: '400', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>/ nuit</span>
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h3 style={{ fontSize: 'var(--body-md)', fontWeight: '700', lineHeight: 1.3 }}>
            {logement.titre}
          </h3>
        </div>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', marginBottom: 'var(--spacing-2)' }}>
          {logement.ville}
        </p>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>
          {logement.type} · {logement.voyageurs || 4} voyageurs
        </p>
      </div>
    </Link>
  );
};
