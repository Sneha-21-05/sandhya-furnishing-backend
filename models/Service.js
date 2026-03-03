const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    service_name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // creates createdAt & updatedAt
  }
);

module.exports = mongoose.model("Service", serviceSchema);
