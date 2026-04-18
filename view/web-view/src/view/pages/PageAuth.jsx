import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';

export const PageAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [erreur, setErreur] = useState('');

  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    if (resetMode) {
      setResetSent(true);
      setTimeout(() => { setResetMode(false); setResetSent(false); }, 3000);
      return;
    }
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const [prenom, ...restNom] = nom.split(' ');
        await register({
          nom: restNom.join(' ') || prenom,
          prenom: prenom,
          email,
          mot_de_passe: password,
          telephone,
          role_type: 'voyageur'
        });
      }
      navigate('/');
    } catch (err) {
      setErreur(err.message);
    }
  };

  if (resetMode) {
    return (
      <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div className="page-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fadeInUp" style={{ maxWidth: '480px', width: '100%' }}>
            <h1 style={{ fontSize: 'var(--display-md)', marginBottom: 'var(--spacing-4)', lineHeight: 1.1 }}>
              Réinitialiser le<br/>mot de passe
            </h1>
            {resetSent ? (
              <div style={{ padding: 'var(--spacing-6)', backgroundColor: 'rgba(15, 110, 86, 0.08)', borderRadius: 'var(--radius-DEFAULT)', textAlign: 'center' }}>
                <p style={{ color: 'var(--primary)', fontWeight: '600' }}>E-mail envoyé !</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
                  <input type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" style={{ paddingLeft: '42px' }} />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: 'var(--spacing-4)' }}>Envoyer le lien</button>
              </form>
            )}
            <button onClick={() => { setResetMode(false); setResetSent(false); }} style={{ display: 'block', margin: 'var(--spacing-6) auto 0', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="page-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-fadeInUp" style={{ maxWidth: '480px', width: '100%', margin: 'var(--spacing-12) auto' }}>
          <h1 style={{ fontSize: 'var(--display-md)', marginBottom: 'var(--spacing-4)', lineHeight: 1.1 }}>
            {isLogin ? <>Bon retour<br/>parmi nous</> : <>Créez votre<br/>compte</>}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', marginBottom: 'var(--spacing-8)' }}>
            {isLogin ? 'Connectez-vous pour accéder à vos sélections exclusives.' : "Rejoignez notre communauté et découvrez des logements d'exception."}
          </p>

          <div style={{ display: 'flex', marginBottom: 'var(--spacing-8)', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-full)', padding: '4px' }}>
            <button onClick={() => setIsLogin(true)} style={{ flex: 1, padding: 'var(--spacing-3)', borderRadius: 'var(--radius-full)', fontWeight: '600', backgroundColor: isLogin ? 'var(--surface-lowest)' : 'transparent', color: isLogin ? 'var(--on-surface)' : 'var(--on-surface-variant)', boxShadow: isLogin ? 'var(--shadow-sm)' : 'none', transition: 'all 0.3s ease' }}>
              Connexion
            </button>
            <button onClick={() => setIsLogin(false)} style={{ flex: 1, padding: 'var(--spacing-3)', borderRadius: 'var(--radius-full)', fontWeight: '600', backgroundColor: !isLogin ? 'var(--surface-lowest)' : 'transparent', color: !isLogin ? 'var(--on-surface)' : 'var(--on-surface-variant)', boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none', transition: 'all 0.3s ease' }}>
              Inscription
            </button>
          </div>

          {erreur && (
            <div style={{ padding: 'var(--spacing-3)', backgroundColor: 'rgba(255,0,0,0.08)', borderRadius: 'var(--radius-DEFAULT)', marginBottom: 'var(--spacing-4)', color: 'red', fontSize: 'var(--body-sm)' }}>
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {!isLogin && (
              <>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
                  <input type="text" placeholder="Nom complet" value={nom} onChange={e => setNom(e.target.value)} required className="input-field" style={{ paddingLeft: '42px' }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
                  <input type="tel" placeholder="Numéro de téléphone" value={telephone} onChange={e => setTelephone(e.target.value)} className="input-field" style={{ paddingLeft: '42px' }} />
                </div>
              </>
            )}
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
              <input type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" style={{ paddingLeft: '42px' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" style={{ paddingLeft: '42px', paddingRight: '42px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: 'var(--spacing-4)', marginTop: 'var(--spacing-4)', fontSize: '1.05rem' }}>
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer mon compte')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--spacing-6) 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--surface-high)' }} />
            <span style={{ padding: '0 var(--spacing-4)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>ou</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--surface-high)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4)', width: '100%' }}>
              <img src="https://img.icons8.com/color/24/000000/google-logo.png" alt="Google" style={{width: '20px', height: '20px'}} />
              Continuer avec Google
            </button>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4)', width: '100%' }}>
              <img src="https://img.icons8.com/color/24/000000/facebook-new.png" alt="Facebook" style={{width: '20px', height: '20px'}} />
              Continuer avec Facebook
            </button>
          </div>

          {isLogin && (
            <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center' }}>
              <button onClick={() => setResetMode(true)} style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mot de passe oublié ?
              </button>
            </div>
          )}
        </div>
      </div>
      <footer style={{ padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
        <Link to="#" className="footer-link">Confidentialité</Link>
        <Link to="#" className="footer-link">Conditions</Link>
        <Link to="#" className="footer-link" style={{marginRight: 0}}>Aide</Link>
      </footer>
    </div>
  );
};