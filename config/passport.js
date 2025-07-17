const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const logger = require('./logger');

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await User.findByPk(payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    logger.error('JWT Strategy Error:', error);
    return done(error, false);
  }
}));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({
      where: { google_id: profile.id }
    });

    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({
      where: { email: profile.emails[0].value }
    });

    if (user) {
      // Link Google account to existing user
      user.google_id = profile.id;
      await user.save();
      return done(null, user);
    }

    // Create new user
    user = await User.create({
      google_id: profile.id,
      first_name: profile.name.givenName,
      last_name: profile.name.familyName,
      email: profile.emails[0].value,
      is_verified: true,
      provider: 'google'
    });

    return done(null, user);
  } catch (error) {
    logger.error('Google Strategy Error:', error);
    return done(error, null);
  }
}));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.SERVER_URL}/api/auth/facebook/callback`,
  profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({
      where: { facebook_id: profile.id }
    });

    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    if (profile.emails && profile.emails.length > 0) {
      user = await User.findOne({
        where: { email: profile.emails[0].value }
      });

      if (user) {
        // Link Facebook account to existing user
        user.facebook_id = profile.id;
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    user = await User.create({
      facebook_id: profile.id,
      first_name: profile.name.givenName,
      last_name: profile.name.familyName,
      email: profile.emails ? profile.emails[0].value : null,
      is_verified: true,
      provider: 'facebook'
    });

    return done(null, user);
  } catch (error) {
    logger.error('Facebook Strategy Error:', error);
    return done(error, null);
  }
}));

module.exports = passport;