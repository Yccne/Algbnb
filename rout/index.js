process.on('uncaughtException', (error) => {
  console.error('[server] uncaughtException:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('[server] unhandledRejection:', error?.message || error);
});

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { checkDatabaseConnection } = require('./db');
const { startReminderScheduler } = require('./utils/reminders');

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/logements', require('./routes/logements'));
app.use('/api/annonces', require('./routes/creerAnnonce'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/avis', require('./routes/avis'));
app.use('/api/favoris', require('./routes/favoris'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/api/health', async (req, res) => {
  try {
    const database = await checkDatabaseConnection();
    res.json({
      ok: true,
      api: 'ready',
      database,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      api: 'error',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'API algbnb prete.' });
});

app.use((req, res) => {
  res.status(404).json({ erreur: 'Route introuvable.' });
});

app.use((error, req, res, next) => {
  console.error('[server] middleware error:', error.message);
  if (error.name === 'MulterError') {
    return res.status(400).json({ erreur: error.message });
  }
  return res.status(500).json({ erreur: error.message || 'Erreur serveur.' });
});

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, async () => {
  console.log(`[server] API lancee sur http://${HOST}:${PORT}`);
  try {
    const database = await checkDatabaseConnection();
    console.log(`[server] PostgreSQL connecte sur la base ${database.database_name}`);
    startReminderScheduler();
  } catch (error) {
    console.error('[server] Connexion PostgreSQL impossible:', error.message);
  }
});
