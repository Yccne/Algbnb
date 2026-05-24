import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { favorisController } from '@algbnb/controller-client';
import { useAuth } from '../context/AuthContext';

const fallbackImage = 'https://placehold.co/800x600?text=Photo+Logement';

export const LogementCard = ({ logement, initialFavorite = false, onFavoriteChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(initialFavorite);
  const [saving, setSaving] = useState(false);
  const image = logement.photos?.[0] || fallbackImage;

  useEffect(() => {
    setIsFav(initialFavorite);
  }, [initialFavorite, logement.id]);

  const handleToggleFavorite = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (saving) {
      return;
    }

    if (!user) {
      navigate('/connexion');
      return;
    }

    setSaving(true);
    try {
      if (isFav) {
        await favorisController.supprimerFavori(logement.id);
      } else {
        await favorisController.ajouterFavori(logement.id);
      }

      const next = !isFav;
      setIsFav(next);
      onFavoriteChange?.(next);
    } catch (error) {
      console.error('Erreur favoris:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Link
      to={`/logement/${logement.id}`}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      >
        <img
          src={image}
          alt={logement.titre}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseEnter={(event) => {
            event.target.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(event) => {
            event.target.style.transform = 'scale(1)';
          }}
        />

        <div
          style={{
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
            fontWeight: '700',
          }}
        >
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          {Number(logement.note || 0).toFixed(1)}
        </div>

        <button
          onClick={handleToggleFavorite}
          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
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
            transition: 'transform 0.2s ease',
            opacity: saving ? 0.6 : 1,
          }}
          disabled={saving}
        >
          <Heart size={16} color={isFav ? '#ef4444' : '#191c1c'} fill={isFav ? '#ef4444' : 'none'} />
        </button>

        <div
          style={{
            position: 'absolute',
            bottom: 'var(--spacing-3)',
            left: 'var(--spacing-3)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontWeight: '700',
            fontSize: 'var(--body-sm)',
          }}
        >
          {logement.prix} DZD <span style={{ fontWeight: '400', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>/ nuit</span>
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-4)' }}>
        <h3 style={{ fontSize: 'var(--body-md)', fontWeight: '700', lineHeight: 1.3, marginBottom: '4px' }}>{logement.titre}</h3>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', marginBottom: 'var(--spacing-2)' }}>{logement.ville}</p>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>
          {logement.type} - {logement.voyageurs || 1} voyageur{(logement.voyageurs || 1) > 1 ? 's' : ''}
        </p>
        {logement.echange?.estOuvert ? (
          <span className="badge badge-success" style={{ marginTop: 'var(--spacing-3)' }}>
            Échange possible
          </span>
        ) : null}
      </div>
    </Link>
  );
};
