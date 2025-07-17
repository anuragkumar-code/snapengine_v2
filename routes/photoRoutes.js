const express = require('express');
const photoController = require('../controllers/photos/photoController');
const { authenticate } = require('../middleware/auth');
const { checkAlbumAccess, requirePermission } = require('../middleware/albumPermissions');
const upload = require('../middleware/multer');

const router = express.Router();

// Add photos to album (requires can_add)
router.post('/album/:albumId', authenticate, checkAlbumAccess, requirePermission('can_add'), upload.array('photos', 20), photoController.addPhotos);
// Get all photos in album (requires can_view)
router.get('/album/:albumId', authenticate, checkAlbumAccess, requirePermission('can_view'), photoController.getAlbumPhotos);
// Get all user photos
router.get('/user', authenticate, photoController.getUserPhotos);
// Get photo by id (requires can_view)
router.get('/:photoId', authenticate, photoController.getPhotoById);
// Update photo (requires can_edit)
router.put('/:photoId', authenticate, photoController.updatePhoto);
// Delete photo (requires can_delete)
router.delete('/:photoId', authenticate, photoController.deletePhoto);

module.exports = router; 