const sequelize = require('../config/database');
const logger = require('../config/logger');

const checkDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    return false;
  }
};

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database synchronized successfully');
    return true;
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    return false;
  }
};

module.exports = {
  checkDatabaseConnection,
  syncDatabase
};