const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    maxlength: 200,
  },

  password: {
    type: String,
    trim: true,
    required: true,
    select: false,
    maxlength: 100,
    minlength: 6,
  },
  email: {
    type: String,
    trim: true,
    maxlength: 200,
    required: true,
    unique: true,
  },
  mobile:{
    type:String,
    required:true,
    // maxlength:10,
    // minlength:10,
    // unique:true
  },
  token: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  emailVerified:{
    type:Boolean,
    default:false
  },
  mobileVerified:{
    type:Boolean,
    default:false
  }
});

userSchema.pre("save", async function (next) {
  try {
    console.log("Pre Save Hook");

    const encryptedPassword = await hashPassword(this.password);
    this.password = encryptedPassword;
    next();
  } catch (error) {
    console.log("Error while saving user", error);
    next(error);
  }
});

const hashPassword = async (password) => {
  console.log("In hash password", password);
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

module.exports = mongoose.model("User", userSchema);
