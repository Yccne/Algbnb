import React from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './view/context/AuthContext';
import { PageAccueil } from './view/pages/PageAccueil';
import { PageLogement } from './view/pages/PageLogement';
import { PageAuth } from './view/pages/PageAuth';
import { PageReservationConfirmation } from './view/pages/PagePaiement';
import { PageMesReservations } from './view/pages/PageMesReservations';
import { PageProfil } from './view/pages/PageProfil';
import { PageDashboardHote } from './view/pages/PageDashboardHote';
import { PageCreerAnnonce } from './view/pages/PageCreerAnnonce';
import { PageResultats } from './view/pages/PageResultats';
import { PageFavoris } from './view/pages/PageFavoris';
import { PageMessages } from './view/pages/PageMessages';
import { PageNotifications } from './view/pages/PageNotifications';
import { PageResetPassword } from './view/pages/PageResetPassword';
import { PageAdmin } from './view/pages/PageAdmin';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PageAccueil />} />
          <Route path="/resultats" element={<PageResultats />} />
          <Route path="/logement/:id" element={<PageLogement />} />
          <Route path="/reservation/confirmation" element={<PageReservationConfirmation />} />
          <Route path="/paiement" element={<Navigate to="/reservation/confirmation" replace />} />
          <Route path="/favoris" element={<PageFavoris />} />
          <Route path="/reservations" element={<PageMesReservations />} />
          <Route path="/messages" element={<PageMessages />} />
          <Route path="/notifications" element={<PageNotifications />} />
          <Route path="/profil" element={<PageProfil />} />
          <Route path="/connexion" element={<PageAuth />} />
          <Route path="/reset-password" element={<PageResetPassword />} />
          <Route path="/dashboard-hote" element={<PageDashboardHote />} />
          <Route path="/admin" element={<PageAdmin />} />
          <Route path="/creer-annonce" element={<PageCreerAnnonce />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
