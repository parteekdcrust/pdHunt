const express = require("express");
const router = express.Router();
const { signup, login, logout, verifyToken, verifyOtpByEmail } = require("../controller/auth_controller");

router.route("/signup").post(signup);
router.route("/email-otp-verification").post(verifyOtpByEmail);
router.route("/login").post(login);
router.route("/logout").post(verifyToken, logout);
module.exports = router;
