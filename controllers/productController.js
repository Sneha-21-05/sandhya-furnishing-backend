const Category = require("../models/Category");
const ProductType = require("../models/ProductType");
const Product = require("../models/Product");
const slugify = require("slugify");
/* ================= CATEGORY ================= */
/* ================= CATEGORY CONTROLLERS ================= */

exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : "";

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // ✅ generate slug safely
    const slug = slugify(name, {
      lower: true,
      strict: true,
    });

    // ✅ prevent duplicates
    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name,
      slug,
      image_url,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (err) {
    console.error("Add Category Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
exports.updateCategory = async (req, res) => {
  try {
    const update = { name: req.body.name };
    if (req.file) {
      update.image_url = `/uploads/${req.file.filename}`;
    }

    await Category.findByIdAndUpdate(req.params.id, update);

    res.json({ success: true, message: "Category updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


/* ================= TYPE ================= */

exports.addType = async (req, res) => {
  const { category_id, type_name } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : "";

  if (!category_id || !type_name) {
    return res.status(400).json({ success: false });
  }

  const type = await ProductType.create({
    category_id,
    type_name,
    image_url,
  });

  res.json({ success: true, type });
};

exports.getTypesByCategory = async (req, res) => {
  const types = await ProductType.find({
    category_id: req.params.categoryId,
  });
  res.json({ success: true, types });
};

exports.updateType = async (req, res) => {
  const update = { type_name: req.body.type_name };
  if (req.file) update.image_url = `/uploads/${req.file.filename}`;

  await ProductType.findByIdAndUpdate(req.params.id, update);
  res.json({ success: true });
};

exports.deleteType = async (req, res) => {
  await ProductType.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.getTypeById = async (req, res) => {
  try {
    const type = await ProductType.findById(req.params.id);
    res.json({ success: true, type });
  } catch {
    res.status(500).json({ success: false });
  }
};

/* ================= PRODUCT ================= */

/* ================= ADD PRODUCT ================= */
exports.addProduct = async (req, res) => {
  try {
    const {
      product_name,
      price,
      price_unit,
      description,
      specifications,
      colors,
      category_id,
      type_id,
      extraFields,
      isLatest,
    } = req.body;

    const images = req.files?.images
      ? req.files.images.map((f) => f.path)
      : [];

    const dimensionImages = req.files?.dimensionImages
      ? req.files.dimensionImages.map((f) => f.path)
      : [];
    const product = await Product.create({
      name: product_name,
      price,
      price_unit,
      description,
      specifications,
      colors: colors ? colors.split(",").map(c => c.trim()) : [],
      images,
      dimensionImages, // ✅ MULTIPLE
      category: category_id,
      type: type_id,
      extraFields: extraFields ? JSON.parse(extraFields) : {},
      isLatest: isLatest === "true",
    });

    res.status(201).json({ success: true, product });

  } catch (err) {
    console.error("Add Product Error Stack Trace:", err.stack || err);
    res.status(500).json({ success: false, message: "Add product failed", error: err.message });
  }
};


/* ================= GET ALL PRODUCTS ================= */
exports.getAllProducts = async (req, res) => {
  const products = await Product.find()
    .populate("category", "name")
    .populate("type", "type_name");

  res.json({ products });
};

/* ================= GET PRODUCT BY ID ================= */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("type");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================= GET BY TYPE ================= */
exports.getProductsByType = async (req, res) => {
  const products = await Product.find({ type: req.params.typeId })
    .populate("category", "name")
    .populate("type", "type_name");

  res.json({ products });
};

/* ================= ✅ FIXED CATEGORY FILTER ================= */
exports.getProductsByCategory = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();

    const products = await Product.find()
      .populate("category", "name")
      .populate("type", "type_name");

    const filtered = products.filter(p => {
      const categoryName = p.category?.name?.toLowerCase().trim();
      return categoryName === slug;
    });

    res.json({ products: filtered });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/* ================= SEARCH PRODUCTS ================= */
exports.searchProducts = async (req, res) => {
  try {
    const q = req.query.q?.toLowerCase().trim();

    if (!q) {
      return res.json({ success: true, products: [] });
    }

    const products = await Product.find()
      .populate("category", "name")
      .populate("type", "type_name");

    const filtered = products.filter((p) => {
      return (
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q) ||
        p.type?.type_name?.toLowerCase().includes(q)
      );
    });

    res.json({ success: true, products: filtered });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ success: false, products: [] });
  }
};

/* ================= DELETE ================= */
exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};


/* ================= UPDATE ================= */
exports.updateProduct = async (req, res) => {
  try {
    console.log("UPDATE BODY:", JSON.stringify(req.body, null, 2));
    console.log("UPDATE FILES:", JSON.stringify(req.files, null, 2));
    const {
      name,
      price,
      description,
      specifications,
      colors,
      price_unit,
      category,
      type,
      isLatest,
      extraFields,
    } = req.body;

    const updateData = {
      name,
      price: Number(price),
      description,
      specifications,
      price_unit,
      category,
      type,
      colors: colors ? colors.split(",").map((c) => c.trim()) : [],
    };

    if (isLatest !== undefined) {
      updateData.isLatest = isLatest === "true";
    }

    if (extraFields) {
      try {
        updateData.extraFields =
          typeof extraFields === "string"
            ? JSON.parse(extraFields)
            : extraFields;
      } catch (err) {
        console.error("extraFields parse error:", err);
      }
    }

    /* ================================
       PRODUCT IMAGES (Cloudinary)
    ================================= */

    if (req.files?.images) {
      updateData.images = req.files.images.map((file) => file.path);
    }

    /* ================================
       DIMENSION IMAGES (Cloudinary)
    ================================= */

    if (req.files?.dimensionImages) {
      updateData.dimensionImages = req.files.dimensionImages.map(
        (file) => file.path
      );
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });

  } catch (err) {

  console.error("UPDATE PRODUCT ERROR:");
  console.error(JSON.stringify(err, null, 2));
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message
  });

}
};