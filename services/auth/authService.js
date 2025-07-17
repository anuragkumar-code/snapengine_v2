const User = require('../../models/User');
const { generateToken } = require('../../middleware/auth');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

class AuthService {
  async registerUser(userData) {
    try {
      const { first_name, last_name, email, mobile, password } = userData;
      
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            email ? { email } : null,
            mobile ? { mobile } : null
          ].filter(Boolean)
        }
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new Error('User with this email already exists');
        }
        if (existingUser.mobile === mobile) {
          throw new Error('User with this mobile number already exists');
        }
      }

      // Create new user
      const user = await User.create({
        first_name,
        last_name,
        email,
        mobile,
        password,
        provider: 'local'
      });

      // Generate token
      const token = generateToken(user.id);

      // Update last login
      await user.update({ last_login: new Date() });

      logger.info(`New user registered: ${user.id}`);

      return {
        success: true,
        data: {
          user: user.toJSON(),
          token
        },
        message: 'User registered successfully'
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async loginUser(identifier, password) {
    try {
      // Find user by email or mobile
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { email: identifier },
            { mobile: identifier }
          ],
          is_active: true
        }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = generateToken(user.id);

      // Update last login
      await user.update({ last_login: new Date() });

      logger.info(`User logged in: ${user.id}`);

      return {
        success: true,
        data: {
          user: user.toJSON(),
          token
        },
        message: 'Login successful'
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: user.toJSON(),
        message: 'Profile retrieved successfully'
      };
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if email/mobile is being updated and not already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: updateData.email, id: { [Op.ne]: userId } }
        });
        if (existingUser) {
          throw new Error('Email already in use');
        }
      }

      if (updateData.mobile && updateData.mobile !== user.mobile) {
        const existingUser = await User.findOne({
          where: { mobile: updateData.mobile, id: { [Op.ne]: userId } }
        });
        if (existingUser) {
          throw new Error('Mobile number already in use');
        }
      }

      await user.update(updateData);

      logger.info(`User profile updated: ${userId}`);

      return {
        success: true,
        data: user.toJSON(),
        message: 'Profile updated successfully'
      };
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async handleOAuthLogin(profile, provider) {
    try {
      let user = await User.findOne({
        where: { [`${provider}_id`]: profile.id }
      });

      if (!user && profile.emails && profile.emails.length > 0) {
        user = await User.findOne({
          where: { email: profile.emails[0].value }
        });

        if (user) {
          // Link OAuth account to existing user
          await user.update({ [`${provider}_id`]: profile.id });
        }
      }

      if (!user) {
        // Create new user
        user = await User.create({
          [`${provider}_id`]: profile.id,
          first_name: profile.name.givenName || profile.displayName.split(' ')[0],
          last_name: profile.name.familyName || profile.displayName.split(' ')[1] || '',
          email: profile.emails ? profile.emails[0].value : null,
          is_verified: true,
          provider: provider
        });
      }

      // Generate token
      const token = generateToken(user.id);

      // Update last login
      await user.update({ last_login: new Date() });

      logger.info(`OAuth login successful: ${user.id} via ${provider}`);

      return {
        success: true,
        data: {
          user: user.toJSON(),
          token
        },
        message: `${provider} login successful`
      };
    } catch (error) {
      logger.error(`OAuth ${provider} login error:`, error);
      throw error;
    }
  }
}

module.exports = new AuthService();