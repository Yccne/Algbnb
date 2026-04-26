import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Bath, BedDouble, Car, Heart, MapPin, PawPrint, Share2, Snowflake, Star, Users, Utensils, Waves, Wifi } from 'lucide-react';
import { favorisController, logementController, messagesController } from '@algbnb/controller-client';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

const fallbackImage = 'https://placehold.co/1200x800?text=Photo+Logement';

const normalizeEquipmentLabel = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getEquipmentIcon = (equipment) => {
  const label = normalizeEquipmentLabel(equipment);

  if (label.includes('wi-fi') || label.includes('wifi')) return Wifi;
  if (label.includes('cuisine')) return Utensils;
  if (label.includes('parking')) return Car;
  if (label.includes('climatisation') || label.includes('clim')) return Snowflake;
  if (label.includes('piscine')) return Waves;
  if (label.includes('animaux') || label.includes('animal')) return PawPrint;

  return null;
};

export const PageLogement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateArrivee, setDateArrivee] = useState(null);
  const [dateDepart, setDateDepart] = useState(null);
  const [voyageurs, setVoyageurs] = useState(1);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await logementController.getLogementById(id);
        setLogement(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadFavoriteState = async () => {
      if (!user || !logement?.id) {
        if (active) setIsFavorite(false);
        return;
      }

      try {
        const favoris = await favorisController.getFavoris();
        if (active) {
          setIsFavorite(favoris.some((item) => String(item.id) === String(logement.id)));
        }
      } catch {
        if (active) setIsFavorite(false);
      }
    };

    loadFavoriteState();
    return () => {
      active = false;
    };
  }, [user, logement?.id]);

  const blockedRanges = useMemo(() => logement?.disponibilites || [], [logement]);

  const isDateBlocked = (date) =>
    blockedRanges.some((range) => {
      const start = new Date(`${range.date_debut}T00:00:00`);
      const end = new Date(`${range.date_fin}T23:59:59`);
      return date >= start && date <= end && range.est_bloque;
    });

  const nuits =
    dateArrivee && dateDepart ? Math.max(1, Math.ceil((dateDepart - dateArrivee) / (1000 * 60 * 60 * 24))) : 1;

  const prixNuit = logement?.prix || 0;
  const sousTotal = nuits * prixNuit;
  const frais = Math.round(sousTotal * 0.12);
  const total = sousTotal + frais;
  const requiresApproval = logement?.mode_reservation !== 'instantanee';
  const reservationActionLabel = requiresApproval ? 'Demander a reserver' : 'Reserver maintenant';

  const handleReserve = () => {
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (!dateArrivee || !dateDepart) {
      setError('Selectionne une date arrivee et une date depart.');
      return;
    }

    navigate('/reservation/confirmation', {
      state: {
        logement,
        dateArrivee: dateArrivee.toISOString().slice(0, 10),
        dateDepart: dateDepart.toISOString().slice(0, 10),
        voyageurs,
        nuits,
        sousTotal,
        frais,
        total,
        modeReservation: logement.mode_reservation,
        politiqueAnnulation: logement.politique_annulation,
      },
    });
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/connexion');
      return;
    }

    if (!logement || favoriteSaving) {
      return;
    }

    setFavoriteSaving(true);
    try {
      if (isFavorite) {
        await favorisController.supprimerFavori(logement.id);
      } else {
        await favorisController.ajouterFavori(logement.id);
      }
      setIsFavorite((current) => !current);
    } catch (favoriteError) {
      setError(favoriteError.message);
    } finally {
      setFavoriteSaving(false);
    }
  };

  const handleContactHost = async () => {
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (!logement?.hote?.id) {
      return;
    }

    try {
      const conversation = await messagesController.createConversation(logement.hote.id);
      navigate('/messages', { state: { conversationId: conversation.id } });
    } catch (messageError) {
      setError(messageError.message);
    }
  };

  const handleShare = async () => {
    if (!logement) {
      return;
    }

    const shareUrl = `${window.location.origin}/logement/${logement.id}`;
    setShareMessage('');

    try {
      if (navigator.share) {
        await navigator.share({
          title: logement.titre,
          text: `Decouvre ${logement.titre} sur algbnb.`,
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage('Lien copie dans le presse-papiers.');
        return;
      }

      throw new Error('Partage indisponible sur ce navigateur.');
    } catch (shareError) {
      if (shareError?.name === 'AbortError') {
        return;
      }
      setError(shareError.message || 'Impossible de partager ce logement.');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="spinner"></div>
      </div>
    );
  }

  if (!logement) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: 'center', padding: 'var(--spacing-16)', color: 'var(--on-surface-variant)' }}>
          {error || 'Logement introuvable.'}
        </div>
      </div>
    );
  }

  const image = logement.photos?.[0] || fallbackImage;

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '100px' }}>
      <Navbar />
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 var(--spacing-6)' }}>
        <div className="animate-fadeIn" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-4) 0' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--body-md)' }}>
            <ArrowLeft size={20} /> Retour
          </button>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <button
              onClick={handleToggleFavorite}
              disabled={favoriteSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', fontWeight: '600', opacity: favoriteSaving ? 0.6 : 1 }}
            >
              <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : 'currentColor'} /> Sauvegarder
            </button>
            <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', fontWeight: '600' }}>
              <Share2 size={18} /> Partager
            </button>
          </div>
        </div>

        <div className="animate-fadeInUp" style={{ width: '100%', height: '500px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--spacing-8)' }}>
          <img src={image} alt={logement.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      <div className="page-container" style={{ display: 'flex', gap: 'var(--spacing-12)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 600px' }}>
          <h1 style={{ fontSize: 'var(--display-md)', lineHeight: '1.1', marginBottom: 'var(--spacing-2)' }}>{logement.titre}</h1>
          <p style={{ fontSize: 'var(--title-lg)', color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-6)' }}>{logement.ville}</p>

          <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap', marginBottom: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
              <Users size={18} /> {logement.voyageurs} voyageurs
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
              <BedDouble size={18} /> {logement.chambres} chambres - {logement.lits} lits
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
              <Bath size={18} /> {logement.sallesDeBain} salle{logement.sallesDeBain > 1 ? 's' : ''} de bain
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
              <MapPin size={18} /> {logement.adresse}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center', padding: 'var(--spacing-6)', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-8)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--primary-container)' }}>
              <img src={logement.hote?.photo || 'https://placehold.co/100x100?text=H'} alt="Hote" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 'var(--body-md)', fontWeight: '700' }}>Hote : {logement.hote?.nom || 'Hote'}</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>{logement.hote?.verifie ? 'Profil verifie' : 'Profil en cours de verification'}</p>
            </div>
            <button className="btn-outline" onClick={handleContactHost}>
              Contacter
            </button>
            <div style={{ display: 'flex', gap: 'var(--spacing-6)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 'bold' }}>{Number(logement.note || 0).toFixed(1)}</div>
                <div style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Note</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 'bold' }}>{logement.nbAvis || logement.avis?.length || 0}</div>
                <div style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Avis</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-4)' }}>A propos de ce logement</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', lineHeight: '1.8' }}>{logement.description}</p>
          </div>

          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-6)' }}>Equipements</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--spacing-4)' }}>
              {(logement.equipements || []).map((eq) => {
                const EquipmentIcon = getEquipmentIcon(eq);
                return (
                  <div key={eq} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-3)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                    {EquipmentIcon ? <EquipmentIcon size={20} color="var(--primary)" /> : null}
                    {eq}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-12)' }}>
            <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-6)' }}>Avis des voyageurs</h2>
            {logement.avis?.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
                {logement.avis.map((avis) => (
                  <div key={avis.id} style={{ padding: 'var(--spacing-6)', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {(avis.auteur || 'V').charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 'var(--body-md)', fontWeight: '600' }}>{avis.auteur}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {[...Array(Number(avis.noteLogement || 0))].map((_, index) => (
                            <Star key={index} size={12} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', lineHeight: 1.6 }}>{avis.commentaire || 'Aucun commentaire.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--on-surface-variant)' }}>Aucun avis public pour le moment.</p>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 340px', position: 'sticky', top: '80px' }}>
          <div style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface-lowest)', boxShadow: 'var(--shadow-ambient)' }}>
            <div style={{ fontSize: 'var(--title-lg)', fontWeight: 'bold', marginBottom: 'var(--spacing-6)' }}>
              {logement.prix} DZD <span style={{ fontSize: 'var(--body-md)', fontWeight: 'normal', color: 'var(--on-surface-variant)' }}>/ nuit</span>
            </div>

            <div style={{ backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-DEFAULT)', marginBottom: 'var(--spacing-6)', overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ padding: 'var(--spacing-3)', flex: 1, borderRight: '1px solid var(--surface-high)' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>Arrivee</label>
                  <DatePicker selected={dateArrivee} onChange={(value) => setDateArrivee(value)} minDate={new Date()} filterDate={(date) => !isDateBlocked(date)} dateFormat="dd/MM/yyyy" placeholderText="Selectionner" className="date-picker-input" />
                </div>
                <div style={{ padding: 'var(--spacing-3)', flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>Depart</label>
                  <DatePicker selected={dateDepart} onChange={(value) => setDateDepart(value)} minDate={dateArrivee || new Date()} filterDate={(date) => !isDateBlocked(date)} dateFormat="dd/MM/yyyy" placeholderText="Selectionner" className="date-picker-input" />
                </div>
              </div>
              <div style={{ padding: 'var(--spacing-3)', borderTop: '1px solid var(--surface-high)' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>Voyageurs</label>
                <select value={voyageurs} onChange={(event) => setVoyageurs(Number(event.target.value))} style={{ border: 'none', outline: 'none', width: '100%', fontSize: 'var(--body-md)', fontFamily: 'inherit', background: 'transparent', marginTop: '4px', color: 'var(--on-surface)' }}>
                  {Array.from({ length: logement.voyageurs || 1 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value} voyageur{value > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? <div style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4)', backgroundColor: 'rgba(180, 35, 24, 0.08)', color: 'var(--error)', borderRadius: 'var(--radius-DEFAULT)' }}>{error}</div> : null}
            {shareMessage ? (
              <div style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4)', backgroundColor: 'rgba(15, 110, 86, 0.08)', color: 'var(--primary)', borderRadius: 'var(--radius-DEFAULT)' }}>
                {shareMessage}
              </div>
            ) : null}

            <button className="btn-primary" style={{ width: '100%', padding: 'var(--spacing-4)', fontSize: '1.05rem', marginBottom: 'var(--spacing-4)' }} onClick={handleReserve}>
              {reservationActionLabel}
            </button>
            <button className="btn-outline" style={{ width: '100%', marginBottom: 'var(--spacing-4)' }} onClick={handleContactHost}>
              Contacter l hote
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-6)' }}>
              {requiresApproval
                ? 'La demande sera envoyee a l hote pour validation, sans paiement en ligne.'
                : 'La reservation sera confirmee directement, sans paiement en ligne.'}
            </p>

            {dateArrivee && dateDepart ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                  <span>{prixNuit} DZD x {nuits} nuit{nuits > 1 ? 's' : ''}</span>
                  <span>{sousTotal} DZD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                  <span>Frais de service</span>
                  <span>{frais} DZD</span>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span>Total</span>
                  <span>{total} DZD</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid rgba(190, 201, 195, 0.15)', padding: 'var(--spacing-8) var(--spacing-6)', display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', maxWidth: '1120px', margin: '0 auto' }}>
        <p>2026 algbnb.</p>
        <div>
          <Link to="/confidentialite" className="footer-link">
            Confidentialite
          </Link>
          <Link to="/conditions" className="footer-link">
            Conditions
          </Link>
          <Link to="/aide" className="footer-link" style={{ marginRight: 0 }}>
            Aide
          </Link>
        </div>
      </footer>
    </div>
  );
};
