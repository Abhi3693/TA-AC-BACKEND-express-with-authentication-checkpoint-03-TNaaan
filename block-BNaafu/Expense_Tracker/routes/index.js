var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../modules/passport');

/* GET home page. */
router.get('/', (req, res, next) => {
  console.log(req.session);
  res.render('index');
});

//  Google Authentication
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

// Google Authentication Call back
router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/users/statementList',
    failureRedirect: '/',
  })
);

//  Github Authentication
router.get(
  '/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// Github Authentication Call back
router.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function (req, res) {
    res.redirect('/users/statementList');
  }
);

module.exports = router;
