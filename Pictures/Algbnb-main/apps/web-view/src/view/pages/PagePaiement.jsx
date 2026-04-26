import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { reservationController, paiementController } from '@algbnb/core';
import { Navbar } from '../components/Navbar';

const formatCardNumber = (value) =>
  value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const CardPreview = ({ numero, nom, expiry, flipped }) => {
  const raw = numero.replace(/\s/g, '');
  const padded = (raw + '????????????????').slice(0, 16);
  const chunks = [padded.slice(0,4), padded.slice(4,8), padded.slice(8,12), padded.slice(12,16)];

  return (
    <div style={{ perspective: '1000px', width: '100%', maxWidth: '360px', height: '200px', margin: '0 auto 32px' }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* RECTO */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #006F3C 0%, #004d29 60%, #002d18 100%)',
          padding: '24px', boxSizing: 'border-box',
          boxShadow: '0 20px 50px rgba(0,111,60,0.3)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px' }}>DAHABIYA</span>
            <div style={{ background: 'rgba(255,215,0,0.2)', borderRadius: '6px', padding: '4px 10px' }}>
              <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '13px' }}>داهبية</span>
            </div>
          </div>
          <div style={{ width: '44px', height: '34px', borderRadius: '6px', background: 'linear-gradient(135deg, #FFD700, #FFA500)' }} />
          <div style={{ fontFamily: 'monospace', fontSize: '18px', letterSpacing: '3px', color: 'white', fontWeight: '600' }}>
            {chunks.map((c, i) => <span key={i} style={{ marginRight: i < 3 ? '12px' : 0 }}>{c}</span>)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', letterSpacing: '1px', marginBottom: '3px' }}>NOM DU PORTEUR</div>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>{nom || 'VOTRE NOM'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', letterSpacing: '1px', marginBottom: '3px' }}>EXPIRATION</div>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>{expiry || 'MM/AA'}</div>
            </div>
          </div>
        </div>

        {/* VERSO */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #004d29 0%, #002d18 100%)',
          transform: 'rotateY(180deg)',
          boxShadow: '0 20px 50px rgba(0,111,60,0.3)',
          overflow: 'hidden',
        }}>
          <div style={{ width: '100%', height: '44px', background: '#1a1a1a', marginTop: '24px' }} />
          <div style={{ padding: '16px 24px', marginTop: '12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', letterSpacing: '1px', marginBottom: '6px' }}>CVV</div>
            <div style={{ background: 'white', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '16px', letterSpacing: '4px', color: '#333' }}>•••</span>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '20px', right: '24px', color: '#FFD700', fontWeight: 'bold', fontSize: '13px' }}>DAHABIYA</div>
        </div>
      </div>
    </div>
  );
};

