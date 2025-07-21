const photoService = require('../../services/photos/photoService');
const logger = require('../../config/logger');

class PhotoController {
  async addPhotos(req, res) {
    try {
      const result = await photoService.addPhotos(
        req.params.albumId,
        req.user.id,
        req.files,
        req.body,
        req.processedFiles 
      );
      res.status(201).json(result);
    } catch (error) {
      logger.error('Add photos controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to add photos' });
    }
  }

  async updatePhoto(req, res) {
    try {
      const result = await photoService.updatePhoto(req.params.photoId, req.user.id, req.body);
      res.json(result);
    } catch (error) {
      logger.error('Update photo controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to update photo' });
    }
  }

  async deletePhoto(req, res) {
    try {
      const result = await photoService.deletePhoto(req.params.photoId, req.user.id);
      res.json(result);
    } catch (error) {
      logger.error('Delete photo controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to delete photo' });
    }
  }

  async getPhotoById(req, res) {
    try {
      const result = await photoService.getPhotoById(req.params.photoId, req.user.id);
      res.json(result);
    } catch (error) {
      logger.error('Get photo by id controller error:', error);
      res.status(404).json({ success: false, message: error.message || 'Photo not found' });
    }
  }

  async getAlbumPhotos(req, res) {
    try {
      const result = await photoService.getAlbumPhotos(req.params.albumId, req.user.id, req.query);
      res.json(result);
    } catch (error) {
      logger.error('Get album photos controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to get album photos' });
    }
  }

  async getUserPhotos(req, res) {
    try {
      const result = await photoService.getUserPhotos(req.user.id, req.query);
      res.json(result);
    } catch (error) {
      logger.error('Get user photos controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to get user photos' });
    }
  }
}

module.exports = new PhotoController(); 