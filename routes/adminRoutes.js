const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");

const { getAdminAnalytics } = require("../controllers/analyticsController");

// Admin Login
router.post("/login", adminController.loginAdmin);

// Protected Dashboard
router.get("/dashboard", adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Admin dashboard accessed successfully",
    admin: req.admin,
  });
});

// Dashboard Stats
router.get(
  "/dashboard-stats",
  adminAuth,
  adminController.getDashboardStats
);

router.get("/analytics", adminAuth, getAdminAnalytics);


module.exports = router;
