const mongoose = require("mongoose");

const TrackingSchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String, default: "" },
  date: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        id: String,
        name: String,
        price: Number,
        qty: Number,
        image: String,
        isCustomSize: { type: Boolean, default: false },
        customDimensions: {
          width: String,
          height: String,
          note: String,
        },
      },
    ],

    fullName: String,
    phone: String,
    address: String,
    pincode: String,

    shippingMethod: String, // home / pickup
    paymentMethod: String,  // COD

    // Online Payment Details (Razorpay)
    paymentId: { type: String, default: null },          // payment_id
    razorpayOrderId: { type: String, default: null },    // order_id
    razorpaySignature: { type: String, default: null },  // payment_signature
    subtotal: Number,
    deliveryFee: Number,
    platformFee: Number,
    grandTotal: Number,

    // CURRENT STATUS (ADMIN UPDATES)
    currentStatus: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",
        "Pending Quote",
        "Pending Payment",
        "Confirmed",
        "Processing",
        "Packed",
        "Out for Delivery",
        "Delivered",
        "Cancelled"
      ]

    },

    trackingHistory: [TrackingSchema],

    // 🔥 NEW FIELDS FOR CANCELLATION
    cancelReason: {
      type: String,
      default: ""
    },

    cancelledBy: {
      type: String,
      enum: ["admin", ""],
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
