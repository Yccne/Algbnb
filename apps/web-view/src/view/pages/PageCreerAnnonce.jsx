import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { logementController } from '@algbnb/core';
import { Navbar } from '../components/Navbar';
import { LocationSearchInput } from '../components/LocationSearchInput';
import { useAuth } from '../context/AuthContext';

const initialState = {
  titre: '',
  description: '',
  type_logement: 'appartement',
  adresse: '',
  ville: '',
  pays: 'Algerie',
  latitude: '',
  longitude: '',
  nb_chambres: 1,
  nb_lits: 1,
  nb_salles_de_bain: 1,
  capacite_accueil: 1,
  prix_par_nuit: 5000,
  mode_reservation: 'sur_approbation',
  politique_annulation: 'moderee',
  regles_maison: '',
  equipements: [],
  photos: [],
  photo_urls_text: '',
};

const emptyAvailabilityRange = {
  date_debut: '',
  date_fin: '',
  est_bloque: true,
  source_blocage: 'manuel',
  note_interne: '',
};

const availableEquipements = [
  'Wi-Fi',
  'Cuisine equipee',
  'Climatisation',
  'Piscine',
  'Parking',
  'Television',
];

const getCityFromSuggestion = (suggestion) =>
  suggestion?.address?.city ||
  suggestion?.address?.town ||
  suggestion?.address?.village ||
  suggestion?.address?.county ||
  suggestion?.address?.state ||
  '';

