const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const auth = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { notifyUserEmail } = require("../controllers/orderController");

/* ===================== CREATE ORDER ===================== */
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount, customerDetails = {} } = req.body; // cart total and user info

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      console.error("Cashfree keys are missing in environment variables.");
      return res.json({ success: false, message: "Server misconfiguration: Cashfree keys are missing." });
    }

    const orderId = "order_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex");

    // Force Sandbox Mode for testing
    const apiUrl = 'https://sandbox.cashfree.com/pg/orders';

    const options = {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY
      },
      body: JSON.stringify({
        order_amount: amount,
        order_currency: "INR",
        order_id: orderId,
        customer_details: {
          customer_id: req.user.userId.toString(),
          customer_phone: customerDetails.phone || "9999999999",
          customer_name: customerDetails.name || "Customer",
          customer_email: customerDetails.email || "support@sandhyafurnishing.com"
        }
      })
    };

    const response = await fetch(apiUrl, options);
    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree Create Error:", data);
      return res.json({ success: false, message: data.message || "Failed to create Cashfree order. Verify your keys." });
    }

    res.json({
      success: true,
      payment_session_id: data.payment_session_id,
      order_id: data.order_id
    });
  } catch (error) {
    console.log("Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ===================== VERIFY PAYMENT AND SAVE ORDER ===================== */
router.post("/verify-payment", auth, async (req, res) => {
  try {
    const { order_id, orderData } = req.body; // orderData comes from FE

    // Force Sandbox Mode for testing
    const apiUrl = `https://sandbox.cashfree.com/pg/orders/${order_id}/payments`;

    const options = {
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY
      }
    };

    const response = await fetch(apiUrl, options);
    const payments = await response.json();

    if (!response.ok) {
      console.error("Cashfree Verify Error:", payments);
      return res.status(500).json({ success: false, message: "Payment verification failed" });
    }

    // Cashfree returns an array of payments for the order
    const successfulPayment = payments.find(p => p.payment_status === "SUCCESS");

    if (!successfulPayment) {
      return res.json({ success: false, message: "Payment not successful or pending." });
    }

    // 🔥 Payment verified — Now create real order in DB
    const newOrder = new Order({
      ...orderData,
      userId: req.user.userId,
      paymentMethod: "online",
      paymentId: successfulPayment.cf_payment_id.toString(),
      razorpayOrderId: order_id,
      currentStatus: "Confirmed",
      trackingHistory: [
        {
          status: "Confirmed",
          message: "Online payment successful via Cashfree",
          date: new Date(),
        },
      ],
    });

    await newOrder.save();

    // Clear cart
    await Cart.deleteMany({ userId: req.user.userId });

    // Fire-and-forget email dispatch
    notifyUserEmail(
      req.user.userId,
      "Order Confirmed - Payment Successful",
      `Great news! We have successfully received your online payment.\n\nYour order (ID: ${newOrder._id}) is now Confirmed and will begin Processing shortly.\n\nThank you for shopping with Sandhya Furnishing!`
    );

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

/* ===================== VERIFY QUOTE PAYMENT ===================== */
router.post("/verify-quote-payment", auth, async (req, res) => {
  try {
    const { order_id, dbOrderId, paymentMethod } = req.body;

    const apiUrl = `https://sandbox.cashfree.com/pg/orders/${order_id}/payments`;
    const options = {
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY
      }
    };

    const response = await fetch(apiUrl, options);
    const payments = await response.json();

    if (!response.ok) {
      console.error("Cashfree Quote Verify Error:", payments);
      return res.status(500).json({ success: false, message: "Payment verification failed" });
    }

    const successfulPayment = payments.find(p => p.payment_status === "SUCCESS");
    if (!successfulPayment) {
      return res.json({ success: false, message: "Payment not successful or pending." });
    }

    // Payment verified — Now update the existing quote order in DB
    const order = await Order.findById(dbOrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found in database." });
    }

    if (order.currentStatus !== "Pending Payment") {
      return res.status(400).json({ success: false, message: "Order is not pending payment." });
    }

    order.paymentMethod = paymentMethod || "online";
    order.paymentId = successfulPayment.cf_payment_id.toString();
    order.razorpayOrderId = order_id; // Using field to store cashfree order id for backwards compat
    order.currentStatus = "Confirmed";
    order.trackingHistory.push({
      status: "Confirmed",
      message: `Quote payment of ₹${order.grandTotal.toLocaleString('en-IN')} successful via Cashfree.`,
      date: new Date()
    });

    await order.save();

    notifyUserEmail(
      order.userId,
      "Quote Payment Received - Order Confirmed",
      `We have received your payment of ₹${order.grandTotal.toLocaleString('en-IN')} for your custom order (ID: ${order._id}).\n\nYour order is now Confirmed and will be processed soon.`
    );

    return res.json({
      success: true,
      message: "Quote payment verified & order confirmed",
    });

  } catch (error) {
    console.log("Quote Verify Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;