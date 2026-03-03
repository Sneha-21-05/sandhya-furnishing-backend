const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const auth = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

/* ===================== CREATE ORDER ===================== */
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount } = req.body; // cart total

    const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.log("Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ===================== VERIFY PAYMENT AND SAVE ORDER ===================== */
router.post("/verify-payment", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData
    } = req.body; // orderData comes from FE

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.json({ success: false, message: "Payment verification failed" });
    }

    // 🔥 Payment verified — Now create real order in DB
    const newOrder = new Order({
      ...orderData,
      userId: req.user.userId,
      paymentMethod: "online",
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      currentStatus: "Confirmed",
      trackingHistory: [
        {
          status: "Confirmed",
          message: "Online payment successful",
          date: new Date(),
        },
      ],
    });

    await newOrder.save();

    // Clear cart
    await Cart.deleteMany({ userId: req.user.userId });

    return res.json({
      success: true,
      message: "Payment verified & order created",
      orderId: newOrder._id
    });

  } catch (error) {
    console.log("Verify Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});