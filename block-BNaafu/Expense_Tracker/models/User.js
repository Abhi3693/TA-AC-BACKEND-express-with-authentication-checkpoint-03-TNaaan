let mongoose = require("mongoose");
let bcrypt = require("bcrypt");

let Schema = mongoose.Schema;

let userSchema = new Schema ({
  name:{type:String, required:true},
  email:{type:String, required:true, unique:true},
  age:{type:Number},
  phone:{type:Number},
  country:{type:String},
  password:{type:String, required:true, minlength:3},
  image:{type:String},
  incomes:[{type:Schema.Types.ObjectId, ref:"Income"}],
  expenses:[{type:Schema.Types.ObjectId, ref:"Expense"}],
});


userSchema.pre("save", function (next) {
  if(this.password && this.isModified("password")) {
    bcrypt.hash(this.password, 10 , (err, hashed)=>{
      if(err) return next(err);
      this.password = hashed;
      return next();
    });
  } else {
    return next();
  }
});

userSchema.methods.verifypassword = function (password, cb) {
  bcrypt.compare(password, this.password, (err, result)=> {
    return cb(err, result);
  });
}

let User = mongoose.model("User", userSchema);

module.exports = User;