export class Utilisateur {
  constructor({ id, nom, email, telephone, role, photo }) {
    this.id = id;
    this.nom = nom;
    this.email = email;
    this.telephone = telephone;
    this.role = role || 'voyageur'; // ou 'hote', 'admin'
    this.photo = photo;
  }
}
