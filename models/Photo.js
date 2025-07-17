const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Photo = sequelize.define('Photo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true
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
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_cover: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
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
  }
}, {
  tableName: 'photos',
  indexes: [
    {
      fields: ['album_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['is_private']
    },
    {
      fields: ['order_index']
    }
  ]
});

module.exports = Photo;