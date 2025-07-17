const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlbumActivity = sequelize.define('AlbumActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  album_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'albums',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('created', 'updated', 'photo_added', 'photo_removed', 'shared', 'unshared', 'joined', 'left'),
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'album_activities',
  indexes: [
    {
      fields: ['album_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = AlbumActivity;