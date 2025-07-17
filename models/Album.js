const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Album = sequelize.define('Album', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('tags');
      return value ? value.split(',').map(tag => tag.trim()) : [];
    },
    set(val) {
      if (Array.isArray(val)) {
        this.setDataValue('tags', val.join(','));
      } else if (typeof val === 'string') {
        this.setDataValue('tags', val);
      }
    }
  },
  cover_photo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('personal', 'shareable'),
    defaultValue: 'personal'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  privacy_settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      allow_comments: true,
      allow_downloads: true,
      password_protected: false
    }
  },
  total_photos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_size: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'albums',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = Album;