import '../config/loadEnv.js'; // Load environment variables
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

// Debug: Check if environment variables are loaded
// console.log('Passport.js - Environment variables check:');
// console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Found' : 'Missing');
// console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Found' : 'Missing');
// console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID ? 'Found' : 'Missing');
// console.log('FACEBOOK_APP_SECRET:', process.env.FACEBOOK_APP_SECRET ? 'Found' : 'Missing');

// Only configure Google OAuth if environment variables are present
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://chefhub-backend1.onrender.com/api/auth/google/callback'
      : 'http://localhost:5000/api/auth/google/callback');

  // console.log('Setting up Google OAuth strategy');
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: googleCallbackURL,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      // This is the "verify" callback. It's called when Google successfully authenticates the user.
      try {
        // Find a user with this Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // If user exists, ensure they're marked as email verified (fix for existing users)
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          await user.save();
        }
        return done(null, user);
      } else {
        // If no user is found with that Google ID, check if one exists with the same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // If they exist by email, link their Google ID and save
          user.googleId = profile.id;
          user.isEmailVerified = true; // Mark as verified since Google verified the email
          await user.save();
          return done(null, user);
        }

        // If no user is found at all, create a new one
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          isEmailVerified: true, // Google has already verified this email
        });

        await newUser.save();
        return done(null, newUser);
      }
    } catch (err) {
      return done(err, null);
    }
  }
));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => done(null, await User.findById(id)));
} else {
  // console.log('Google OAuth not configured - missing environment variables');
  // console.log('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file to enable Google authentication');
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  // console.log('Setting up Facebook OAuth strategy');
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: 
        process.env.NODE_ENV === "production"
          ? "https://chefhub-backend1.onrender.com/api/auth/facebook/callback"
          : "http://localhost:5000/api/auth/facebook/callback",
      profileFields: ['id', 'displayName', 'emails', 'photos'],
      enableProof: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // console.log('Facebook profile received:', profile);
        
        // Find a user with this Facebook ID
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
          // If user exists, ensure they're marked as email verified (fix for existing users)
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          if (email && !email.includes('facebook.temp') && !user.isEmailVerified) {
            user.isEmailVerified = true;
            await user.save();
          }
          return done(null, user);
        } else {
          // Check if user exists with same email
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          if (email) {
            user = await User.findOne({ email: email });
            if (user) {
              // Link Facebook ID to existing user
              user.facebookId = profile.id;
              user.isEmailVerified = true; // Mark as verified since Facebook verified the email
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          const newUser = new User({
            facebookId: profile.id,
            name: profile.displayName,
            email: email || `${profile.id}@facebook.temp`, // Fallback email
            profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            isEmailVerified: email ? true : false, // Verify if email provided by Facebook
          });

          await newUser.save();
          return done(null, newUser);
        }
      } catch (err) {
        // console.error('Facebook strategy error:', err);
        return done(err, null);
      }
    }
  ));
} else {
  // console.log('Facebook OAuth not configured - missing environment variables');
  // console.log('Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to your .env file to enable Facebook authentication');
}

export default passport;