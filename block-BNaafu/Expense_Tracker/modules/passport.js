let passport = require("passport");
let User = require("../models/User");
var GitHubStrategy = require('passport-github').Strategy;
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
let bcrypt = require("bcrypt");

// Github Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    let userInfo = {
      name:profile._json.name,
      email:profile._json.email,
      image:profile._json.avatar_url,
    }
    User.findOne({email:profile._json.email}, (err, user)=>{
      if(err) return done(err);
      if(user) {
        return done(null, user);
      } else {
        password = bcrypt.hashSync(process.env.PASSWORD, 10 , (err, hashed)=>{
          if(err) return next(err);
            return hashed;
        });
        userInfo.password = password;
        User.create(userInfo, (err, newUser)=>{
          if(err) return done(err);
          return done(null, newUser);
        });
      }
    });
  }
));


// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    let userInfo = {
      name:profile.displayName,
      email:profile.email,
      image:profile._json.picture,
    }

    User.findOne({email:profile.email}, (err, user)=>{
      if(err) return done(err);
      if(!user) {

        password = bcrypt.hashSync(process.env.PASSWORD, 10 , (err, hashed)=>{
          if(err) return next(err);
            return hashed;
        });
        userInfo.password = password;
        User.create(userInfo, (err, newUser)=>{
          if(err) return done(err);
          return done(null, newUser);
        });
      } else {
        return done(null, user);
      }
    });
  }
));

passport.serializeUser((user,done)=>{
  done(null, user.id);
});

passport.deserializeUser((id, done)=>{
  User.findById(id, (err, user)=>{
    done(err, user);
  });
});
// 