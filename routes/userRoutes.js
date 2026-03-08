const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  registerUser,
  loginUser,
  updateProfile,
  getAllUsersAdmin,
  getMe,
  sendEmailOTP,
  verifyEmailOTP
} = require("../controllers/userController");

// AUTH
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", auth, getMe);

// PROFILE
router.put("/update-profile", auth, upload.single("profileImage"), updateProfile);

// EMAIL VERIFICATION ⭐
router.post("/verify-email/send", auth, sendEmailOTP);
router.post("/verify-email/confirm", auth, verifyEmailOTP);

// ADMIN
router.get("/all", getAllUsersAdmin);

module.exports = router;