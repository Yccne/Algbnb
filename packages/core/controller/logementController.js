<<<<<<< HEAD
const API_URL = 'http://localhost:3001/api';

export const getLogements = async () => {
  const res = await fetch(`${API_URL}/logements`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};

export const getLogement = async (id) => {
  const res = await fetch(`${API_URL}/logements/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};

export const creerLogement = async (logementData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/logements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(logementData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};

export const supprimerLogement = async (id) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/logements/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};
=======
import { Logement } from '../model/Logement.js';

const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const mockLogements = [
  new Logement({
    id: 1,
    titre: 'Dar El Dey - Casbah',
    type: 'Maison traditionnelle',
    ville: 'Alger, Casbah',
    prix: 18000,
    photos: ['https://images.unsplash.com/photo-1596482110931-e497551ab66e?auto=format&w=800&q=80'],
    equipements: ['Wi-Fi', 'Terrasse panoramique', 'Climatisation', 'Architecture mauresque', 'Vue mer', 'Cuisine équipée', 'Annulation gratuite'],
    note: 4.95,
    voyageurs: 6,
    chambres: 3,
    lits: 4,
    sallesDeBain: 2,
    description: "Plongez au cœur de l'histoire en séjournant dans ce palais mauresque magnifiquement restauré au sein de la Casbah d'Alger. Admirez la vue époustouflante sur la baie depuis le toit-terrasse (stah). Dégustez votre thé à la menthe au son des vagues.",
    hote: { nom: 'Yanis Mahrez', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80', depuis: '4 ans' },
    lat: 36.7850, lng: 3.0570
  }),
  new Logement({
    id: 2,
    titre: 'Villa Oranaise avec Piscine',
    type: 'Villa entière',
    ville: 'Oran, Corniche',
    prix: 25000,
    photos: ['https://images.unsplash.com/photo-1580211758509-3543d3fb496a?auto=format&w=800&q=80'],
    equipements: ['Piscine', 'Barbecue', 'Jardin', 'Wi-Fi', 'Parking sécurisé', 'Annulation gratuite'],
    note: 4.88,
    voyageurs: 8,
    chambres: 4,
    lits: 6,
    sallesDeBain: 3,
    description: "Une somptueuse villa moderne sur la corniche oranaise. Avec sa grande piscine et son espace extérieur aménagé, profitez d'une ambiance estivale parfaite. Idéal pour les familles cherchant confort et intimité près des plages d'Aïn El Turk.",
    hote: { nom: 'Amira Benali', photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&q=80', depuis: '6 ans' },
    lat: 35.6969, lng: -0.6331
  }),
  new Logement({
    id: 3,
    titre: 'Appartement Vue sur les Ponts',
    type: 'Appartement entier',
    ville: 'Constantine',
    prix: 14000,
    photos: ['https://images.unsplash.com/photo-1627447239247-fde0f2b3eed1?auto=format&w=800&q=80'],
    equipements: ['Wi-Fi', 'Ascenseur', 'Balcon', 'Cuisine équipée', 'Climatisation'],
    note: 4.92,
    voyageurs: 4,
    chambres: 2,
    lits: 2,
    sallesDeBain: 1,
    description: "Séjournez dans la ville des ponts suspendus. Ce bel appartement au centre-ville offre une vue imprenable sur le pont Sidi M'Cid et les gorges du Rhummel. Moderne, spacieux et proche de toutes les commodités.",
    hote: { nom: 'Karim Ziani', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80', depuis: '3 ans' },
    lat: 36.3650, lng: 6.6147
  }),
  new Logement({
    id: 4,
    titre: 'Chalet Cap Carbon',
    type: 'Chalet',
    ville: 'Béjaïa, Cap Carbon',
    prix: 12000,
    photos: ['https://images.unsplash.com/photo-1590059155255-b040e3bc6b93?auto=format&w=800&q=80'],
    equipements: ['Accès plage', 'Terrasse', 'Nature', 'Wi-Fi', 'Parking', 'Vue mer'],
    note: 4.97,
    voyageurs: 5,
    chambres: 2,
    lits: 3,
    sallesDeBain: 1,
    description: "Un chalet perché sur les falaises de Béjaïa avec vue directe sur le Parc National du Gouraya et la Méditerranée. L'endroit rêvé pour se ressourcer en pleine nature, entre mer cristalline et montagnes verdoyantes.",
    hote: { nom: 'Samir Bouzid', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80', depuis: '5 ans' },
    lat: 36.7551, lng: 5.0768
  }),
  new Logement({
    id: 5,
    titre: 'Oasis Guest House',
    type: 'Maison d\'hôtes',
    ville: 'Ghardaïa, M\'Zab',
    prix: 16000,
    photos: ['https://images.unsplash.com/photo-1601662528567-526cd06f6580?auto=format&w=800&q=80'],
    equipements: ['Wi-Fi', 'Patio', 'Architecture authentique', 'Guides locaux'],
    note: 4.89,
    voyageurs: 3,
    chambres: 1,
    lits: 2,
    sallesDeBain: 1,
    description: "Vivez la magie du Sahara dans une maison traditionnelle mozabite. Plongez dans l'atmosphère unique de Ghardaïa, avec son architecture millénaire et ses palmeraies apaisantes. Petits déjeuners locaux inclus.",
    hote: { nom: 'Nour El Houda', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80', depuis: '2 ans' },
    lat: 32.4911, lng: 3.6735
  }),
  new Logement({
    id: 6,
    titre: 'Appartement Haut Standing Hydra',
    type: 'Appartement entier',
    ville: 'Alger, Hydra',
    prix: 22000,
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&w=800&q=80'],
    equipements: ['Smart TV', 'Balcon', 'Design moderne', 'Sécurité 24/7', 'Parking privé'],
    note: 4.91,
    voyageurs: 4,
    chambres: 2,
    lits: 2,
    sallesDeBain: 2,
    description: "Appartement de luxe dans le quartier très prisé d'Hydra. Finitions modernes, domotique, et mobilier design garantissent un séjour haut de gamme en plein cœur du pôle dynamique d'Alger.",
    hote: { nom: 'Mohamed Ali', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80', depuis: '7 ans' },
    lat: 36.7538, lng: 3.0588
  })
];

export const getLogements = async () => {
  await mockDelay(800);
  return mockLogements;
};

export const getLogementById = async (id) => {
  await mockDelay(500);
  const log = mockLogements.find(l => l.id == id);
  if (!log) throw new Error("Logement non trouvé");
  return log;
};

export const rechercherLogements = async (query) => {
  await mockDelay(600);
  if (!query) return mockLogements;
  const q = query.toLowerCase();
  return mockLogements.filter(l =>
    l.ville.toLowerCase().includes(q) || l.titre.toLowerCase().includes(q) || l.type.toLowerCase().includes(q)
  );
};

export const creerLogement = async (logementData) => {
  await mockDelay(1000);
  const newLogement = new Logement({
    id: Date.now(),
    ...logementData
  });
  mockLogements.push(newLogement);
  return newLogement;
};

export const supprimerLogement = async (id) => {
  await mockDelay(600);
  const idx = mockLogements.findIndex(l => l.id == id);
  if (idx !== -1) mockLogements.splice(idx, 1);
  return true;
};
>>>>>>> de3ca1ab7141bff088d354dd13bdca89f7cc6f67
