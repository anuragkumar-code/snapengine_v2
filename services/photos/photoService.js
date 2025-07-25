const { Photo, Album, AlbumActivity } = require('../../models/associations');
const logger = require('../../config/logger');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

class PhotoService {
  async addPhotos(albumId, userId, files, photoData = {}, processedFiles = []) {
    try {
      const album = await Album.findByPk(albumId);
      if (!album) {
        throw new Error('Album not found');
      }

      const photos = [];
      let totalSize = 0;

      // Use processedFiles from processImage middleware
      for (const file of files) {
        // Find the processed file info by filename
        const processed = (Array.isArray(processedFiles) ? processedFiles : []).find(f => f.filename === file.filename);
        if (!processed) continue;
        const photo = await Photo.create({
          filename: file.filename,
          original_name: file.originalname,
          original_path: processed.original_path,
          medium_path: processed.medium_path,
          thumb_path: processed.thumb_path,
          file_size: file.size,
          mime_type: file.mimetype,
          caption: photoData.caption || null,
          tags: photoData.tags || null,
          is_private: photoData.is_private || false,
          album_id: albumId,
          user_id: userId,
          order_index: await this.getNextOrderIndex(albumId)
        });
        photos.push(photo);
        totalSize += file.size;
      }

      // Update album stats
      await album.increment('total_photos', { by: photos.length });
      await album.increment('total_size', { by: totalSize });

      // Set first photo as cover if no cover exists
      if (!album.cover_photo && photos.length > 0) {
        await album.update({ cover_photo: photos[0].original_path });
        await photos[0].update({ is_cover: true });
      }

      // Log activity
      await AlbumActivity.create({
        album_id: albumId,
        user_id: userId,
        action: 'photo_added',
        details: { photo_count: photos.length, total_size: totalSize }
      });

      logger.info(`Photos added: ${photos.length} to album: ${albumId} by user: ${userId}`);

      // Prepare full URLs for each version
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const photosWithUrls = photos.map(photo => ({
        id: photo.id,
        filename: photo.filename,
        original_url: `${baseUrl}/${photo.original_path}`,
        medium_url: `${baseUrl}/${photo.medium_path}`,
        thumb_url: `${baseUrl}/${photo.thumb_path}`,
        caption: photo.caption,
        tags: photo.tags,
        is_private: photo.is_private,
        album_id: photo.album_id,
        user_id: photo.user_id,
        created_at: photo.createdAt,
        updated_at: photo.updatedAt
      }));

      return {
        success: true,
        data: photosWithUrls,
        message: 'Photos added successfully'
      };
    } catch (error) {
      logger.error('Add photos error:', error);
      throw error;
    }
  }

  async getNextOrderIndex(albumId) {
    const maxOrder = await Photo.max('order_index', {
      where: { album_id: albumId }
    });
    return (maxOrder || 0) + 1;
  }

  async updatePhoto(photoId, userId, updateData) {
    try {
      const photo = await Photo.findByPk(photoId, {
        include: [{
          model: Album,
          as: 'album'
        }]
      });

      if (!photo) {
        throw new Error('Photo not found');
      }

      // Check if user has permission to update
      if (photo.user_id !== userId && photo.album.user_id !== userId) {
        throw new Error('You do not have permission to update this photo');
      }

      await photo.update(updateData);

      logger.info(`Photo updated: ${photoId} by user: ${userId}`);

      return {
        success: true,
        data: photo,
        message: 'Photo updated successfully'
      };
    } catch (error) {
      logger.error('Update photo error:', error);
      throw error;
    }
  }

  async deletePhoto(photoId, userId) {
    try {
      const photo = await Photo.findByPk(photoId, {
        include: [{
          model: Album,
          as: 'album'
        }]
      });

      if (!photo) {
        throw new Error('Photo not found');
      }

      // Check if user has permission to delete
      if (photo.user_id !== userId && photo.album.user_id !== userId) {
        throw new Error('You do not have permission to delete this photo');
      }

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

      // Update album stats
      await photo.album.decrement('total_photos');
      await photo.album.decrement('total_size', { by: photo.file_size });

      // If this was the cover photo, set another photo as cover
      if (photo.is_cover) {
        const nextPhoto = await Photo.findOne({
          where: {
            album_id: photo.album_id,
            id: { [Op.ne]: photo.id }
          },
          order: [['order_index', 'ASC'], ['created_at', 'ASC']]
        });
        if (nextPhoto) {
          await nextPhoto.update({ is_cover: true });
          await photo.album.update({ cover_photo: nextPhoto.original_path });
        } else {
          await photo.album.update({ cover_photo: null });
        }
      }

      await photo.destroy();

      // Log activity
      await AlbumActivity.create({
        album_id: photo.album_id,
        user_id: userId,
        action: 'photo_removed',
        details: { photo_id: photoId }
      });

      logger.info(`Photo deleted: ${photoId} by user: ${userId}`);

      return {
        success: true,
        message: 'Photo deleted successfully'
      };
    } catch (error) {
      logger.error('Delete photo error:', error);
      throw error;
    }
  }

  async getPhotoById(photoId, userId) {
    try {
      const photo = await Photo.findByPk(photoId, {
        include: [{
          model: Album,
          as: 'album'
        }]
      });
      if (!photo) {
        throw new Error('Photo not found');
      }
      // Permission: owner or album owner
      if (photo.user_id !== userId && photo.album.user_id !== userId && photo.is_private) {
        throw new Error('You do not have permission to view this photo');
      }
      return {
        success: true,
        data: photo,
        message: 'Photo retrieved successfully'
      };
    } catch (error) {
      logger.error('Get photo by id error:', error);
      throw error;
    }
  }

  async getAlbumPhotos(albumId, userId, options = {}) {
    try {
      const album = await Album.findByPk(albumId);
      if (!album) {
        throw new Error('Album not found');
      }
      // Permission: owner or shared (for now, only owner can see private photos)
      let whereClause = { album_id: albumId };
      if (album.user_id !== userId) {
        whereClause.is_private = false;
      }
      const {
        page = 1,
        limit = 20,
        sortBy = 'order_index',
        sortOrder = 'ASC'
      } = options;
      const offset = (page - 1) * limit;
      const photos = await Photo.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      return {
        success: true,
        data: {
          photos: photos.rows,
          total: photos.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(photos.count / limit)
        },
        message: 'Photos retrieved successfully'
      };
    } catch (error) {
      logger.error('Get album photos error:', error);
      throw error;
    }
  }

  async getUserPhotos(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;
      const offset = (page - 1) * limit;
      let whereClause = { user_id: userId };
      if (search) {
        whereClause[Op.or] = [
          { caption: { [Op.like]: `%${search}%` } },
          { tags: { [Op.like]: `%${search}%` } }
        ];
      }
      const photos = await Photo.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      return {
        success: true,
        data: {
          photos: photos.rows,
          total: photos.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(photos.count / limit)
        },
        message: 'User photos retrieved successfully'
      };
    } catch (error) {
      logger.error('Get user photos error:', error);
      throw error;
    }
  }
}

module.exports = new PhotoService();