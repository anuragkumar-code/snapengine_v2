const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Album = require('../models/Album'); 

const uploadDir = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.user.id;

      const last = await Album.findOne({ order: [['id', 'DESC']] });
      const nextAlbumId = last ? last.id + 1 : 1;

      const coverDir = path.join(uploadDir, userId.toString(), nextAlbumId.toString(), 'cover_photo');

      if (!fs.existsSync(coverDir)) {
        fs.mkdirSync(coverDir, { recursive: true });
      }

      cb(null, coverDir);

      req.body.album_id = nextAlbumId;

    } catch (err) {
      cb(err, null); 
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const uploadCoverPhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, 
    files: 1
  }
});

module.exports = uploadCoverPhoto;
