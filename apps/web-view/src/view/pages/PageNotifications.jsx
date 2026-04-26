import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';

const labelForType = (type) => {
  if (String(type).startsWith('rappel')) return 'Rappel';
  if (type === 'message') return 'Message';
  if (type === 'annulation') return 'Annulation';
  return 'Reservation';
};

export const PageNotifications = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await notificationsController.getNotifications({ limit: 50 });
      setItems(data.items || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markOneRead = async (notification) => {
    if (notification.est_lue) return;

    try {
      const updated = await notificationsController.markNotificationRead(notification.id);
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, est_lue: true } : item))
      );
    } catch (markError) {
      setError(markError.message);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsController.markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, est_lue: true })));
    } catch (markError) {
      setError(markError.message);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-6)', alignItems: 'flex-start', marginBottom: 'var(--spacing-10)', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: 'var(--spacing-4)', lineHeight: 1.1 }}>Notifications</h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>Demandes, confirmations, annulations, rappels de sejour et messages.</p>
          </div>
          {user ? (
            <button className="btn-outline" onClick={markAllRead} disabled={markingAll}>
              <CheckCheck size={18} /> {markingAll ? 'Mise a jour...' : 'Tout marquer comme lu'}
            </button>
          ) : null}
        </header>

        {loading ? (
          <div className="spinner"></div>
        ) : !user ? (
          <div style={{ padding: 'var(--spacing-10)', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
            Connecte-toi pour consulter tes notifications.
          </div>
        ) : (
          <>
            {error ? (
              <div style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-4)', backgroundColor: 'rgba(180, 35, 24, 0.08)', color: 'var(--error)', borderRadius: 'var(--radius-DEFAULT)' }}>
                {error}
              </div>
            ) : null}

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-16)', backgroundColor: 'var(--surface-lowest)', borderRadius: 'var(--radius-lg)' }}>
                <Bell size={42} style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-4)' }} />
                <h3 style={{ marginBottom: 'var(--spacing-3)' }}>Aucune notification pour le moment</h3>
                <p style={{ color: 'var(--on-surface-variant)' }}>Les confirmations de reservation, rappels et nouveaux messages apparaitront ici.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                {items.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markOneRead(notification)}
                    style={{
                      textAlign: 'left',
                      padding: 'var(--spacing-5)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: notification.est_lue ? 'var(--surface-lowest)' : 'rgba(15, 110, 86, 0.07)',
                      border: notification.est_lue ? '1px solid var(--surface-high)' : '1px solid rgba(15, 110, 86, 0.15)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-4)', alignItems: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
                      <span className={notification.est_lue ? 'badge badge-neutral' : 'badge badge-success'}>
                        {labelForType(notification.type)}
                      </span>
                      <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                        {notification.date_envoi?.slice(0, 16).replace('T', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--body-md)', fontWeight: notification.est_lue ? 500 : 700, marginBottom: 'var(--spacing-1)' }}>
                      {notification.contenu}
                    </div>
                    {notification.meta?.dateArrivee ? (
                      <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                        Sejour prevu a partir du {notification.meta.dateArrivee}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};
