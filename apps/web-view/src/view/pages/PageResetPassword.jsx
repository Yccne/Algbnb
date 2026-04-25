import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { authController } from '@algbnb/core';
import { Navbar } from '../components/Navbar';

export const PageResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Le lien de reinitialisation est incomplet.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authController.resetPassword(token, password);
      setSuccess('Mot de passe mis a jour. Tu peux maintenant te connecter.');
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-main)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />
      <div
        className="page-container"
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="animate-fadeInUp" style={{ maxWidth: '480px', width: '100%' }}>
          <h1
            style={{
              fontSize: 'var(--display-md)',
              marginBottom: 'var(--spacing-4)',
              lineHeight: 1.1,
            }}
          >
            Nouveau mot de passe
          </h1>
          <p
            style={{
              color: 'var(--on-surface-variant)',
              fontSize: 'var(--body-md)',
              marginBottom: 'var(--spacing-8)',
            }}
          >
            Definis un nouveau mot de passe pour retrouver l acces a ton compte.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--on-surface-variant)',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--on-surface-variant)',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--on-surface-variant)',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="input-field"
                style={{ paddingLeft: '42px' }}
              />
            </div>

            {error ? (
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'rgba(180, 35, 24, 0.08)',
                  color: 'var(--error)',
                  borderRadius: 'var(--radius-DEFAULT)',
                }}
              >
                {error}
              </div>
            ) : null}

            {success ? (
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'rgba(15, 110, 86, 0.08)',
                  color: 'var(--primary)',
                  borderRadius: 'var(--radius-DEFAULT)',
                }}
              >
                {success}
              </div>
            ) : null}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
            </button>
          </form>

          <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center' }}>
            <button
              className="btn-ghost"
              onClick={() => navigate('/connexion')}
              style={{ margin: '0 auto' }}
            >
              Retour a la connexion
            </button>
          </div>
        </div>
      </div>

      <footer
        style={{
          padding: 'var(--spacing-6)',
          textAlign: 'center',
          color: 'var(--on-surface-variant)',
          fontSize: 'var(--body-sm)',
        }}
      >
        <Link to="#" className="footer-link">
          Confidentialite
        </Link>
        <Link to="#" className="footer-link">
          Conditions
        </Link>
        <Link to="#" className="footer-link" style={{ marginRight: 0 }}>
          Aide
        </Link>
      </footer>
    </div>
  );
};
