const express = require("express");
const router = express.Router();

const {
  addService,
  getServices,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const adminAuth = require("../middleware/adminAuth");

// Admin Only Routes
router.post("/add", adminAuth, addService);
router.get("/all", getServices);
router.put("/update/:id", adminAuth, updateService);
router.delete("/delete/:id", adminAuth, deleteService);

module.exports = router;
