let mongoose = require("mongoose");
let bcrypt = require("bcrypt");
let Schema = mongoose.Schema;


let verifySchema = new Schema ({
  email:{type:String, required:true},
  otp:{type:String, required:true},
  startDate:{type:Date},
  endDate:{type:Number},
}); 


verifySchema.pre("save", function (next) {
  if(this.otp && this.isModified("otp")) {
    bcrypt.hash(this.otp, 10 , (err, hashed)=>{
      if(err) return next(err);
      this.otp = hashed;
      return next();
    });
  } else {
    return next();
  }
});

verifySchema.methods.verifyOtp = function (otp, cb) {
  bcrypt.compare(otp, this.otp, (err, result)=> {
    return cb(err, result);
  });
}

let VerifyEmail = mongoose.model("VerifyEmail", verifySchema);

module.exports = VerifyEmail;