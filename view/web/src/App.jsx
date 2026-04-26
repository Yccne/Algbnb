import React from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './view/context/AuthContext';
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
import { PageInfo } from './view/pages/PageInfo';

const RouteGate = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="spinner" style={{ marginTop: 'var(--spacing-16)' }} />;
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  if (roles?.length && !roles.includes(user.role_type)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

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
          <Route path="/favoris" element={<RouteGate><PageFavoris /></RouteGate>} />
          <Route path="/reservations" element={<RouteGate><PageMesReservations /></RouteGate>} />
          <Route path="/messages" element={<RouteGate><PageMessages /></RouteGate>} />
          <Route path="/notifications" element={<RouteGate><PageNotifications /></RouteGate>} />
          <Route path="/profil" element={<RouteGate><PageProfil /></RouteGate>} />
          <Route path="/connexion" element={<PageAuth />} />
          <Route path="/inscription" element={<PageAuth />} />
          <Route path="/reset-password" element={<PageResetPassword />} />
          <Route path="/dashboard-hote" element={<RouteGate roles={['hote', 'admin']}><PageDashboardHote /></RouteGate>} />
          <Route path="/admin" element={<RouteGate roles={['admin']}><PageAdmin /></RouteGate>} />
          <Route path="/creer-annonce" element={<RouteGate roles={['hote', 'admin']}><PageCreerAnnonce /></RouteGate>} />
          <Route path="/confidentialite" element={<PageInfo type="confidentialite" />} />
          <Route path="/conditions" element={<PageInfo type="conditions" />} />
          <Route path="/aide" element={<PageInfo type="aide" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