const parsePhotoUrls = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const PageCreerAnnonce = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [disponibilites, setDisponibilites] = useState([]);
  const [rangeDraft, setRangeDraft] = useState(emptyAvailabilityRange);

  useEffect(() => {
    const loadAnnonce = async () => {
      if (!editId) return;

      try {
        const annonces = await logementController.getMesAnnonces();
        const annonce = annonces.find((item) => String(item.id) === String(editId));
        if (!annonce) return;

        setForm((current) => ({
          ...current,
          titre: annonce.titre || '',
          description: annonce.description || '',
          type_logement: annonce.type_logement || annonce.type || 'appartement',
          adresse: annonce.adresse || '',
          ville: annonce.ville || '',
          pays: annonce.pays || 'Algerie',
          latitude: annonce.latitude ?? annonce.lat ?? '',
          longitude: annonce.longitude ?? annonce.lng ?? '',
          nb_chambres: annonce.nb_chambres || annonce.chambres || 1,
          nb_lits: annonce.nb_lits || annonce.lits || 1,
          nb_salles_de_bain: annonce.nb_salles_de_bain || annonce.sallesDeBain || 1,
          capacite_accueil: annonce.capacite_accueil || annonce.voyageurs || 1,
          prix_par_nuit: annonce.prix_par_nuit || annonce.prix || 5000,
          mode_reservation: annonce.mode_reservation || 'sur_approbation',
          politique_annulation: annonce.politique_annulation || 'moderee',
          regles_maison: annonce.regles_maison || '',
          equipements: annonce.equipements || [],
          photos: [],
          photo_urls_text: Array.isArray(annonce.photos) ? annonce.photos.join(', ') : '',
        }));

        setLocationSearch([annonce.adresse, annonce.ville].filter(Boolean).join(', '));

        const ranges = await logementController.getDisponibilites(editId);
        setDisponibilites(
          (ranges || [])
            .filter((item) => item.source_blocage !== 'reservation')
            .map((item) => ({
              date_debut: item.date_debut,
              date_fin: item.date_fin,
              est_bloque: item.est_bloque !== false,
              source_blocage: item.source_blocage || 'manuel',
              note_interne: item.note_interne || '',
            }))
        );
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadAnnonce();
  }, [editId]);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const toggleEquipement = (value) =>
    setForm((current) => ({
      ...current,
      equipements: current.equipements.includes(value)
        ? current.equipements.filter((item) => item !== value)
        : [...current.equipements, value],
    }));

  const handleLocationSelect = (suggestion) => {
    const nextCity = getCityFromSuggestion(suggestion);
    setLocationSearch(suggestion.display_name || '');
    setForm((current) => ({
      ...current,
      adresse: suggestion.display_name || current.adresse,
      ville: nextCity || current.ville,
      latitude: suggestion.lat ? Number(suggestion.lat) : current.latitude,
      longitude: suggestion.lon ? Number(suggestion.lon) : current.longitude,
    }));
  };

  const addAvailabilityRange = () => {
    if (!rangeDraft.date_debut || !rangeDraft.date_fin) {
      setError('Choisis une date de debut et une date de fin pour bloquer une plage.');
      return;
    }
    if (rangeDraft.date_fin < rangeDraft.date_debut) {
      setError('La date de fin doit etre egale ou posterieure a la date de debut.');
      return;
    }

    setDisponibilites((current) => [...current, { ...rangeDraft }]);
    setRangeDraft(emptyAvailabilityRange);
    setError('');
  };

  const removeAvailabilityRange = (index) => {
    setDisponibilites((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...form,
      latitude: form.latitude === '' ? undefined : Number(form.latitude),
      longitude: form.longitude === '' ? undefined : Number(form.longitude),
      photo_urls: parsePhotoUrls(form.photo_urls_text),
    };

    try {
      let logement;
      if (editId) {
        logement = await logementController.updateLogement(editId, payload);
      } else {
        logement = await logementController.creerLogement(payload);
      }

      await logementController.setDisponibilites(logement.id, disponibilites);
      navigate('/dashboard-hote');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const canManageListings = user && (user.role_type === 'hote' || user.role_type === 'admin');

  if (!canManageListings) {
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
          <div
            style={{
              maxWidth: '520px',
              padding: 'var(--spacing-8)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface-lowest)',
              boxShadow: 'var(--shadow-ambient)',
            }}
          >
            <h1 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--spacing-3)' }}>
              Espace reserve aux hotes
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-6)' }}>
              Connecte-toi avec un compte hote pour publier et gerer tes annonces.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
              {!user ? (
                <button className="btn-primary" onClick={() => navigate('/connexion')}>
                  Se connecter
                </button>
              ) : null}
              <button className="btn-outline" onClick={() => navigate('/')}>
                Retour a l accueil
              </button>
            </div>
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
        style={{
          flex: 1,
          marginTop: 'var(--spacing-16)',
          maxWidth: '860px',
          paddingBottom: 'var(--spacing-16)',
        }}
      >
        <header style={{ marginBottom: 'var(--spacing-12)' }}>
          <h1
            style={{
              fontSize: 'var(--display-md)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--spacing-4)',
              lineHeight: 1.1,
            }}
          >
            {editId ? 'Modifier votre logement' : 'Publier votre logement'}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>
            Renseigne les informations essentielles, les equipements, les photos et les dates
            indisponibles.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: 'var(--surface-lowest)',
            padding: 'var(--spacing-8)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-ambient)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-8)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>
              Informations generales
            </h2>
            <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
              <input
                value={form.titre}
                onChange={(event) => updateField('titre', event.target.value)}
                placeholder="Titre"
                className="input-field"
                required
              />
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Description detaillee"
                rows="5"
                className="input-field"
                required
              />
              <select
                value={form.type_logement}
                onChange={(event) => updateField('type_logement', event.target.value)}
                className="input-field"
              >
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="chambre">Chambre</option>
                <option value="villa">Villa</option>
                <option value="chalet">Chalet</option>
              </select>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>
              Adresse geolocalisee
            </h2>
            <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
              <LocationSearchInput
                value={locationSearch}
                onChange={setLocationSearch}
                onSelect={handleLocationSelect}
                placeholder="Rechercher une adresse"
              />
              <input
                value={form.adresse}
                onChange={(event) => updateField('adresse', event.target.value)}
                placeholder="Adresse complete"
                className="input-field"
                required
              />
              <input
                value={form.ville}
                onChange={(event) => updateField('ville', event.target.value)}
                placeholder="Ville"
                className="input-field"
                required
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--spacing-4)',
                }}
              >
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(event) => updateField('latitude', event.target.value)}
                  placeholder="Latitude"
                  className="input-field"
                />
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(event) => updateField('longitude', event.target.value)}
                  placeholder="Longitude"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>
              Capacite et prix
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 'var(--spacing-4)',
              }}
            >
              <input
                type="number"
                min="1"
                value={form.capacite_accueil}
                onChange={(event) => updateField('capacite_accueil', Number(event.target.value))}
                placeholder="Capacite"
                className="input-field"
              />
              <input
                type="number"
                min="0"
                value={form.nb_chambres}
                onChange={(event) => updateField('nb_chambres', Number(event.target.value))}
                placeholder="Chambres"
                className="input-field"
              />
              <input
                type="number"
                min="1"
                value={form.nb_lits}
                onChange={(event) => updateField('nb_lits', Number(event.target.value))}
                placeholder="Lits"
                className="input-field"
              />
              <input
                type="number"
                min="1"
                value={form.nb_salles_de_bain}
                onChange={(event) => updateField('nb_salles_de_bain', Number(event.target.value))}
                placeholder="Salles de bain"
                className="input-field"
              />
              <input
                type="number"
                min="1"
                value={form.prix_par_nuit}
                onChange={(event) => updateField('prix_par_nuit', Number(event.target.value))}
                placeholder="Prix / nuit"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>
              Regles et reservation
            </h2>
            <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
              <select
                value={form.mode_reservation}
                onChange={(event) => updateField('mode_reservation', event.target.value)}
                className="input-field"
              >
                <option value="sur_approbation">Sur approbation</option>
                <option value="instantanee">Instantanee</option>
              </select>
              <select
                value={form.politique_annulation}
                onChange={(event) => updateField('politique_annulation', event.target.value)}
                className="input-field"
              >
                <option value="souple">Souple</option>
                <option value="moderee">Moderee</option>
                <option value="stricte">Stricte</option>
              </select>
              <textarea
                value={form.regles_maison}
                onChange={(event) => updateField('regles_maison', event.target.value)}
                placeholder="Regles de la maison"
                rows="4"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>
              Equipements
            </h2>
            <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
              {availableEquipements.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleEquipement(item)}
                  className={form.equipements.includes(item) ? 'btn-primary' : 'btn-outline'}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>
              Photos
            </h2>
            <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => updateField('photos', Array.from(event.target.files || []))}
              />
              <textarea
                value={form.photo_urls_text}
                onChange={(event) => updateField('photo_urls_text', event.target.value)}
                placeholder="Ou colle des URLs d images separees par des virgules"
                rows="3"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>
              Disponibilites
            </h2>
            <div
              style={{
                display: 'grid',
                gap: 'var(--spacing-4)',
                padding: 'var(--spacing-5)',
                borderRadius: 'var(--radius-DEFAULT)',
                backgroundColor: 'var(--surface-low)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 'var(--spacing-4)',
                }}
              >
                <input
                  type="date"
                  value={rangeDraft.date_debut}
                  onChange={(event) => setRangeDraft((current) => ({ ...current, date_debut: event.target.value }))}
                  className="input-field"
                />
                <input
                  type="date"
                  value={rangeDraft.date_fin}
                  onChange={(event) => setRangeDraft((current) => ({ ...current, date_fin: event.target.value }))}
                  className="input-field"
                />
                <select
                  value={rangeDraft.source_blocage}
                  onChange={(event) =>
                    setRangeDraft((current) => ({ ...current, source_blocage: event.target.value }))
                  }
                  className="input-field"
                >
                  <option value="manuel">Bloquer la date</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <input
                value={rangeDraft.note_interne}
                onChange={(event) => setRangeDraft((current) => ({ ...current, note_interne: event.target.value }))}
                placeholder="Note interne optionnelle"
                className="input-field"
              />
              <div>
                <button type="button" className="btn-outline" onClick={addAvailabilityRange}>
                  Ajouter cette plage
                </button>
              </div>

              {disponibilites.length > 0 ? (
                <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                  {disponibilites.map((item, index) => (
                    <div
                      key={`${item.date_debut}-${item.date_fin}-${index}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 'var(--spacing-4)',
                        alignItems: 'center',
                        padding: 'var(--spacing-4)',
                        borderRadius: 'var(--radius-DEFAULT)',
                        backgroundColor: 'var(--surface-lowest)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {item.date_debut} au {item.date_fin}
                        </div>
                        <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                          {item.source_blocage === 'maintenance' ? 'Maintenance' : 'Date bloquee'}
                          {item.note_interne ? ` - ${item.note_interne}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => removeAvailabilityRange(index)}
                        style={{ color: 'var(--error)' }}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
                  Aucune plage bloquee. Les voyageurs pourront reserver selon les dates disponibles.
                </div>
              )}
            </div>
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

          <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
            <button type="button" className="btn-outline" onClick={() => navigate(-1)} style={{ flex: 1 }}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? (editId ? 'Mise a jour...' : 'Publication...') : editId ? 'Enregistrer les modifications' : "Publier l annonce"}
            </button>
          </div>
        </form>
      </div>

      <footer
        style={{
          padding: 'var(--spacing-6) 0',
          borderTop: '1px solid var(--surface-high)',
          textAlign: 'center',
          color: 'var(--on-surface-variant)',
          fontSize: 'var(--body-sm)',
          marginTop: 'auto',
        }}
      >
        <p style={{ marginBottom: 'var(--spacing-4)' }}>© 2026 algbnb</p>
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
