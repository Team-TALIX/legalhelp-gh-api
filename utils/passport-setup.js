import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import User from '../models/User.js'; // Path to models is correct from utils directory
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_OAUTH_CALLBACK_URL,
} from './config.js'; // Import from config.js in the same utils directory

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy.Strategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      // Ensure the callbackURL in your Google Cloud Console is BASE_URL + GOOGLE_OAUTH_CALLBACK_URL_PATH
      // For example, http://localhost:5000/api/auth/google/callback
      // The GOOGLE_OAUTH_CALLBACK_URL from config.js should be the full URL.
      callbackURL: GOOGLE_OAUTH_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        } else {
          const newUser = new User({
            googleId: profile.id,
            email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
            isAnonymous: false,
            preferredLanguage: 'en',
            role: 'user',
            profile: {
              region: '',
              occupation: '',
              legalInterests: [],
            },
            googleProfile: {
              name: profile.displayName,
              email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
              picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            },
            usage: {
              totalQueries: 0,
              monthlyQueries: 0,
              monthlyVoiceMinutes: 0,
              lastResetDate: new Date(),
              favoriteTopics: [],
              bookmarkedContent: [],
              lastActive: new Date(),
            },
            subscription: {
              plan: 'free',
              isActive: true,
            },
            permissions: {
                canAccessAnalytics: false,
                canManageContent: false,
                canModerateStories: false,
                canManageUsers: false,
            }
          });

          if (newUser.email) {
            const existingEmailUser = await User.findOne({
              email: newUser.email,
              googleId: { $ne: profile.id } // Ensure it's not the same user if they somehow re-trigger this
            });
            if (existingEmailUser) {
              return done(new Error('This email is already registered. Please log in with your existing account or link your Google account.'), false);
            }
          } else {
            // This case should be rare with Google OAuth2 as email is a standard scope
            console.warn(`Google profile for ID ${profile.id} (${profile.displayName}) did not provide an email. This might cause issues.`);
            // Consider if an email is strictly mandatory in your system. If so, return an error.
            // return done(new Error('Google account did not provide an email address.'), false);
          }

          await newUser.save();
          return done(null, newUser);
        }
      } catch (err) {
        // Check for unique constraint violation on email if a user tries to sign up with Google
        // using an email that's already taken by a non-Google local account.
        if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return done(new Error('This email is already registered. Please log in with your existing account.'), false);
        }
        return done(err, false);
      }
    }
  )
);

export default passport;
