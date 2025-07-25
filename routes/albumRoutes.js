const express = require('express');
const albumController = require('../controllers/album/albumController');
const { authenticate } = require('../middleware/auth');
const { checkAlbumOwnership, checkAlbumAccess, requirePermission } = require('../middleware/albumPermissions');
const uploadCoverPhoto = require('../middleware/coverUpload');

const router = express.Router();

// Create album
router.post('/', authenticate, uploadCoverPhoto.single('cover_photo'), albumController.createAlbum);
// Get all albums for user
router.get('/', authenticate, albumController.getUserAlbums);
// Get all shared albums for user
router.get('/shared', authenticate, albumController.getSharedAlbums);
// Get album by id (with access check)
router.get('/:albumId', authenticate, checkAlbumAccess, albumController.getAlbumById);
// Update album (ownership required)
router.put('/:albumId', authenticate, checkAlbumOwnership, albumController.updateAlbum);
// Delete album (ownership required)
router.delete('/:albumId', authenticate, checkAlbumOwnership, albumController.deleteAlbum);
// Share album (ownership required)
router.post('/:albumId/share', authenticate, checkAlbumOwnership, albumController.shareAlbum);
// Respond to share invite
router.post('/share/:shareId/respond', authenticate, albumController.respondToShare);

module.exports = router; 