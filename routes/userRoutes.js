const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  sendSignupOTP,
  verifySignupOTP,
  loginUser,
  updateProfile,
  getAllUsersAdmin,
  getMe,
  sendEmailOTP,
  verifyEmailOTP,
  forgotPasswordOTP,
  resetPassword
} = require("../controllers/userController");

// User routes
router.post("/send-signup-otp", sendSignupOTP);
router.post("/verify-signup-otp", verifySignupOTP);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPasswordOTP);
router.post("/reset-password", resetPassword);
router.get("/me", auth, getMe);

// PROFILE
router.put("/update-profile", auth, upload.single("profileImage"), updateProfile);

// EMAIL VERIFICATION ⭐
router.post("/verify-email/send", auth, sendEmailOTP);
router.post("/verify-email/confirm", auth, verifyEmailOTP);

// ADMIN
router.get("/all", getAllUsersAdmin);

module.exports = router;