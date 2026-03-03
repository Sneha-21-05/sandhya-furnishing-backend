const mongoose = require("mongoose");

/* ================= MESSAGE SCHEMA ================= */
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "admin"],
    required: true,
  },

  text: {
    type: String,
    required: true,
  },

  seen: {
    type: Boolean,
    default: false,
  },

  seenAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/* ================= INQUIRY SCHEMA ================= */
const inquirySchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  type: {
    type: String,
    enum: ["custom_size", "general", "refurbishment"],
    required: true,
  },

  customSize: {
    type: String,
    default: "",
  },

  /* --- REFURBISHMENT FIELDS --- */
  refurbishServices: [
    {
      type: String,
      enum: ["New Cushions", "New Fabric", "Frame Repair", "Foam Replacement", "Other"],
    }
  ],

  frameDimensions: {
    type: String,
    default: "",
  },

  fabricPreference: {
    type: String,
    default: "",
  },

  refurbishImages: [
    {
      type: String,
    }
  ],

  additionalNotes: {
    type: String,
    default: "",
  },
  /* ----------------------------- */

  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  contact: {
    type: String,
    required: true,
  },

  messages: [messageSchema],

  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },

  seenByUser: {
    type: Boolean,
    default: true,
  },

  seenByAdmin: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Inquiry", inquirySchema);
