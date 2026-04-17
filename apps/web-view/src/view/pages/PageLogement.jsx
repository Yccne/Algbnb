import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { logementController } from '@algbnb/core';
import { Navbar } from '../components/Navbar';
import { Star, Heart, Share2, MapPin, Users, BedDouble, Bath, Wifi, Car, ChefHat, Snowflake, Waves, ArrowLeft } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const equipementIcons = {
  'Wi-Fi': Wifi, 'Parking': Car, 'Cuisine équipée': ChefHat, 'Climatisation': Snowflake,
  'Piscine': Waves, 'Piscine à débordement': Waves, 'Vue mer': MapPin, 'Sauna': Snowflake,
};

export const PageLogement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  const [dateArrivee, setDateArrivee] = useState(null);
  const [dateDepart, setDateDepart] = useState(null);
  const [voyageurs, setVoyageurs] = useState(1);

  const nuits = (dateArrivee && dateDepart) 
    ? Math.max(1, Math.ceil((dateDepart - dateArrivee) / (1000 * 60 * 60 * 24)))
    : 1;

  const prixNuit = logement?.prix || 0;
  const sousTotal = nuits * prixNuit;
  const frais = Math.round(sousTotal * 0.12);
  const total = sousTotal + frais;

  const handleReserve = () => {
    if (!dateArrivee || !dateDepart) {
      alert("Veuillez sélectionner des dates.");
      return;
    }
    const dateArriveeStr = dateArrivee.toISOString().split('T')[0];
    const dateDepartStr = dateDepart.toISOString().split('T')[0];
    navigate('/paiement', { 
      state: { logement, dateArrivee: dateArriveeStr, dateDepart: dateDepartStr, voyageurs, nuits, sousTotal, frais, total } 
    });
  };

  const avisExperts = [
    { auteur: 'Marc Dupont', date: 'Juin 2024', note: 5, texte: "Un séjour inoubliable. La vue est encore plus belle en vrai que sur les photos. L'hôte est très attentionné." },
    { auteur: 'Léa Vasseur', date: 'Mai 2024', note: 5, texte: "Le design minimaliste apporte une sérénité immédiate. Parfait pour une escapade relaxante loin de l'agitation." },
    { auteur: 'Thomas Leroy', date: 'Avril 2024', note: 4, texte: "Excellente communication et cadre magnifique. Conseils locaux très appréciés. Nous reviendrons !" },
    { auteur: 'Camille Martin', date: 'Mars 2024', note: 5, texte: "Superbe et très fonctionnel. Chaque détail semble avoir été pensé pour le bien-être des voyageurs." }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const l = await logementController.getLogementById(id || 1);
        setLogement(l);
      } catch (err) { } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <div><Navbar /><div className="spinner"></div></div>;
  if (!logement) return <div><Navbar /><div style={{ textAlign: 'center', padding: 'var(--spacing-16)', color: 'var(--on-surface-variant)' }}>Logement introuvable</div></div>;

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '100px' }}>
      <Navbar />

      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 var(--spacing-6)' }}>
        {/* Back + Actions */}
        <div className="animate-fadeIn" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-4) 0' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--body-md)' }}>
            <ArrowLeft size={20} /> Retour
          </button>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <button onClick={() => setIsFav(!isFav)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', fontWeight: '600' }}>
              <Heart size={18} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : 'currentColor'} /> Sauvegarder
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', fontWeight: '600' }}>
              <Share2 size={18} /> Partager
            </button>
          </div>
        </div>

        {/* Photo */}
        <div className="animate-fadeInUp" style={{ width: '100%', height: '500px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--spacing-8)' }}>
          <img src={logement.photos[0]} alt={logement.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      <div className="page-container" style={{ display: 'flex', gap: 'var(--spacing-12)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Left Column */}
        <div style={{ flex: '2 1 600px' }} className="animate-fadeInUp">
          <h1 style={{ fontSize: 'var(--display-md)', lineHeight: '1.1', marginBottom: 'var(--spacing-2)' }}>
            {logement.titre}
          </h1>
          <p style={{ fontSize: 'var(--title-lg)', color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-6)' }}>
            {logement.ville}
          </p>

          {/* Key Stats Row */}
          <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap', marginBottom: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
              <Users size={18} /> {logement.voyageurs} voyageurs
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
              <BedDouble size={18} /> {logement.chambres} chambres · {logement.lits} lits
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
              <Bath size={18} /> {logement.sallesDeBain} salle{logement.sallesDeBain > 1 ? 's' : ''} de bain
            </div>
          </div>

          {/* Host Section */}
          <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center', padding: 'var(--spacing-6)', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-8)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--primary-container)' }}>
              <img src={logement.hote?.photo || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80'} alt="Hôte" style={{width:'100%', height:'100%', objectFit:'cover'}} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 'var(--body-md)', fontWeight: '700' }}>Hôte : {logement.hote?.nom || 'Sophie'}</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>Hôte depuis {logement.hote?.depuis || '4 ans'}</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-6)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 'bold' }}>{logement.note}</div>
                <div style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--headline-md)', fontWeight: 'bold' }}>128</div>
                <div style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avis</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-4)' }}>À propos de ce logement</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)', lineHeight: '1.8' }}>
              {logement.description}
            </p>
          </div>

          {/* Equipements */}
          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-6)' }}>Équipements</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
              {logement.equipements.map((eq, idx) => {
                const Icon = equipementIcons[eq] || Wifi;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-3)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                    <Icon size={20} color="var(--primary)" />
                    {eq}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews */}
          <div style={{ marginBottom: 'var(--spacing-12)' }}>
            <h2 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-6)' }}>Avis des voyageurs</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
              {avisExperts.map((av, idx) => (
                <div key={idx} style={{ padding: 'var(--spacing-6)', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 'var(--body-sm)' }}>
                      {av.auteur.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 'var(--body-md)', fontWeight: '600' }}>{av.auteur}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[...Array(av.note)].map((_, i) => <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />)}
                        <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginLeft: '4px' }}>{av.date}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', lineHeight: 1.6 }}>{av.texte}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Reservation form */}
        <div style={{ flex: '1 1 340px', position: 'sticky', top: '80px' }} className="animate-fadeInUp">
          <div style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface-lowest)', boxShadow: 'var(--shadow-ambient)' }}>
            <div style={{ fontSize: 'var(--title-lg)', fontWeight: 'bold', marginBottom: 'var(--spacing-6)' }}>
              {logement.prix} DZD <span style={{ fontSize: 'var(--body-md)', fontWeight: 'normal', color: 'var(--on-surface-variant)' }}>/ nuit</span>
            </div>
            
            <div style={{ backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-DEFAULT)', marginBottom: 'var(--spacing-6)', overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ padding: 'var(--spacing-3)', flex: 1, borderRight: '1px solid var(--surface-high)' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--on-surface-variant)', letterSpacing: '0.05em' }}>Arrivée</label>
                  <DatePicker
                    selected={dateArrivee}
                    onChange={date => setDateArrivee(date)}
                    selectsStart
                    startDate={dateArrivee}
                    endDate={dateDepart}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Sélectionner"
                    className="date-picker-input"
                  />
                </div>
                <div style={{ padding: 'var(--spacing-3)', flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--on-surface-variant)', letterSpacing: '0.05em' }}>Départ</label>
                  <DatePicker
                    selected={dateDepart}
                    onChange={date => setDateDepart(date)}
                    selectsEnd
                    startDate={dateArrivee}
                    endDate={dateDepart}
                    minDate={dateArrivee || new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Sélectionner"
                    className="date-picker-input"
                  />
                </div>
              </div>
              <div style={{ padding: 'var(--spacing-3)', borderTop: '1px solid var(--surface-high)' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--on-surface-variant)', letterSpacing: '0.05em' }}>Voyageurs</label>
                <select value={voyageurs} onChange={e => setVoyageurs(Number(e.target.value))} style={{ border: 'none', outline: 'none', width: '100%', fontSize: 'var(--body-md)', fontFamily: 'inherit', background: 'transparent', marginTop: '4px', color: 'var(--on-surface)' }}>
                  {[...Array(logement.voyageurs || 4)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} voyageur{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', padding: 'var(--spacing-4)', fontSize: '1.05rem', marginBottom: 'var(--spacing-4)' }} onClick={handleReserve}>
              Réserver
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-6)' }}>
              Aucun montant ne sera débité pour le moment
            </p>

            {dateArrivee && dateDepart && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                  <span style={{ textDecoration: 'underline' }}>{prixNuit} DZD x {nuits} nuits</span>
                  <span>{sousTotal} DZD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                  <span style={{ textDecoration: 'underline' }}>Frais de service algbnb</span>
                  <span>{frais} DZD</span>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span>Total</span>
                  <span>{total} DZD</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer style={{ borderTop: '1px solid rgba(190, 201, 195, 0.15)', padding: 'var(--spacing-8) var(--spacing-6)', display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', maxWidth: '1120px', margin: '0 auto' }}>
        <p>© 2026 algbnb. Tous droits réservés.</p>
        <div>
          <Link to="#" className="footer-link">Confidentialité</Link>
          <Link to="#" className="footer-link">Conditions</Link>
          <Link to="#" className="footer-link" style={{marginRight: 0}}>Aide</Link>
        </div>
      </footer>
    </div>
  );
};
