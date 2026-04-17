export class Reservation {
  constructor({ id, logementId, voyageurId, dateArrivee, dateDepart, total, statut }) {
    this.id = id;
    this.logementId = logementId;
    this.voyageurId = voyageurId;
    this.dateArrivee = dateArrivee;
    this.dateDepart = dateDepart;
    this.total = total;
    this.statut = statut;
  }
}
