import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { LogementCard } from '../components/LogementCard';
import { BottomNavBar } from '../components/BottomNavBar';
import { logementController } from '@algbnb/core';
import { Link } from 'react-router-dom';
import { Map, List, SlidersHorizontal, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export const PageResultats = () => {
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filteredLogements, setFilteredLogements] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await logementController.getLogements();
      setLogements(data);
      setFilteredLogements(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const [filters, setFilters] = useState({
    prixMin: '',
    prixMax: '',
    type: '',
    chambres: '',
    lits: '',
    equipements: [],
    options: []
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleEquipement = (equipement) => {
    setFilters(prev => ({
      ...prev,
      equipements: prev.equipements.includes(equipement)
        ? prev.equipements.filter(e => e !== equipement)
        : [...prev.equipements, equipement]
    }));
  };

  const toggleOption = (option) => {
    setFilters(prev => ({
      ...prev,
      options: prev.options.includes(option)
        ? prev.options.filter(o => o !== option)
        : [...prev.options, option]
    }));
  };

  const applyFilters = () => {
    let filtered = [...logements];
    
    if (filters.prixMin) filtered = filtered.filter(l => l.prix >= parseInt(filters.prixMin));
    if (filters.prixMax) filtered = filtered.filter(l => l.prix <= parseInt(filters.prixMax));
    if (filters.type) filtered = filtered.filter(l => l.type.toLowerCase().includes(filters.type.toLowerCase()));
    if (filters.chambres) filtered = filtered.filter(l => l.chambres >= parseInt(filters.chambres));
    if (filters.lits) filtered = filtered.filter(l => l.lits >= parseInt(filters.lits));
    if (filters.equipements.length > 0) {
      filtered = filtered.filter(l => filters.equipements.every(eq => l.equipements.includes(eq)));
    }
    if (filters.options.includes('bienNote')) filtered = filtered.filter(l => l.note >= 4.5);
    if (filters.options.includes('annulationGratuite')) filtered = filtered.filter(l => l.equipements.includes('Annulation gratuite'));
    
    setFilteredLogements(filtered);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      prixMin: '',
      prixMax: '',
      type: '',
      chambres: '',
      lits: '',
      equipements: [],
      options: []
    });
    setFilteredLogements(logements);
    setIsFilterModalOpen(false);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-12)', flexWrap: 'wrap', gap: 'var(--spacing-6)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: 'var(--spacing-4)', lineHeight: 1.1 }}>
              {filteredLogements.length} logements trouvés<br/>en Algérie
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>
              Plus de {logements.length} logements pour votre séjour idéal en Algérie.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)', justifyContent: 'flex-end' }}>
               <button 
                 className="btn-outline"
                 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                 onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
               >
                 {viewMode === 'list' ? <Map size={18} /> : <List size={18} />}
                 {viewMode === 'list' ? 'Vue Carte' : 'Vue Liste'}
               </button>
               <button 
                 className="btn-primary"
                 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                 onClick={() => setIsFilterModalOpen(true)}
               >
                 <SlidersHorizontal size={18} /> Filtres
               </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="spinner"></div>
        ) : viewMode === 'list' ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 'var(--spacing-8)',
            marginBottom: 'var(--spacing-16)'
          }}>
            {filteredLogements.map(logement => (
              <LogementCard key={logement.id} logement={logement} />
            ))}
          </div>
        ) : (
          <div style={{ width: '100%', height: '600px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
            <MapContainer 
              center={[36.7538, 3.0588]} 
              zoom={6} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredLogements.map(logement => (
                <Marker key={logement.id} position={[logement.lat, logement.lng]}>
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <img 
                        src={logement.photos[0]} 
                        alt={logement.titre}
                        style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}
                      />
                      <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'bold', marginBottom: '4px' }}>{logement.titre}</h4>
                      <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', marginBottom: '8px' }}>{logement.ville}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>{logement.prix} DZD/nuit</span>
                        <Link to={`/logement/${logement.id}`} style={{ color: 'var(--primary)', fontSize: 'var(--body-sm)', fontWeight: '600' }}>
                          Voir détails
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>

      <footer style={{ padding: 'var(--spacing-6) 0', borderTop: '1px solid var(--surface-high)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', marginTop: 'auto' }}>
        <Link to="#" className="footer-link">Confidentialité</Link>
        <Link to="#" className="footer-link">Conditions</Link>
        <Link to="#" className="footer-link">Plan du site</Link>
        <Link to="#" className="footer-link" style={{marginRight: 0}}>Assistance</Link>
      </footer>
      <BottomNavBar />

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--surface-lowest)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-high)', paddingBottom: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
              <h2 style={{ fontSize: 'var(--headline-md)' }}>Filtres</h2>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-8)' }}>
              <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>Prix par nuit</h3>
              <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={filters.prixMin} 
                  onChange={e => handleFilterChange('prixMin', e.target.value)}
                  style={{ padding: 'var(--spacing-3)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-DEFAULT)', flex: 1 }}
                />
                <span>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={filters.prixMax} 
                  onChange={e => handleFilterChange('prixMax', e.target.value)}
                  style={{ padding: 'var(--spacing-3)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-DEFAULT)', flex: 1 }}
                />
                <span>DZD</span>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-8)' }}>
              <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>Type de logement</h3>
              <select 
                value={filters.type} 
                onChange={e => handleFilterChange('type', e.target.value)}
                style={{ padding: 'var(--spacing-4)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-DEFAULT)', width: '100%', backgroundColor: 'transparent' }}
              >
                <option value="">Tous les types</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison / Villa</option>
                <option value="chambre">Chambre</option>
                <option value="chalet">Chalet</option>
                <option value="maison d'hôtes">Maison d'hôtes</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--spacing-8)' }}>
              <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>Capacité</h3>
              <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Chambres min</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={filters.chambres} 
                    onChange={e => handleFilterChange('chambres', e.target.value)}
                    style={{ padding: 'var(--spacing-3)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-DEFAULT)', width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Lits min</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={filters.lits} 
                    onChange={e => handleFilterChange('lits', e.target.value)}
                    style={{ padding: 'var(--spacing-3)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-DEFAULT)', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-8)' }}>
              <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>Équipements</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                {['Wi-Fi', 'Cuisine équipée', 'Piscine', 'Parking', 'Climatisation', 'Vue mer'].map(eq => (
                  <label key={eq} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={filters.equipements.includes(eq)}
                      onChange={() => toggleEquipement(eq)}
                    />
                    {eq}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-8)' }}>
              <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--spacing-4)' }}>Options spéciales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={filters.options.includes('bienNote')}
                    onChange={() => toggleOption('bienNote')}
                  />
                  Bien noté (4.5+ étoiles)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={filters.options.includes('annulationGratuite')}
                    onChange={() => toggleOption('annulationGratuite')}
                  />
                  Annulation gratuite
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--spacing-6)', borderTop: '1px solid var(--surface-high)' }}>
               <button className="btn-outline" onClick={clearFilters}>Tout effacer</button>
               <button className="btn-primary" onClick={applyFilters}>Afficher les résultats ({filteredLogements.length})</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
