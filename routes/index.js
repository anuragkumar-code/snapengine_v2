const express = require('express');
const authRoutes = require('./authRoutes');
const albumRoutes = require('./albumRoutes');
const photoRoutes = require('./photoRoutes');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/album', albumRoutes);
router.use('/photo', photoRoutes);

module.exports = router;