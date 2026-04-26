export class Avis {
  constructor({ id, logementId, auteurId, noteLogement, noteHote, commentaire }) {
    this.id = id;
    this.logementId = logementId;
    this.auteurId = auteurId;
    this.noteLogement = noteLogement;
    this.noteHote = noteHote;
    this.commentaire = commentaire;
  }
}
