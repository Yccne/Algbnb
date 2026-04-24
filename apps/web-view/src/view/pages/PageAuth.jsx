import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { authController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup } from 'firebase/auth';

export const PageAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(null);
  const [role, setRole] = useState('voyageur');
  const [error, setError] = useState('');
  const [providers, setProviders] = useState({ google: false, facebook: false });

  const { login, register, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    authController.getAuthProviders().then(setProviders).catch(() => null);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Envoie le token au backend pour valider et créer l'utilisateur
      await loginWithGoogle(idToken, role);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors de la connexion Google');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (resetMode) {
        if (!email.trim()) {
          throw new Error('Entre ton adresse e-mail pour recevoir un lien de reinitialisation.');
        }

        const response = await authController.forgotPassword(email.trim());
        setResetSent(response);
        return;
      }

      if (isLogin) {
        if (!identifier.trim()) {
          throw new Error('Entre ton e-mail ou ton numero de telephone.');
        }

        await login(identifier.trim(), password);
      } else {
        if (!email.trim() && !telephone.trim()) {
          throw new Error('Renseigne au moins un e-mail ou un numero de telephone.');
        }

        const parts = nom.trim().split(/\s+/).filter(Boolean);
        await register({
          prenom: parts[0] || '',
          nom: parts.slice(1).join(' ') || parts[0] || '',
          email: email.trim() || null,
          telephone: telephone.trim() || null,
          mot_de_passe: password,
          role_type: role,
        });
      }

      navigate('/');
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (resetMode) {
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
              Reinitialiser le mot de passe
            </h1>
            <p
              style={{
                color: 'var(--on-surface-variant)',
                fontSize: 'var(--body-md)',
                marginBottom: 'var(--spacing-8)',
              }}
            >
              Saisis ton e-mail pour generer un lien de reinitialisation.
            </p>

            {resetSent ? (
              <div
                style={{
                  padding: 'var(--spacing-6)',
                  backgroundColor: 'rgba(15, 110, 86, 0.08)',
                  borderRadius: 'var(--radius-DEFAULT)',
                }}
              >
                <p style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: 'var(--spacing-2)' }}>
                  Lien genere
                </p>
                <p
                  style={{
                    color: 'var(--on-surface-variant)',
                    fontSize: 'var(--body-sm)',
                    marginBottom: 'var(--spacing-3)',
                  }}
                >
                  {resetSent.message}
                </p>
                {resetSent.reset_url ? (
                  <Link to={`/reset-password?token=${encodeURIComponent(resetSent.reset_token || '')}`} className="btn-outline">
                    Definir un nouveau mot de passe
                  </Link>
                ) : null}
                {resetSent.reset_token ? (
                  <code
                    style={{
                      display: 'block',
                      wordBreak: 'break-all',
                      fontSize: '12px',
                      marginTop: 'var(--spacing-4)',
                    }}
                  >
                    Token: {resetSent.reset_token}
                  </code>
                ) : null}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div style={{ position: 'relative' }}>
                  <Mail
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
                    type="email"
                    placeholder="Adresse e-mail"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
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

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: 'var(--spacing-4)' }}>
                  Generer le lien
                </button>
              </form>
            )}

            <button
              onClick={() => {
                setResetMode(false);
                setResetSent(null);
                setError('');
              }}
              style={{
                display: 'block',
                margin: 'var(--spacing-6) auto 0',
                color: 'var(--on-surface-variant)',
                fontSize: 'var(--body-sm)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Retour a la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="animate-fadeInUp" style={{ maxWidth: '480px', width: '100%', margin: 'var(--spacing-12) auto' }}>
          <h1
            style={{
              fontSize: 'var(--display-md)',
              marginBottom: 'var(--spacing-4)',
              lineHeight: 1.1,
            }}
          >
            {isLogin ? 'Connexion' : 'Creer un compte'}
          </h1>
          <p
            style={{
              color: 'var(--on-surface-variant)',
              fontSize: 'var(--body-md)',
              marginBottom: 'var(--spacing-8)',
            }}
          >
            Accede a ton espace voyageur ou hote.
          </p>

          <div
            style={{
              display: 'flex',
              marginBottom: 'var(--spacing-8)',
              backgroundColor: 'var(--surface-low)',
              borderRadius: 'var(--radius-full)',
              padding: '4px',
            }}
          >
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              style={{
                flex: 1,
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-full)',
                fontWeight: '600',
                backgroundColor: isLogin ? 'var(--surface-lowest)' : 'transparent',
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              style={{
                flex: 1,
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-full)',
                fontWeight: '600',
                backgroundColor: !isLogin ? 'var(--surface-lowest)' : 'transparent',
              }}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {isLogin ? (
              <div style={{ position: 'relative' }}>
                <User
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
                  type="text"
                  placeholder="E-mail ou telephone"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <User
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
                    type="text"
                    placeholder="Nom complet"
                    value={nom}
                    onChange={(event) => setNom(event.target.value)}
                    required
                    className="input-field"
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <Mail
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
                    type="email"
                    placeholder="Adresse e-mail"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <Phone
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
                    type="tel"
                    placeholder="Telephone"
                    value={telephone}
                    onChange={(event) => setTelephone(event.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                  <button
                    type="button"
                    onClick={() => setRole('voyageur')}
                    className={role === 'voyageur' ? 'btn-primary' : 'btn-outline'}
                    style={{ flex: 1 }}
                  >
                    Voyageur
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('hote')}
                    className={role === 'hote' ? 'btn-primary' : 'btn-outline'}
                    style={{ flex: 1 }}
                  >
                    Hote
                  </button>
                </div>
              </>
            )}

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
                placeholder="Mot de passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
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

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--spacing-4)',
                marginTop: 'var(--spacing-4)',
                fontSize: '1.05rem',
              }}
            >
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Creer mon compte'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--spacing-6) 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--surface-high)' }} />
            <span
              style={{
                padding: '0 var(--spacing-4)',
                color: 'var(--on-surface-variant)',
                fontSize: 'var(--body-sm)',
              }}
            >
              Connexions externes
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--surface-high)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="btn-outline"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>
            <button
              className="btn-outline"
              disabled={!providers.facebook}
              style={{ width: '100%', opacity: providers.facebook ? 1 : 0.5 }}
            >
              Continuer avec Facebook {providers.facebook ? '' : '(indisponible)'}
            </button>
          </div>

          {isLogin ? (
            <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setResetMode(true);
                  setResetSent(null);
                  setError('');
                }}
                style={{
                  color: 'var(--on-surface-variant)',
                  fontSize: 'var(--body-sm)',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Mot de passe oublie ?
              </button>
            </div>
          ) : null}
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
