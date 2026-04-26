const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error('[server] middleware error:', error.message);

  if (error.name === 'MulterError') {
    return res.status(400).json({ erreur: error.message });
  }

  const status = Number(error.status || error.statusCode || 500);
  if (Array.isArray(error.erreurs)) {
    return res.status(status).json({ erreurs: error.erreurs });
  }

  return res.status(status).json({
    erreur: error.message || 'Erreur serveur.',
  });
};

module.exports = { errorHandler };
