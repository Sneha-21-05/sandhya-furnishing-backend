const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");

/* TYPE ROUTES */

// ADD TYPE
router.post("/add", upload.single("image"), productController.addType);

// ⭐ GET SINGLE TYPE (must come BEFORE the category route)
router.get("/single/:id", productController.getTypeById);

// ⭐ GET TYPES BY CATEGORY (must be exactly this route)
router.get("/category/:categoryId", productController.getTypesByCategory);

// UPDATE TYPE
router.put("/update/:id", upload.single("image"), productController.updateType);

// DELETE TYPE
router.delete("/delete/:id", productController.deleteType);

module.exports = router;
