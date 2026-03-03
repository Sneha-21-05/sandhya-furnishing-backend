const User = require("../models/User"); 
const { sendEmail } = require("../utils/sendEmail"); // correct utility

exports.sendEmailOTP = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOTP = otp;
    user.emailOTPExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send OTP email
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