const User = require('./User');
const Album = require('./Album');
const Photo = require('./Photo');
const AlbumShare = require('./AlbumShare');
const AlbumActivity = require('./AlbumActivity');

// User-Album associations
User.hasMany(Album, { foreignKey: 'user_id', as: 'albums' });
Album.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// Album-Photo associations
Album.hasMany(Photo, { foreignKey: 'album_id', as: 'photos' });
Photo.belongsTo(Album, { foreignKey: 'album_id', as: 'album' });

// User-Photo associations
User.hasMany(Photo, { foreignKey: 'user_id', as: 'photos' });
Photo.belongsTo(User, { foreignKey: 'user_id', as: 'uploader' });

// Album sharing associations
Album.hasMany(AlbumShare, { foreignKey: 'album_id', as: 'shares' });
AlbumShare.belongsTo(Album, { foreignKey: 'album_id', as: 'album' });

User.hasMany(AlbumShare, { foreignKey: 'shared_by', as: 'shared_albums' });
User.hasMany(AlbumShare, { foreignKey: 'shared_with', as: 'received_shares' });

AlbumShare.belongsTo(User, { foreignKey: 'shared_by', as: 'sharer' });
AlbumShare.belongsTo(User, { foreignKey: 'shared_with', as: 'recipient' });

// Album activity associations
Album.hasMany(AlbumActivity, { foreignKey: 'album_id', as: 'activities' });
AlbumActivity.belongsTo(Album, { foreignKey: 'album_id', as: 'album' });

User.hasMany(AlbumActivity, { foreignKey: 'user_id', as: 'activities' });
AlbumActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Album,
  Photo,
  AlbumShare,
  AlbumActivity
};