const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlbumShare = sequelize.define('AlbumShare', {
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
  shared_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  shared_with: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    defaultValue: 'pending'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      can_view: true,
      can_add: false,
      can_edit: false,
      can_delete: false,
      can_comment: true,
      can_download: true
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'album_shares',
  indexes: [
    {
      fields: ['album_id']
    },
    {
      fields: ['shared_by']
    },
    {
      fields: ['shared_with']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = AlbumShare;