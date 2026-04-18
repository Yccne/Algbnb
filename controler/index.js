process.on('uncaughtException', (err) => {
  console.error('ERREUR:', err.message);
});

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const logementRoutes = require('./routes/logements');
const reservationRoutes = require('./routes/reservations');

app.use('/api/auth', authRoutes);
app.use('/api/logements', logementRoutes);
app.use('/api/reservations', reservationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API Algbnb fonctionne ✅' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});