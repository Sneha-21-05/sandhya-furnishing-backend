const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =========================
// SEND SIGNUP OTP
// =========================
exports.sendSignupOTP = async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;

    if (!fullname || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let existingUser = await User.findOne({ email });

    // If active user exists, prevent signup
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ message: "Email already registered and verified." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    let user;
    if (existingUser && !existingUser.isEmailVerified) {
      // Overwrite unverified ghost account
      existingUser.fullname = fullname;
      existingUser.phone = phone;
      existingUser.password = hashedPassword;
      existingUser.emailOTP = otp;
      existingUser.emailOTPExpiry = otpExpiry;
      user = await existingUser.save();
    } else {
      // Create new unverified account
      user = new User({
        fullname,
        email,
        phone,
        password: hashedPassword,
        isEmailVerified: false,
        emailOTP: otp,
        emailOTPExpiry: otpExpiry,
      });
      await user.save();
    }

    const { sendEmail } = require("../utils/sendEmail");
    await sendEmail({
      email: user.email,
      subject: "Verify Your Email - Sandhya Furnishing",
      message: `Your account verification OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email.",
      tempUserId: user._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP to your email.",
      error: error.message,
    });
  }
};

// =========================
// VERIFY SIGNUP OTP
// =========================
exports.verifySignupOTP = async (req, res) => {
  try {
    const { tempUserId, otp } = req.body;

    if (!tempUserId || !otp) {
      return res.status(400).json({ success: false, message: "User ID and OTP required" });
    }

    const user = await User.findById(tempUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User session expired. Try signing up again." });
    }

    if (!user.emailOTP || !user.emailOTPExpiry) {
      return res.status(400).json({ success: false, message: "OTP not generated or already verified." });
    }

    if (user.emailOTPExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
    }

    // Mark as verified
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailOTP = null;
    user.emailOTPExpiry = null;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Account verified successfully! You can now log in.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// =========================
// USER LOGIN
// =========================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,   // ⭐ IMPORTANT
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ===============================
// SEND EMAIL VERIFICATION OTP
// ===============================
exports.sendEmailOTP = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOTP = otp;
    user.emailOTPExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // FIX IS HERE ⬇⬇⬇
    const { sendEmail } = require("../utils/sendEmail");

    await sendEmail({
      email: user.email,
      subject: "Email Verification OTP",
      message: `Your OTP is: ${otp}`,
    });

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
};

// ===============================
// VERIFY EMAIL OTP
// ===============================
exports.verifyEmailOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.emailOTP || !user.emailOTPExpiry) {
      return res.status(400).json({ success: false, message: "OTP not generated" });
    }

    // Check expiry
    if (user.emailOTPExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Check match
    if (user.emailOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark verified
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();

    // Clear OTP
    user.emailOTP = null;
    user.emailOTPExpiry = null;

    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


// ===============================
// UPDATE USER PROFILE (WITH IMAGE) - FIXED
// ===============================
exports.updateProfile = async (req, res) => {
  try {
    const {
      id,
      firstName,
      lastName,
      phone,
      age,
      gender,
      address,
      password,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ✅ SAFE address handling
    let parsedAddress = {};
    if (address) {
      if (typeof address === "string") {
        try {
          parsedAddress = JSON.parse(address);
        } catch {
          parsedAddress = {};
        }
      } else {
        parsedAddress = address;
      }
    }

    const updateData = {
      firstName,
      lastName,
      phone,
      age,
      gender,
      address: parsedAddress,
    };

    // ✅ SAFE image handling
    if (req.file && req.file.filename) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    // ✅ Update password only if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      user,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ===============================
// FORGOT PASSWORD OTP
// ===============================
exports.forgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOTP = otp;
    user.emailOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const { sendEmail } = require("../utils/sendEmail");
    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP - Sandhya Furnishing",
      message: `Your password reset OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.`,
    });

    return res.json({
      success: true,
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ===============================
// RESET PASSWORD
// ===============================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.emailOTP || !user.emailOTPExpiry) {
      return res.status(400).json({ success: false, message: "OTP not requested or already used" });
    }

    if (user.emailOTPExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.emailOTP = null;
    user.emailOTPExpiry = null;
    await user.save();

    return res.json({
      success: true,
      message: "Password has been reset successfully. You can now login.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
