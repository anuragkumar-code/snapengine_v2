const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Helper to ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Middleware to process images after Multer
module.exports = async function processImage(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }
    const userId = req.user.id.toString();
    const albumId = req.params.albumId || 'temp';
    req.processedFiles = [];
    for (const file of req.files) {
      const ext = path.extname(file.filename);
      const baseName = path.basename(file.filename, ext);
      const uploadsRoot = path.join(__dirname, '../uploads', userId, albumId);
      // Directories for each version
      const originalDir = path.join(uploadsRoot, 'original');
      const mediumDir = path.join(uploadsRoot, 'medium');
      const thumbDir = path.join(uploadsRoot, 'thumbnail');
      ensureDir(mediumDir);
      ensureDir(thumbDir);
      // Paths
      const originalPath = path.join('uploads', userId, albumId, 'original', file.filename);
      const mediumPath = path.join('uploads', userId, albumId, 'medium', file.filename);
      const thumbPath = path.join('uploads', userId, albumId, 'thumbnail', file.filename);
      // Process medium
      await sharp(file.path)
        .resize({ width: 1024, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(path.join(mediumDir, file.filename));
      // Process thumbnail
      await sharp(file.path)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toFile(path.join(thumbDir, file.filename));
      // Attach all paths for this file
      req.processedFiles.push({
        original_path: originalPath,
        medium_path: mediumPath,
        thumb_path: thumbPath,
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
    }
    next();
  } catch (err) {
    next(err);
  }
} 