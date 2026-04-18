export class Logement {
  constructor({ id, titre, type, ville, prix, photos, equipements, note, voyageurs, chambres, lits, sallesDeBain, description, hote, lat, lng }) {
    this.id = id;
    this.titre = titre;
    this.type = type;
    this.ville = ville;
    this.prix = prix;
    this.photos = photos || [];
    this.equipements = equipements || [];
    this.note = note || 0;
    this.voyageurs = voyageurs || 4;
    this.chambres = chambres || 2;
    this.lits = lits || 2;
    this.sallesDeBain = sallesDeBain || 1;
    this.description = description || '';
    this.hote = hote || null;
    this.lat = lat || 36.7538; // Default to Algiers
    this.lng = lng || 3.0588;
  }
}
