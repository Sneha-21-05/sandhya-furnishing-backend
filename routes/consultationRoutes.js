const express = require("express");
const router = express.Router();
const {
    createConsultation,
    getUserConsultations,
    getConsultations,
    updateConsultationStatus,
} = require("../controllers/consultationController");
const authMiddleware = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth"); // Added admin role middleware

// Protected route to create a consultation (only for authenticated users)
router.post("/", authMiddleware, createConsultation);

// Route for specific user to fetch their consultations
router.get("/user", authMiddleware, getUserConsultations);

// Admin only routes
// Securing standard GET and PUT with adminAuth
router.get("/", adminAuth, getConsultations);
router.put("/:id", adminAuth, updateConsultationStatus);

module.exports = router;
