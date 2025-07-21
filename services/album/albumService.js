const { Album, Photo, AlbumShare, AlbumActivity, User } = require('../../models/associations');
const logger = require('../../config/logger');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

class AlbumService {
  async createAlbum(userId, albumData) {
    try {
      const album = await Album.create({
        ...albumData,
        user_id: userId
      });

      // Log activity
      await AlbumActivity.create({
        album_id: album.id,
        user_id: userId,
        action: 'created',
        details: { album_title: album.title }
      });

      logger.info(`Album created: ${album.id} by user: ${userId}`);

      return {
        success: true,
        data: album,
        message: 'Album created successfully'
      };
    } catch (error) {
      logger.error('Create album error:', error);
      throw error;
    }
  }

  async getUserAlbums(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        search,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      const whereClause = { user_id: userId };

      if (type) {
        whereClause.type = type;
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const albums = await Album.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Photo,
            as: 'photos',
            where: { is_private: false },
            required: false,
            limit: 1,
            order: [['is_cover', 'DESC'], ['created_at', 'ASC']]
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        success: true,
        data: {
          albums: albums.rows,
          total: albums.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(albums.count / limit)
        },
        message: 'Albums retrieved successfully'
      };
    } catch (error) {
      logger.error('Get user albums error:', error);
      throw error;
    }
  }

  async getSharedAlbums(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status = 'accepted'
      } = options;

      const offset = (page - 1) * limit;

      const sharedAlbums = await AlbumShare.findAndCountAll({
        where: {
          shared_with: userId,
          status: status
        },
        include: [
          {
            model: Album,
            as: 'album',
            include: [
              {
                model: User,
                as: 'owner',
                attributes: ['id', 'first_name', 'last_name', 'email']
              },
              {
                model: Photo,
                as: 'photos',
                where: { is_private: false },
                required: false,
                limit: 1,
                order: [['is_cover', 'DESC'], ['created_at', 'ASC']]
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        success: true,
        data: {
          albums: sharedAlbums.rows,
          total: sharedAlbums.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(sharedAlbums.count / limit)
        },
        message: 'Shared albums retrieved successfully'
      };
    } catch (error) {
      logger.error('Get shared albums error:', error);
      throw error;
    }
  }

  async getAlbumById(albumId, userId) {
    try {
      const album = await Album.findByPk(albumId, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Photo,
            as: 'photos',
            where: { is_private: false },
            required: false,
            order: [['order_index', 'ASC'], ['created_at', 'ASC']]
          }
        ]
      });

      if (!album) {
        throw new Error('Album not found');
      }

      // Check if user has access to this album
      let hasAccess = false;
      let permissions = {};

      if (album.user_id === userId) {
        hasAccess = true;
        permissions = {
          can_view: true,
          can_add: true,
          can_edit: true,
          can_delete: true,
          can_comment: true,
          can_download: true
        };
      } else {
        const share = await AlbumShare.findOne({
          where: {
            album_id: albumId,
            shared_with: userId,
            status: 'accepted'
          }
        });

        if (share) {
          hasAccess = true;
          permissions = share.permissions;
        }
      }

      if (!hasAccess) {
        throw new Error('You do not have permission to access this album');
      }

      return {
        success: true,
        data: {
          album,
          permissions
        },
        message: 'Album retrieved successfully'
      };
    } catch (error) {
      logger.error('Get album by id error:', error);
      throw error;
    }
  }

  async updateAlbum(albumId, userId, updateData) {
    try {
      const album = await Album.findOne({
        where: { id: albumId, user_id: userId }
      });

      if (!album) {
        throw new Error('Album not found or you do not have permission to update it');
      }

      await album.update(updateData);

      // Log activity
      await AlbumActivity.create({
        album_id: albumId,
        user_id: userId,
        action: 'updated',
        details: { updated_fields: Object.keys(updateData) }
      });

      logger.info(`Album updated: ${albumId} by user: ${userId}`);

      return {
        success: true,
        data: album,
        message: 'Album updated successfully'
      };
    } catch (error) {
      logger.error('Update album error:', error);
      throw error;
    }
  }

  async deleteAlbum(albumId, userId) {
    try {
      const album = await Album.findOne({
        where: { id: albumId, user_id: userId }
      });

      if (!album) {
        throw new Error('Album not found or you do not have permission to delete it');
      }

      // Delete all photos in the album
      const photos = await Photo.findAll({
        where: { album_id: albumId }
      });

      for (const photo of photos) {
        // Delete all image versions
        const paths = [photo.original_path, photo.medium_path, photo.thumb_path];
        for (const p of paths) {
          if (p && fs.existsSync(p)) {
            try {
              fs.unlinkSync(p);
            } catch (err) {
              logger.warn(`Failed to delete file: ${p}`);
            }
          }
        }
      }

      // Delete from database
      await Photo.destroy({ where: { album_id: albumId } });
      await AlbumShare.destroy({ where: { album_id: albumId } });
      await AlbumActivity.destroy({ where: { album_id: albumId } });
      await album.destroy();

      logger.info(`Album deleted: ${albumId} by user: ${userId}`);

      return {
        success: true,
        message: 'Album deleted successfully'
      };
    } catch (error) {
      logger.error('Delete album error:', error);
      throw error;
    }
  }

  async shareAlbum(albumId, userId, shareData) {
    try {
      const { shared_with, permissions, message, expires_at } = shareData;

      // Check if album exists and user owns it
      const album = await Album.findOne({
        where: { id: albumId, user_id: userId }
      });

      if (!album) {
        throw new Error('Album not found or you do not have permission to share it');
      }

      // Check if target user exists
      const targetUser = await User.findByPk(shared_with);
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Check if already shared
      const existingShare = await AlbumShare.findOne({
        where: {
          album_id: albumId,
          shared_with: shared_with
        }
      });

      if (existingShare) {
        throw new Error('Album already shared with this user');
      }

      // Create share
      const share = await AlbumShare.create({
        album_id: albumId,
        shared_by: userId,
        shared_with: shared_with,
        permissions: permissions || {
          can_view: true,
          can_add: false,
          can_edit: false,
          can_delete: false,
          can_comment: true,
          can_download: true
        },
        message,
        expires_at
      });

      // Log activity
      await AlbumActivity.create({
        album_id: albumId,
        user_id: userId,
        action: 'shared',
        details: { shared_with_user: shared_with }
      });

      logger.info(`Album shared: ${albumId} by user: ${userId} with user: ${shared_with}`);

      return {
        success: true,
        data: share,
        message: 'Album shared successfully'
      };
    } catch (error) {
      logger.error('Share album error:', error);
      throw error;
    }
  }

  async respondToShare(shareId, userId, response) {
    try {
      const share = await AlbumShare.findOne({
        where: {
          id: shareId,
          shared_with: userId,
          status: 'pending'
        }
      });

      if (!share) {
        throw new Error('Share invitation not found');
      }

      await share.update({
        status: response,
        accepted_at: response === 'accepted' ? new Date() : null
      });

      // Log activity
      await AlbumActivity.create({
        album_id: share.album_id,
        user_id: userId,
        action: response === 'accepted' ? 'joined' : 'declined',
        details: { share_id: shareId }
      });

      logger.info(`Share ${response}: ${shareId} by user: ${userId}`);

      return {
        success: true,
        data: share,
        message: `Share ${response} successfully`
      };
    } catch (error) {
      logger.error('Respond to share error:', error);
      throw error;
    }
  }
}

module.exports = new AlbumService();