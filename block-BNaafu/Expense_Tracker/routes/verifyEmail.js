var express = require('express');
var router = express.Router();
let EmailVarify = require("../models/EmailVarify");
let nodemailer = require("nodemailer");


// Common functions

function date () {
  return new Date();
}

function generateOTP () {
  let otp = "";
  for (let i = 0; i < 4; i++) {
    otp += Math.floor(Math.random() * 9)
  }
  return otp;
}

// Create Transporter Of NodeMailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.PASSWORD
  }
});


// Email Verify form
router.get("/", (req,res,next)=>{
  res.render("verifyEmail", {error: req.flash("error")});
});

//  Email sent to verify 
router.post("/", (req,res,next)=>{
  let otp = generateOTP();
  req.body.otp = String(otp);
  req.body.endDate = Number(date()) + 60000;
  req.body.startDate = date();
  EmailVarify.create(req.body, (err, content)=>{
    if(err) return next(err);
    
    var mailOptions = {
      from: process.env.EMAIL,
      to: `${req.body.email}`,
      subject: "OTP for registration",
      html: 
      "<h3>OTP for account verification is </h3>" +
      "<h1 style='font-weight:bold;'>" + otp + "</h1>",
    }
    
    transporter.sendMail(mailOptions, (err, info)=>{
      if(err) {
        console.log(err);
      } else {
        res.redirect("/verifyEmail/" + content._id + "/verifyOtp");
      }
    });
  });
});

// OTP verify form
router.get("/:id/verifyOtp", (req,res,next)=>{
  EmailVarify.findById(req.params.id, (err, content)=>{
    if(err) return next(err);
    res.render("verifyOtp", {error: req.flash("error"),content, id:content._id});
  });
});

// OTP enter and send to register 
router.post("/:id/verifyOtp", (req,res,next)=>{
  let otp = req.body.otp;
  EmailVarify.findById(req.params.id, (err, content)=>{
    if(err) return next(err);
    if(content.endDate > Number(date())) {
      content.verifyOtp(otp, (err, result)=>{
        if(err) return next(err);
        if(!result) {
          req.flash("error", "Incorrect OTP");
          return res.redirect("/verifyEmail/" + content._id + "/verifyOtp")
        } else {
          return res.redirect("/users/new/" + content._id);
        }
      });
    } else {
      req.flash("error", "Your OTP has expired, Try Again!");
      return res.redirect("/verifyEmail")
    }
  });
});

// Forgot email form
router.get("/forgot", (req,res,next)=>{
  res.render("forgot");
});

//  Fetch data and send otp to verify email
router.post("/forgot", (req,res,next)=>{
  let otp = generateOTP();
  req.body.otp = String(otp);
  req.body.startDate = date();
  req.body.endDate = date() + 60000;
  EmailVarify.create(req.body, (err, content)=>{
    if(err) return next(err);

    var mailOptions = {
      from: process.env.EMAIL,
      to: `${req.body.email}`,
      subject: "OTP for Verify",
      html: 
      "<h3>OTP for account verification is </h3>" +
      "<h1 style='font-weight:bold;'>" + otp + "</h1>",
    }
    
    transporter.sendMail(mailOptions, (err, info)=>{
      if(err) {
        console.log(err);
      } else {
        console.log(content);
        res.redirect("/verifyEmail/" + content._id + "/verifyOtp/forgot");
      }
    });
  })
});

// Render forgot password OTP form
router.get ("/:id/verifyOtp/forgot", (req,res,next)=>{
  EmailVarify.findById(req.params.id, (err, content)=>{
    if(err) return next(err);
    res.render("forPassOtp", {error: req.flash("error"),data:content, id:content._id});
  });
});

// fetch otp and render to set new password
router.post("/:id/verifyOtp/forgot", (req,res,next)=>{
  let otp = req.body.otp;
  EmailVarify.findById(req.params.id, (err, content)=>{
    if(err) return next(err);
    if(content.endDate > Number(date())) {
      content.verifyOtp(otp, (err, result)=>{
        if(err) return next(err);
        if(!result) {
          req.flash("error", "OTP is incorrect");
          return res.redirect(`/verifyEmail/${content._id}/verifyOtp/forgot`);
        } else {
          console.log(content);
          res.redirect("/users/newPassword");
        }
      });
    } else {
      req.flash("error", "OTP Expired");
      req.redirect("/users/login")
    }
    
  });
});

module.exports = router;

