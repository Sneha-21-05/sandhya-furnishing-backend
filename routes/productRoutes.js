const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");
const Product = require("../models/Product");
const categoryFields = require("../config/categoryFields");

/* ======================================================
   ADD PRODUCT
   ====================================================== */
router.post(
  "/add",
  upload.fields([
    { name: "images", maxCount: 15 },
    { name: "dimensionImages", maxCount: 10 }
  ]),
  productController.addProduct
);

/* ======================================================
   GET PRODUCTS BY TYPE
   ====================================================== */
router.get("/type/:typeId", productController.getProductsByType);

/* ======================================================
   GET PRODUCTS BY CATEGORY (slug)
   ====================================================== */
router.get("/category/:slug", productController.getProductsByCategory);

/* ======================================================
   GET ALL PRODUCTS
   ====================================================== */
router.get("/", productController.getAllProducts);

/* ======================================================
   ⭐ SEARCH PRODUCTS (NEW — MUST BE BEFORE :id)
   ====================================================== */
router.get("/search", productController.searchProducts);

/* ======================================================
   UPDATE PRODUCT
   ====================================================== */
router.put(
  "/update/:id",
  upload.fields([
    { name: "images", maxCount: 15 },
    { name: "dimensionImages", maxCount: 10 }
  ]),
  productController.updateProduct
);

/* ======================================================
   DELETE PRODUCT
   ====================================================== */
router.delete("/delete/:id", productController.deleteProduct);

/* ======================================================
   GET LATEST PRODUCTS
   ====================================================== */
router.get("/latest", async (req, res) => {
  try {
    const products = await Product.find({ isLatest: true })
      .populate("category")
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load latest products"
    });
  }
});

/* ======================================================
   ⭐ GET DYNAMIC FIELDS (MUST BE BEFORE :id)
   ====================================================== */
router.get("/fields/:category", (req, res) => {
  const categoryName = req.params.category;

  if (!categoryFields[categoryName]) {
    return res.status(404).json({
      success: false,
      message: `No dynamic fields defined for category: ${categoryName}`,
    });
  }

  return res.json({
    success: true,
    fields: categoryFields[categoryName],
  });
});

/* ======================================================
   GET PRODUCT BY ID (ALWAYS LAST)
   ====================================================== */
router.get("/:id", productController.getProductById);

module.exports = router;