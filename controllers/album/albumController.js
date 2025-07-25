const albumService = require('../../services/album/albumService');
const logger = require('../../config/logger');

class AlbumController {
  async createAlbum(req, res) {
    try {
      const albumData = {
        ...req.body,
        cover_photo: req.file ? req.file.path.replace(/\\/g, '/') : null
      };

      const result = await albumService.createAlbum(req.user.id, albumData);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Create album controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to create album' });
    }
  }

  async getUserAlbums(req, res) {
    try {
      const result = await albumService.getUserAlbums(req.user.id, req.query);
      res.json(result);
    } catch (error) {
      logger.error('Get user albums controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to get albums' });
    }
  }

  async getSharedAlbums(req, res) {
    try {
      const result = await albumService.getSharedAlbums(req.user.id, req.query);
      res.json(result);
    } catch (error) {
      logger.error('Get shared albums controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to get shared albums' });
    }
  }

  async getAlbumById(req, res) {
    try {
      const result = await albumService.getAlbumById(req.params.albumId, req.user.id);
      res.json(result);
    } catch (error) {
      logger.error('Get album by id controller error:', error);
      res.status(404).json({ success: false, message: error.message || 'Album not found' });
    }
  }

  async updateAlbum(req, res) {
    try {
      const result = await albumService.updateAlbum(req.params.albumId, req.user.id, req.body);
      res.json(result);
    } catch (error) {
      logger.error('Update album controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to update album' });
    }
  }

  async deleteAlbum(req, res) {
    try {
      const result = await albumService.deleteAlbum(req.params.albumId, req.user.id);
      res.json(result);
    } catch (error) {
      logger.error('Delete album controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to delete album' });
    }
  }

  async shareAlbum(req, res) {
    try {
      const result = await albumService.shareAlbum(req.params.albumId, req.user.id, req.body);
      res.json(result);
    } catch (error) {
      logger.error('Share album controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to share album' });
    }
  }

  async respondToShare(req, res) {
    try {
      const result = await albumService.respondToShare(req.params.shareId, req.user.id, req.body.response);
      res.json(result);
    } catch (error) {
      logger.error('Respond to share controller error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to respond to share' });
    }
  }
}

module.exports = new AlbumController(); 