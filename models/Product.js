const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    rate_per_sqft: { type: Number },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductType",
      required: true,
    },

    price_unit: {
      type: String,
      enum: ["fixed", "per_sqft"],
      default: "fixed",
    },

    description: String,

    // 🖼 Sofa Images (Multiple)
    images: [String],

    // 📐 Dimension Images (Multiple)
    dimensionImages: [String],

    // 🪑 Sofa specific fields
    extraFields: {
      type: Object,
      default: {},
    },

    isLatest: {
      type: Boolean,
      default: false,
    },

    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
