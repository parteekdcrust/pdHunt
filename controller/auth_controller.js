const { response } = require("express");
const User = require("../model/user");
const Otp = require("../model/otp");
const authService = require("../service/auth_service");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();
const otpGenerator = require("otp-generator");

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = new User({ name, email, password });
    const _id = await authService.signup(name, email, password);
    //generating otp
    const OTP = otpGenerator.generate(6, {
      number: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log(OTP);

    // connect with the smtp
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: `"Message from PDHunt"<process.env.AUTH_EMAIL>`, // sender address
      to: email, // list of receivers
      subject: "OTP Verifictaion", // Subject line
      text: `This is your otp: ${OTP} for verification`, // plain text body
      html: `<b>This is your otp: ${OTP} for verification.The OTP will expires in 5 mins </b>`, // html body
    });

    const otp = new Otp({ email: email, otp: OTP });//making new record in otp collection
    const salt = await bcrypt.genSalt(10);
    otp.otp = await bcrypt.hash(otp.otp, salt);
    await otp.save();
    console.log("OTP sent successfully");

    res.status(201).json({
      id: _id,
      message: "OTP sent Successfully on your registered email. Please Verify",
    });
  } catch (error) {
    console.log("error in user post ", error);
    res.status(400).send({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password: inputPassword } = req.body;

    const token = await authService.login(email, inputPassword);

    res.status(200).send({ token: token });
  } catch (error) {
    console.log("error in user post ", error);
    res.status(400).send({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    let loggedInUser = req.loggedInUser;

    await authService.logout(loggedInUser._id);
    res.status(200).send({ message: "Logged out successfully" });
  } catch (error) {
    console.log("error in user post ", error);
    res.status(400).send({ message: error.message });
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      throw new Error({ message: "Access Denied. Please send Token" });

    const token = authHeader.split(" ")[1];
    if (!token)
      throw new Error({ message: "Access Denied. Please send Token" });
    console.log("token " + token);

    const user = await authService.verifyToken(token);
    req.loggedInUser = user;
    next();
  } catch (error) {
    console.log("error in user post ", error);
    res.status(400).send({ message: error.message });
  }
};

exports.verifyOtpByEmail = async(req, res) => {
  try {
      const { email, otp } = req.body;
      const otpHolder = await Otp.findOne({ email });
      if (!otpHolder) {
          return res.status(400).json({message:"OTP not found"});
      }

      const isOtpValid = await bcrypt.compare(otp, otpHolder.otp);
      if (!isOtpValid) {
          return res.status(400).json({message:"Invalid OTP"});
      }

      await User.updateOne({ email: email }, { verified: true });
      await Otp.deleteOne({ email:email });

      return res
          .status(200)
          .json({message :"OTP verified successfully. Your account is now verified."});
  } catch (error) {
      console.log("Error in verifying OTP ", error);
      res.status(400).send({ message: error.message });
  }
};

