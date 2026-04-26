export class Logement {
  constructor({ id, titre, type, ville, prix, photos, equipements, note, voyageurs, chambres, lits, sallesDeBain, description, hote, lat, lng }) {
    this.id = id;
    this.titre = titre;
    this.type = type;
    this.ville = ville;
    this.prix = prix;
    this.photos = photos || [];
    this.equipements = equipements || [];
    this.note = note ?? 0;
    this.voyageurs = voyageurs ?? 0;
    this.chambres = chambres ?? 0;
    this.lits = lits ?? 0;
    this.sallesDeBain = sallesDeBain ?? 0;
    this.description = description || '';
    this.hote = hote || null;
    this.lat = lat ?? null;
    this.lng = lng ?? null;
  }
}
