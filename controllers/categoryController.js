const Category = require("../models/Category");
const slugify = require("slugify");

/* ================= ADD CATEGORY ================= */
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({
      name,
      slug,
    });

    await category.save();

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Add Category Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL CATEGORIES ================= */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET CATEGORY BY ID ================= */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE CATEGORY ================= */
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true, strict: true });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE CATEGORY ================= */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
