import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, CreditCard, Lock } from 'lucide-react';
import { logementController, paiementController, reservationController } from '@algbnb/controller-client';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const formatDzd = (value) => `${Number(value || 0).toLocaleString('fr-DZ')} DZD`;

const validateCard = (card) => {
  const errors = {};
  if (!/^\d{4} \d{4} \d{4} \d{4}$/.test(card.numero)) {
    errors.numero = 'Numero invalide (16 chiffres requis).';
  }
  if (card.nom.trim().length < 2) {
    errors.nom = 'Nom du porteur requis.';
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) {
    errors.expiry = 'Date invalide (MM/AA).';
  }
  if (!/^\d{3}$/.test(card.cvv)) {
    errors.cvv = 'CVV invalide (3 chiffres).';
  }
  if (!errors.expiry) {
    const [month, year] = card.expiry.split('/').map(Number);
    const now = new Date();
    if (new Date(2000 + year, month - 1) < new Date(now.getFullYear(), now.getMonth())) {
      errors.expiry = 'Carte expiree.';
    }
  }
  return errors;
};

const stayHitsBlockedRange = ({ disponibilites = [], dateArrivee, dateDepart }) =>
  disponibilites.some(
    (range) =>
      range.est_bloque !== false &&
      !(range.date_fin < dateArrivee || range.date_debut >= dateDepart)
  );

const CardPreview = ({ numero, nom, expiry, flipped }) => {
  const raw = numero.replace(/\s/g, '');
  const padded = (raw + '****************').slice(0, 16);
  const chunks = [padded.slice(0, 4), padded.slice(4, 8), padded.slice(8, 12), padded.slice(12, 16)];

  return (
    <div style={{ perspective: '1000px', width: '100%', maxWidth: '360px', height: '200px', margin: '0 auto 32px' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #006f3c 0%, #004d29 60%, #002d18 100%)',
            padding: '24px',
            boxSizing: 'border-box',
            boxShadow: '0 20px 50px rgba(0,111,60,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px' }}>
              DAHABIYA
            </span>
            <CreditCard size={28} color="#ffd700" />
          </div>
          <div style={{ width: '44px', height: '34px', borderRadius: '6px', background: 'linear-gradient(135deg, #ffd700, #ffa500)' }} />
          <div style={{ fontFamily: 'monospace', fontSize: '18px', letterSpacing: '3px', color: 'white', fontWeight: 600 }}>
            {chunks.map((chunk, index) => (
              <span key={index} style={{ marginRight: index < 3 ? '12px' : 0 }}>
                {chunk}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '9px', letterSpacing: '1px', marginBottom: '3px' }}>
                NOM DU PORTEUR
              </div>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {nom || 'VOTRE NOM'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '9px', letterSpacing: '1px', marginBottom: '3px' }}>
                EXPIRATION
              </div>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>
                {expiry || 'MM/AA'}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #004d29 0%, #002d18 100%)',
            transform: 'rotateY(180deg)',
            boxShadow: '0 20px 50px rgba(0,111,60,0.3)',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '100%', height: '44px', background: '#1a1a1a', marginTop: '24px' }} />
          <div style={{ padding: '16px 24px', marginTop: '12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '9px', letterSpacing: '1px', marginBottom: '6px' }}>
              CVV
            </div>
            <div style={{ background: 'white', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '16px', letterSpacing: '4px', color: '#333' }}>***</span>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '20px', right: '24px', color: '#ffd700', fontWeight: 'bold', fontSize: '13px' }}>
            DAHABIYA
          </div>
        </div>
      </div>
    </div>
  );
};

