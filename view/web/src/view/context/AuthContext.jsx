import React, { createContext, useContext, useEffect, useState } from 'react';
import { adminController, authController } from '@algbnb/controller-client';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authController.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const currentUser = authController.getCurrentUser();
        if (!currentUser) {
          if (mounted) setUser(null);
          return;
        }

        const refreshedUser = await authController.fetchCurrentUser();
        if (mounted) setUser(refreshedUser);
      } catch {
        await authController.logout();
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

  const loginWithSocial = async (provider, idToken, role = 'voyageur') => {
    setLoading(true);
    try {
      const nextUser = await authController.loginWithSocial(provider, idToken, role);
      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = (idToken, role = 'voyageur') => loginWithSocial('google', idToken, role);

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

  const startImpersonation = async (userId) => {
    const adminToken = authController.getToken();
    const adminUser = authController.getCurrentUser();
    const session = await adminController.startAdminImpersonation(userId);
    const nextUser = authController.startImpersonationSession({
      adminToken,
      adminUser,
      token: session.token,
      user: session.user,
      targetUserId: userId,
    });
    setUser(nextUser);
    return nextUser;
  };

  const returnToAdmin = async () => {
    const restored = authController.restoreAdminSession();
    if (!restored?.user) {
      await logout();
      return null;
    }
    setUser(restored.user);
    if (restored.targetUserId) {
      await adminController.endAdminImpersonation(restored.targetUserId).catch(() => null);
    }
    return restored.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, loginWithSocial, logout, refreshUser, updateProfile, startImpersonation, returnToAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
