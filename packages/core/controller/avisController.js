import { Avis } from '../model/Avis.js';

const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let avisDB = [
  new Avis({ id: 1, logementId: 1, auteurId: 2, noteLogement: 5, noteHote: 5, commentaire: "Super séjour, villa magnifique !" }),
  new Avis({ id: 2, logementId: 2, auteurId: 3, noteLogement: 4, noteHote: 5, commentaire: "Très bien placé, propriétaire sympa." })
];

export const getAvisByLogement = async (logementId) => {
  await mockDelay(600);
  return avisDB.filter(a => a.logementId == logementId);
};

export const laisserAvis = async (avisData) => {
  await mockDelay(800);
  const nouvelAvis = new Avis({ id: Date.now(), ...avisData });
  avisDB.push(nouvelAvis);
  return nouvelAvis;
};
