const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Service = require("../models/Service");

// ----------------------------------
// ADMIN LOGIN
// ----------------------------------
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("📥 BODY RECEIVED →", req.body);

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    console.log("🔍 PASSWORD MATCH →", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      { adminId: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
    });
  } catch (error) {
    console.log("❌ ADMIN LOGIN ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------
// ADMIN DASHBOARD STATS
// ----------------------------------
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();

    return res.json({
      success: true,
      message: "Admin dashboard stats fetched successfully",
      stats: {
        totalUsers,
        totalServices,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
