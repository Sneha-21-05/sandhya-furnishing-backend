const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");

/* CATEGORY ROUTES */
router.post("/add", upload.single("image"), productController.addCategory);
router.get("/all", productController.getCategories);
router.get("/:id", productController.getCategoryById);
router.put("/update/:id", upload.single("image"), productController.updateCategory);
router.delete("/delete/:id", productController.deleteCategory);

module.exports = router;
