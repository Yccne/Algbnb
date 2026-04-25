const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ensureDir = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

const imageFilter = (req, file, callback) => {
  const accepted = ['image/jpeg', 'image/png', 'image/webp'];
  if (!accepted.includes(file.mimetype)) {
    return callback(new Error('Format non supporté. Utilisez JPG, PNG ou WEBP.'));
  }
  return callback(null, true);
};

const createStorage = (subfolder, prefix) => {
  const destination = path.join(__dirname, '..', '..', 'uploads', subfolder);
  ensureDir(destination);

  return multer.diskStorage({
    destination: (req, file, callback) => callback(null, destination),
    filename: (req, file, callback) => {
      const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
      callback(null, `${prefix}_${Date.now()}_${safeName}`);
    },
  });
};

const createUploader = (subfolder, prefix, maxFiles = 10) =>
  multer({
    storage: createStorage(subfolder, prefix),
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: maxFiles,
    },
  });

module.exports = {
  logementUpload: createUploader('logements', 'logement', 10),
  profilUpload: createUploader('profiles', 'profile', 1),
  messageUpload: createUploader('messages', 'message', 1),
};
