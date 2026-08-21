const multer = require('multer');
const fs = require('fs');
const path = require('path');

const {
  uploadDir,
  maxVideoBytes,
} = require('../config/env');

fs.mkdirSync(uploadDir, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDir);
  },

  filename: (_request, file, callback) => {
    const extension =
      path.extname(file.originalname) || '.webm';

    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${extension}`;

    callback(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: maxVideoBytes,
  },

 fileFilter: (_request, file, callback) => {
  const isVideo =
    file.mimetype.startsWith('video/');

  const isAudio =
    file.mimetype.startsWith('audio/');

  const isWebmFile =
    path.extname(file.originalname).toLowerCase() ===
    '.webm';

  if (isVideo || isAudio) {
    callback(null, true);
    return;
  }

  if (isWebmFile && file.mimetype === 'text/plain') {
    file.mimetype = 'video/webm';
    callback(null, true);
    return;
  }

  callback(
    new Error(
      `Unsupported media type: ${file.mimetype}`
    ),
    false
  );
},
});

module.exports = upload;