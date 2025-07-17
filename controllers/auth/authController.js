const authService = require('../services/auth/authService');
const logger = require('../config/logger');

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.registerUser(req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Registration controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      const result = await authService.loginUser(identifier, password);
      res.json(result);
    } catch (error) {
      logger.error('Login controller error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const result = await authService.getUserProfile(req.user.id);
      res.json(result);
    } catch (error) {
      logger.error('Get profile controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve profile'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const result = await authService.updateUserProfile(req.user.id, req.body);
      res.json(result);
    } catch (error) {
      logger.error('Update profile controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }

  async googleCallback(req, res) {
    try {
      const result = await authService.handleOAuthLogin(req.user, 'google');
      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${result.data.token}`);
    } catch (error) {
      logger.error('Google callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/auth/error`);
    }
  }

  async facebookCallback(req, res) {
    try {
      const result = await authService.handleOAuthLogin(req.user, 'facebook');
      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${result.data.token}`);
    } catch (error) {
      logger.error('Facebook callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/auth/error`);
    }
  }

  async logout(req, res) {
    try {
      // In a more advanced implementation, you might want to blacklist the token
      logger.info(`User logged out: ${req.user.id}`);
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
      res.status(400).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
}

module.exports = new AuthController();