export const PageReservationConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reservationData = location.state;

  const [step, setStep] = useState('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [cvvFocus, setCvvFocus] = useState(false);
  const [carte, setCarte] = useState({ numero: '', nom: '', expiry: '', cvv: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  if (!reservationData) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          Aucune réservation en préparation.
        </div>
      </div>
    );
  }

  const { logement, dateArrivee, dateDepart, voyageurs, nuits, sousTotal, frais, total, modeReservation } = reservationData;
  const requiresApproval = modeReservation !== 'instantanee';

  const handleChange = (field, raw) => {
    let value = raw;
    if (field === 'numero') value = formatCardNumber(raw);
    if (field === 'expiry') value = formatExpiry(raw);
    if (field === 'cvv') value = raw.replace(/\D/g, '').slice(0, 3);
    if (field === 'nom') value = raw.toUpperCase().slice(0, 26);
    setCarte(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!/^\d{4} \d{4} \d{4} \d{4}$/.test(carte.numero)) errors.numero = 'Numéro invalide (16 chiffres requis).';
    if (carte.nom.trim().length < 2) errors.nom = 'Nom du porteur requis.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(carte.expiry)) errors.expiry = 'Date invalide (MM/AA).';
    if (!/^\d{3}$/.test(carte.cvv)) errors.cvv = 'CVV invalide (3 chiffres).';
    if (!errors.expiry) {
      const [m, y] = carte.expiry.split('/').map(Number);
      const now = new Date();
      if (new Date(2000 + y, m - 1) < new Date(now.getFullYear(), now.getMonth())) errors.expiry = 'Carte expirée.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStep('processing');
    setErrorMsg('');
    try {
      const reservation = await reservationController.creerReservation({
        id_logement: logement.id,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        nb_voyageurs: voyageurs,
      });
      const paiement = await paiementController.payerParDahabiya(reservation.id, {
        numero_carte: carte.numero.replace(/\s/g, ''),
        nom_porteur: carte.nom.trim(),
        date_expiration: carte.expiry,
        cvv: carte.cvv,
      });
      setSuccessData(paiement);
      setStep('success');
    } catch (err) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
      setStep('error');
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%', padding: '13px 14px', borderRadius: 'var(--radius-DEFAULT)',
    border: `1.5px solid ${hasError ? '#b42218' : 'var(--outline-variant)'}`,
    fontSize: 'var(--body-md)', color: 'var(--on-surface)', backgroundColor: 'var(--bg-main)',
    boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
  });

  const labelStyle = {
    display: 'block', fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)',
    marginBottom: '6px', fontWeight: '600',
  };

  if (step === 'processing') {
    return (
      <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '4px solid var(--outline-variant)', borderTop: '4px solid var(--primary)', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--on-surface)', fontWeight: '600', fontSize: '18px' }}>Traitement du paiement…</p>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>Veuillez ne pas fermer cette page.</p>
        </div>
      </div>
    );
  }

  if (step === 'success' && successData) {
    return (
      <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, maxWidth: '480px', margin: '48px auto', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'var(--surface-lowest)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px' }}><CheckCircle size={64} strokeWidth={1.5} color="var(--primary)" /></div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Paiement accepté !</h1>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: '32px', fontSize: '15px' }}>
              {requiresApproval ? "Demande envoyée. En attente de validation par l'hôte." : "Réservation confirmée. Bon séjour !"}
            </p>
            <div style={{ background: 'rgba(15,110,86,0.07)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
              {[['Référence', successData.reference], ['Montant', `${Number(successData.montant).toLocaleString('fr-DZ')} DZD`], ['Méthode', 'Carte Dahabiya (sandbox)']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>{k}</span>
                  <span style={{ fontWeight: '700', fontSize: '13px', fontFamily: k === 'Référence' ? 'monospace' : 'inherit', color: k === 'Montant' ? 'var(--primary)' : 'var(--on-surface)' }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '16px' }} onClick={() => navigate('/reservations')}>
              Voir mes réservations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '48px auto', flex: 1, padding: '0 24px', boxSizing: 'border-box', width: '100%' }}>

        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)', marginBottom: '32px', cursor: 'pointer' }}>
          <ArrowLeft size={20} /> Retour
        </button>

        <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: '32px', lineHeight: 1.1 }}>
          Paiement de la réservation
        </h1>

        {/* Récapitulatif */}
        <div style={{ backgroundColor: 'var(--surface-lowest)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '17px', marginBottom: '16px' }}>Récapitulatif</h2>
          {[
            ['Logement', logement.titre],
            ['Dates', `${dateArrivee} → ${dateDepart}`],
            ['Voyageurs', String(voyageurs)],
            [`${logement.prix} DZD × ${nuits} nuit${nuits > 1 ? 's' : ''}`, `${sousTotal} DZD`],
            ['Frais de service', `${frais} DZD`],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>{label}</span>
              <span style={{ fontWeight: '600', fontSize: '13px', textAlign: 'right', maxWidth: '55%' }}>{val}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid var(--outline-variant)', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '700', fontSize: '18px' }}>Total à payer</span>
            <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary)' }}>{total} DZD</span>
          </div>
        </div>

        {/* Formulaire carte */}
        <div style={{ backgroundColor: 'var(--surface-lowest)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', marginBottom: '24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={22} /> Carte Dahabiya
            </h2>
            <div style={{ background: 'linear-gradient(135deg,#006F3C,#004d29)', borderRadius: '8px', padding: '6px 12px' }}>
              <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '14px' }}>داهبية</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '24px', fontSize: '13px', color: '#92400e', display: 'flex', gap: '8px' }}>
            <span>🧪</span>
            <span><strong>Mode sandbox :</strong> simulation uniquement. Aucun débit réel.</span>
          </div>

          <CardPreview numero={carte.numero} nom={carte.nom} expiry={carte.expiry} flipped={cvvFocus} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Numéro de carte</label>
              <input type="text" inputMode="numeric" placeholder="0000 0000 0000 0000" value={carte.numero} onChange={e => handleChange('numero', e.target.value)} style={inputStyle(!!fieldErrors.numero)} />
              {fieldErrors.numero && <p style={{ color: '#b42218', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.numero}</p>}
            </div>
            <div>
              <label style={labelStyle}>Nom du porteur</label>
              <input type="text" placeholder="TEL QU'IL APPARAÎT SUR LA CARTE" value={carte.nom} onChange={e => handleChange('nom', e.target.value)} style={inputStyle(!!fieldErrors.nom)} />
              {fieldErrors.nom && <p style={{ color: '#b42218', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.nom}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Date d'expiration</label>
                <input type="text" inputMode="numeric" placeholder="MM/AA" value={carte.expiry} onChange={e => handleChange('expiry', e.target.value)} style={inputStyle(!!fieldErrors.expiry)} />
                {fieldErrors.expiry && <p style={{ color: '#b42218', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.expiry}</p>}
              </div>
              <div>
                <label style={labelStyle}>CVV</label>
                <input type="password" inputMode="numeric" placeholder="•••" value={carte.cvv} onChange={e => handleChange('cvv', e.target.value)} onFocus={() => setCvvFocus(true)} onBlur={() => setCvvFocus(false)} style={inputStyle(!!fieldErrors.cvv)} />
                {fieldErrors.cvv && <p style={{ color: '#b42218', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.cvv}</p>}
              </div>
            </div>
          </div>

          {step === 'error' && errorMsg && (
            <div style={{ marginTop: '20px', padding: '14px', backgroundColor: 'rgba(180,35,24,0.08)', color: '#b42218', borderRadius: 'var(--radius-DEFAULT)', display: 'flex', gap: '10px', fontSize: '14px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> {errorMsg}
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '17px', marginTop: '24px' }} onClick={handleSubmit}>
            {requiresApproval ? `Envoyer la demande · ${total} DZD` : `Payer ${total} DZD`}
          </button>

          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
            <Lock size={13} /> Connexion sécurisée — Données simulées, non stockées
          </div>
        </div>

        <footer style={{ paddingBottom: '32px', textAlign: 'center' }}>
          {[['Confidentialité', '/confidentialite'], ['Conditions', '/conditions'], ['Aide', '/aide']].map(([label, to]) => (
            <Link key={to} to={to} className="footer-link">{label}</Link>
          ))}
        </footer>
      </div>
    </div>
  );
};