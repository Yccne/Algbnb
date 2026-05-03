import React, { createContext, useContext, useEffect, useState } from 'react';
import { authController } from '@algbnb/core';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const SAVED_CREDENTIALS_KEY = 'algbnb_saved_credentials';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authController.getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [savedCredentials, setSavedCredentials] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVED_CREDENTIALS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const currentUser = authController.getCurrentUser();
        if (!currentUser) {
          if (mounted) setUser(null);
          return;
        }

        try {
          const refreshedUser = await authController.fetchCurrentUser();
          if (mounted) setUser(refreshedUser);
        } catch (fetchError) {
          // Si erreur réseau (backend éteint), garder l'utilisateur local
          // Si erreur 401 (token invalide/expiré), déconnecter
          const status = fetchError?.status || fetchError?.response?.status;
          if (status === 401 || status === 403) {
            await authController.logout();
            if (mounted) setUser(null);
          } else {
            // Erreur réseau : on garde l'utilisateur en cache local
            if (mounted) setUser(currentUser);
          }
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const nextUser = await authController.login(identifier, password);
      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const nextUser = await authController.register(userData);
      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (idToken, role = 'voyageur') => {
    setLoading(true);
    try {
      const nextUser = await authController.loginWithGoogle(idToken, role);
      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const nextUser = await authController.fetchCurrentUser();
    setUser(nextUser);
    return nextUser;
  };

  const updateProfile = async (payload) => {
    const nextUser = await authController.updateProfile(payload);
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authController.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Enregistrer les identifiants dans localStorage
  const saveCredentials = (identifier, password) => {
    const creds = { identifier, password };
    localStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify(creds));
    setSavedCredentials(creds);
  };

  // Supprimer les identifiants sauvegardés
  const clearSavedCredentials = () => {
    localStorage.removeItem(SAVED_CREDENTIALS_KEY);
    setSavedCredentials(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        updateProfile,
        savedCredentials,
        saveCredentials,
        clearSavedCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};