let User = require("../models/User");

module.exports = {
  isUserLogged : (req,res,next)=>{
    if(req.session.passport && req.session.passport.user) {
      next();
    } else if(req.session && req.session.userId ) {
      next();
    } else {
      req.flash("error", "Needs login first");
      res.redirect("/users/login");
    }
  },
  userInfo : (req,res,next)=>{
    if(req.session.passport) {
      var userId = req.session.passport.user
    } else {
      var userId = req.session && req.session.userId ;
    }
    if(userId) {
      User.findById(userId, (err, user)=>{
        if(err) return next(err);
        req.user = user;
        res.locals.user = user;
        next();
      })
    } else {
      req.user = null;
      res.locals.user = null;
      next();
    }
  }
}