export const PageReservationConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const reservationData = location.state;
  const [step, setStep] = useState('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [pendingReservation, setPendingReservation] = useState(null);
  const [cvvFocus, setCvvFocus] = useState(false);
  const [card, setCard] = useState({ numero: '', nom: '', expiry: '', cvv: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  if (authLoading) {
    return (
      <div>
        <Navbar />
        <div className="spinner" style={{ marginTop: 'var(--spacing-16)' }} />
      </div>
    );
  }

  if (user?.role_type && user.role_type !== 'voyageur') {
    return (
      <div>
        <Navbar />
        <div style={{ padding: 'var(--spacing-16)', textAlign: 'center' }}>
          Connecte-toi avec un compte voyageur pour réserver ce logement.
        </div>
      </div>
    );
  }

  if (!reservationData) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: 'var(--spacing-16)', textAlign: 'center' }}>
          Aucune reservation en preparation.
        </div>
      </div>
    );
  }

  const { logement, dateArrivee, dateDepart, voyageurs, nuits, sousTotal, frais, total, modeReservation } =
    reservationData;
  const requiresApproval = modeReservation !== 'instantanee';

  const handleChange = (field, rawValue) => {
    let value = rawValue;
    if (field === 'numero') value = formatCardNumber(rawValue);
    if (field === 'expiry') value = formatExpiry(rawValue);
    if (field === 'cvv') value = rawValue.replace(/\D/g, '').slice(0, 3);
    if (field === 'nom') value = rawValue.toUpperCase().slice(0, 26);
    setCard((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    const nextErrors = validateCard(card);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStep('processing');
    setErrorMsg('');
    try {
      const refreshedListing = await logementController.getLogementById(logement.id);
      if (stayHitsBlockedRange({ disponibilites: refreshedListing.disponibilites, dateArrivee, dateDepart })) {
        throw new Error('Ces dates ne sont plus disponibles pour ce logement.');
      }

      const reservation =
        pendingReservation ||
        (await reservationController.creerReservation({
          id_logement: logement.id,
          date_arrivee: dateArrivee,
          date_depart: dateDepart,
          nb_voyageurs: voyageurs,
        }));
      setPendingReservation(reservation);

      const paiement = await paiementController.payerParDahabiya(reservation.id, {
        numero_carte: card.numero.replace(/\s/g, ''),
        nom_porteur: card.nom.trim(),
        date_expiration: card.expiry,
        cvv: card.cvv,
      });
      setSuccessData(paiement);
      setStep('success');
    } catch (error) {
      setErrorMsg(error.message || 'Une erreur est survenue.');
      setStep('error');
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '13px 14px',
    borderRadius: 'var(--radius-DEFAULT)',
    border: `1.5px solid ${hasError ? '#b42218' : 'var(--outline-variant)'}`,
    fontSize: 'var(--body-md)',
    color: 'var(--on-surface)',
    backgroundColor: 'var(--bg-main)',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  });

  const labelStyle = {
    display: 'block',
    fontSize: 'var(--body-sm)',
    color: 'var(--on-surface-variant)',
    marginBottom: '6px',
    fontWeight: 600,
  };

  if (step === 'processing') {
    return (
      <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '4px solid var(--outline-variant)', borderTop: '4px solid var(--primary)', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '18px' }}>Traitement du paiement...</p>
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
            <div style={{ marginBottom: '24px' }}>
              <CheckCircle size={64} strokeWidth={1.5} color="var(--primary)" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Paiement accepte</h1>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: '32px', fontSize: '15px' }}>
              {requiresApproval ? "Demande envoyée. En attente de validation par l'hôte." : 'Réservation confirmée. Bon séjour.'}
            </p>

            <div style={{ background: 'rgba(15,110,86,0.07)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '20px', textAlign: 'left' }}>
              {[
                ['Reference', successData.reference],
                ['Montant', formatDzd(successData.montant)],
                ['Methode', 'Carte Dahabiya (sandbox)'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', gap: '16px' }}>
                  <span style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>{label}</span>
                  <span style={{ fontWeight: 700, fontSize: '13px', fontFamily: label === 'Reference' ? 'monospace' : 'inherit', color: label === 'Montant' ? 'var(--primary)' : 'var(--on-surface)', textAlign: 'right' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {logement.compte_ccp ? (
              <div style={{ background: 'rgba(234,179,8,0.10)', border: '1.5px solid rgba(234,179,8,0.4)', borderRadius: 'var(--radius-md)', padding: '18px 20px', marginBottom: '28px', textAlign: 'left' }}>
                <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '10px', fontWeight: 600 }}>
                  Virement CCP requis
                </p>
                <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '12px', lineHeight: 1.5 }}>
                  Le montant de <strong>{formatDzd(successData.montant)}</strong> a ete valide. Effectue le
                  virement sur le compte CCP de l'hôte.
                </p>
                <div style={{ background: 'white', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(234,179,8,0.3)', gap: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>Numéro CCP de l'hôte</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#78350f', letterSpacing: '2px' }}>
                    {logement.compte_ccp}
                  </span>
                </div>
              </div>
            ) : null}

            <button className="btn-primary" style={{ width: '100%', padding: '16px' }} onClick={() => navigate('/reservations')}>
              Voir mes reservations
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
          Paiement de la reservation
        </h1>

        <div style={{ backgroundColor: 'var(--surface-lowest)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '17px', marginBottom: '16px' }}>Recapitulatif</h2>
          {[
            ['Logement', logement.titre],
            ['Dates', `${dateArrivee} - ${dateDepart}`],
            ['Voyageurs', String(voyageurs)],
            [`${logement.prix} DZD x ${nuits} nuit${nuits > 1 ? 's' : ''}`, `${sousTotal} DZD`],
            ['Frais de service', `${frais} DZD`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '16px' }}>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: '13px', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid var(--outline-variant)', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '18px' }}>Total a payer</span>
            <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary)' }}>{total} DZD</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-lowest)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={22} /> Carte Dahabiya
            </h2>
            <div style={{ background: 'linear-gradient(135deg,#006f3c,#004d29)', borderRadius: '8px', padding: '6px 12px' }}>
              <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '14px' }}>Sandbox</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '24px', fontSize: '13px', color: '#92400e' }}>
            Simulation uniquement. Aucun debit reel.
          </div>

          <CardPreview numero={card.numero} nom={card.nom} expiry={card.expiry} flipped={cvvFocus} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Numero de carte</label>
              <input type="text" inputMode="numeric" placeholder="0000 0000 0000 0000" value={card.numero} onChange={(event) => handleChange('numero', event.target.value)} style={inputStyle(Boolean(fieldErrors.numero))} />
              {fieldErrors.numero ? <p style={{ color: '#b42218', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.numero}</p> : null}
            </div>
            <div>
              <label style={labelStyle}>Nom du porteur</label>
              <input type="text" placeholder="TEL QU IL APPARAIT SUR LA CARTE" value={card.nom} onChange={(event) => handleChange('nom', event.target.value)} style={inputStyle(Boolean(fieldErrors.nom))} />
              {fieldErrors.nom ? <p style={{ color: '#b42218', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.nom}</p> : null}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Date d expiration</label>
                <input type="text" inputMode="numeric" placeholder="MM/AA" value={card.expiry} onChange={(event) => handleChange('expiry', event.target.value)} style={inputStyle(Boolean(fieldErrors.expiry))} />
                {fieldErrors.expiry ? <p style={{ color: '#b42218', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.expiry}</p> : null}
              </div>
              <div>
                <label style={labelStyle}>CVV</label>
                <input type="password" inputMode="numeric" placeholder="***" value={card.cvv} onChange={(event) => handleChange('cvv', event.target.value)} onFocus={() => setCvvFocus(true)} onBlur={() => setCvvFocus(false)} style={inputStyle(Boolean(fieldErrors.cvv))} />
                {fieldErrors.cvv ? <p style={{ color: '#b42218', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.cvv}</p> : null}
              </div>
            </div>
          </div>

          {step === 'error' && errorMsg ? (
            <div style={{ marginTop: '20px', padding: '14px', backgroundColor: 'rgba(180,35,24,0.08)', color: '#b42218', borderRadius: 'var(--radius-DEFAULT)', display: 'flex', gap: '10px', fontSize: '14px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> {errorMsg}
            </div>
          ) : null}

          <button className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '17px', marginTop: '24px' }} onClick={handleSubmit}>
            {requiresApproval ? `Envoyer la demande - ${total} DZD` : `Payer ${total} DZD`}
          </button>

          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
            <Lock size={13} /> Donnees simulees, non stockees
          </div>
        </div>

        <footer style={{ paddingBottom: '32px', textAlign: 'center' }}>
          {[
            ['Confidentialite', '/confidentialite'],
            ['Conditions', '/conditions'],
            ['Aide', '/aide'],
          ].map(([label, to]) => (
            <Link key={to} to={to} className="footer-link">
              {label}
            </Link>
          ))}
        </footer>
      </div>
    </div>
  );
};
