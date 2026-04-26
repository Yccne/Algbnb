import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';

const pages = {
  confidentialite: {
    title: 'Confidentialite',
    intro: 'Les donnees du compte servent uniquement a faire fonctionner les reservations, les annonces, les favoris et la messagerie.',
    points: [
      'Les mots de passe sont stockes sous forme hachee.',
      'Les informations de contact restent liees au compte utilisateur.',
      'Les photos envoyees servent aux profils, annonces et messages.',
    ],
  },
  conditions: {
    title: 'Conditions',
    intro: 'Algbnb permet de publier, rechercher et reserver des logements sans paiement en ligne.',
    points: [
      'Les hotes restent responsables de la precision de leurs annonces.',
      'Les voyageurs doivent reserver avec des informations exactes.',
      'Les annulations et validations sont gerees depuis les espaces utilisateur.',
    ],
  },
  aide: {
    title: 'Aide',
    intro: 'Retrouve les actions principales du site et les pages utiles pour continuer.',
    points: [
      'Pour publier un logement, connecte-toi avec un compte hote.',
      'Pour reserver, choisis les dates sur une fiche logement puis confirme la demande.',
      'Pour contacter un hote, utilise la messagerie depuis la fiche logement.',
    ],
  },
};

export const PageInfo = ({ type }) => {
  const page = pages[type] || pages.aide;

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)', maxWidth: '760px' }}>
        <h1 style={{ fontSize: 'var(--display-md)', lineHeight: 1.1, marginBottom: 'var(--spacing-5)' }}>
          {page.title}
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-8)' }}>
          {page.intro}
        </p>
        <div style={{ display: 'grid', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-10)' }}>
          {page.points.map((point) => (
            <div
              key={point}
              style={{
                padding: 'var(--spacing-5)',
                borderRadius: 'var(--radius-DEFAULT)',
                backgroundColor: 'var(--surface-lowest)',
                border: '1px solid var(--surface-high)',
              }}
            >
              {point}
            </div>
          ))}
        </div>
        <Link to="/" className="btn-primary">
          Retour a l accueil
        </Link>
      </main>
      <BottomNavBar />
    </div>
  );
};
