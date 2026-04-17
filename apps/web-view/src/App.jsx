import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './view/context/AuthContext';
import { PageAccueil } from './view/pages/PageAccueil';
import { PageLogement } from './view/pages/PageLogement';
import { PageAuth } from './view/pages/PageAuth';
import { PagePaiement } from './view/pages/PagePaiement';
import { PageMesReservations } from './view/pages/PageMesReservations';
import { PageProfil } from './view/pages/PageProfil';
import { PageDashboardHote } from './view/pages/PageDashboardHote';
import { PageCreerAnnonce } from './view/pages/PageCreerAnnonce';
import { PageResultats } from './view/pages/PageResultats';
import { PageFavoris } from './view/pages/PageFavoris';
import { PageMessages } from './view/pages/PageMessages';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PageAccueil />} />
          <Route path="/resultats" element={<PageResultats />} />
          <Route path="/logement/:id" element={<PageLogement />} />
          <Route path="/paiement" element={<PagePaiement />} />
          <Route path="/favoris" element={<PageFavoris />} />
          <Route path="/reservations" element={<PageMesReservations />} />
          <Route path="/messages" element={<PageMessages />} />
          <Route path="/profil" element={<PageProfil />} />
          <Route path="/connexion" element={<PageAuth />} />
          <Route path="/dashboard-hote" element={<PageDashboardHote />} />
          <Route path="/creer-annonce" element={<PageCreerAnnonce />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
