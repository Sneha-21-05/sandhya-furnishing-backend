const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Name split (but still compatible with existing fullname logic)
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },

    // Keep fullname for backward compatibility
    fullname: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    address: {
      street: String,
      city: String,
      pincode: String,
    },

    password: {
      type: String,
      required: true,
    },

    profileImage: {
      type: String,
      default: "",
    },
    // 🚀 Email Verification Fields
    isEmailVerified: {
      type: Boolean,
      default: false
    },

    emailOTP: {
      type: String,
      default: null
    },

    emailOTPExpiry: {
      type: Date,
      default: null
    },

    emailVerifiedAt: {
      type: Date,
      default: null
    },

    // Role
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },



    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);