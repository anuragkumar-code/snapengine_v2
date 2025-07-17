const { AlbumShare, Album } = require('../models/associations');
const logger = require('../config/logger');

const checkAlbumOwnership = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const userId = req.user.id;

    const album = await Album.findOne({
      where: { id: albumId, user_id: userId }
    });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found or you do not have permission to access it'
      });
    }

    req.album = album;
    next();
  } catch (error) {
    logger.error('Album ownership check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const checkAlbumAccess = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const userId = req.user.id;

    // Check if user owns the album
    let album = await Album.findOne({
      where: { id: albumId, user_id: userId }
    });

    if (album) {
      req.album = album;
      req.isOwner = true;
      req.permissions = {
        can_view: true,
        can_add: true,
        can_edit: true,
        can_delete: true,
        can_comment: true,
        can_download: true
      };
      return next();
    }

    // Check if album is shared with user
    const share = await AlbumShare.findOne({
      where: {
        album_id: albumId,
        shared_with: userId,
        status: 'accepted'
      },
      include: [{
        model: Album,
        as: 'album'
      }]
    });

    if (share) {
      req.album = share.album;
      req.isOwner = false;
      req.permissions = share.permissions;
      return next();
    }

    return res.status(404).json({
      success: false,
      message: 'Album not found or you do not have permission to access it'
    });
  } catch (error) {
    logger.error('Album access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.isOwner || req.permissions[permission]) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: `You do not have permission to ${permission.replace('can_', '')}`
      });
    }
  };
};

module.exports = {
  checkAlbumOwnership,
  checkAlbumAccess,
  requirePermission
};