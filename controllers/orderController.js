const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.notifyUserEmail = async (userId, subject, message) => {
  try {
    console.log("---- NOTIFY USER EMAIL TRIGGERED ----", { userId });
    const user = await User.findById(userId);

    if (!user) {
      console.error("notifyUserEmail Failed: User not found in DB for ID:", userId);
      return;
    }

    if (!user.email) {
      console.warn("notifyUserEmail Aborted: User exists but lacks an email address:", userId);
      return;
    }

    console.log("notifyUserEmail: Attempting to send via Nodemailer to:", user.email, "Subject:", subject);
    await sendEmail({
      email: user.email,
      subject,
      message: `Hi ${user.name || 'Customer'},\n\n${message}\n\nThank you,\nSandhya Furnishing`
    });
    console.log(`notifyUserEmail: SUCCESS! Email sent to ${user.email}`);

  } catch (error) {
    console.error("Email Sending Error (Nodemailer Crash):", error);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const {
      userId,
      items,
      fullName,
      phone,
      address,
      pincode,
      subtotal,
      deliveryFee,
      platformFee,
      grandTotal,
      paymentMethod,
      shippingMethod,
      status = "Pending",
    } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const order = await Order.create({
      userId,
      items,
      fullName,
      phone,
      address,
      pincode,
      subtotal,
      deliveryFee,
      platformFee,
      grandTotal,
      paymentMethod,
      shippingMethod,
      currentStatus: status,
      trackingHistory: [
        {
          status,
          message:
            status === "Pending Quote"
              ? "Your custom order request has been received."
              : "Your order has been placed.",
          date: new Date(),
        },
      ],
    });

    await Cart.deleteMany({ userId });

    // Send email silently in the background
    exports.notifyUserEmail(
      userId,
      "Order Placed Successfully",
      `Your order (ID: ${order._id}) has been placed successfully. Thank you for shopping with us!\n\nTotal Amount: ₹${grandTotal}`
    );

    return res.json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.log("Order Error:", err);
    return res.status(500).json({ success: false, message: "Order failed" });
  }
};


// ==========================
// GET USER'S ORDERS
// ==========================
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID missing" });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log("Get My Orders Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};



// ==========================
// GET ORDER DETAILS (USER + ADMIN)
// ==========================
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("userId", "name email phone");

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Order details error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find({
      currentStatus: { $ne: "Delivered" }
    })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (error) {
    console.error("Get All Orders Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getDeliveredOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find({
      currentStatus: "Delivered"
    })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error("Get Delivered Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};


exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, message = "" } = req.body;

    const flow = [
      "Pending",
      "Pending Quote",
      "Pending Payment",
      "Confirmed",
      "Processing",
      "Packed",
      "Out for Delivery",
      "Delivered",
    ];

    const validStatuses = [
      ...flow,
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const currentIndex = flow.indexOf(order.currentStatus);
    const newIndex = flow.indexOf(status);

    console.log("---- STATUS UPDATE ATTEMPT ----", {
      orderId,
      passedStatus: status,
      currentDbStatus: order.currentStatus,
      newIndex,
      currentIndex
    });

    // 🚫 Cannot update after Delivered
    if (order.currentStatus === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be modified",
      });
    }

    // 🚫 Cannot go backwards
    if (
      status !== "Cancelled" &&
      newIndex !== currentIndex + 1
    ) {
      console.error("BLOCKING INVALID TRANSITION!", { currentDbStatus: order.currentStatus, status, currentIndex, newIndex });

      return res.status(400).json({
        success: false,
        message: `Invalid status transition. Cannot jump from ${order.currentStatus} to ${status}.`,
      });
    }

    // 🚫 Cannot cancel after Delivered
    if (
      status === "Cancelled" &&
      order.currentStatus === "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be cancelled",
      });
    }

    order.currentStatus = status;

    order.trackingHistory.push({
      status,
      message: message || `${status} update recorded.`,
      date: new Date(),
    });

    await order.save();

    // Send email silently in the background (fire-and-forget) to prevent SMTP lag from hanging the UI
    exports.notifyUserEmail(
      order.userId,
      `Order Status Update: ${status}`,
      `Your order (ID: ${order._id}) status has been updated to: ${status}.\n\nMessage: ${message || 'No additional message.'}`
    );

    return res.json({
      success: true,
      message: "Order status updated",
      order,
    });

  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================
// ADMIN UPDATE QUOTE
// ==========================
exports.updateOrderQuote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customUnitPrice, message = "" } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.currentStatus !== "Pending Quote" && !(order.currentStatus === "Pending" && order.paymentMethod === "quote_request")) {
      return res.status(400).json({
        success: false,
        message: "Only 'Pending Quote' orders can have their quote updated.",
      });
    }

    if (!customUnitPrice || customUnitPrice <= 0) {
      return res.status(400).json({ success: false, message: "Valid customUnitPrice is required" });
    }

    let regularTotal = 0;
    let customTotal = 0;

    order.items.forEach(i => {
      if (i.isCustomSize) {
        i.price = customUnitPrice;
        customTotal += (i.price * i.qty);
      } else {
        regularTotal += (i.price * i.qty);
      }
    });

    order.markModified('items');

    const newSubtotal = regularTotal + customTotal;
    order.subtotal = newSubtotal;

    const finalGrandTotal = newSubtotal + (order.deliveryFee || 0) + (order.platformFee || 0);
    order.grandTotal = finalGrandTotal;
    order.currentStatus = "Pending Payment";

    order.trackingHistory.push({
      status: "Pending Payment",
      message: message || `Quote finalized. Total to pay is ₹${finalGrandTotal.toLocaleString('en-IN')}. Please complete the payment.`,
      date: new Date(),
    });

    await order.save();

    // Send email silently in the background (fire-and-forget) to prevent SMTP lag from hanging the UI
    exports.notifyUserEmail(
      order.userId,
      "Quote Finalized - Payment Required",
      `Good news! Your custom quote for order (ID: ${order._id}) has been finalized.\n\nTotal to pay: ₹${finalGrandTotal.toLocaleString('en-IN')}.\nPlease log in to your account and complete the payment to confirm your order.`
    );

    return res.json({
      success: true,
      message: "Order quote updated successfully",
      order,
    });

  } catch (error) {
    console.error("Update Order Quote Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId).populate("userId");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // PDF headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order._id}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    /* HEADER SECTION */
    const headerHeight = 100;
    doc.rect(0, 0, doc.page.width, headerHeight).fill("#333333");

    // Golden top banner
    doc.fillColor("#f1a300");
    doc.moveTo(0, headerHeight)
      .lineTo(doc.page.width, headerHeight - 40)
      .lineTo(doc.page.width, headerHeight)
      .fill();

    // Logo
    const logoPath = path.join(__dirname, "../public/logo.png");
    try {
      doc.image(logoPath, 40, 25, { width: 70 });
    } catch (e) {
      console.log("⚠ Logo not found");
    }

    // Brand name
    doc.fillColor("white")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Sandhya Furnishing", 130, 35);

    doc.fillColor("#f1f1f1")
      .fontSize(10)
      .font("Helvetica")
      .text("Premium Furnishings & Home Décor", 130, 63);

    /* INVOICE TITLE */
    doc.moveDown(3);
    doc.fillColor("#000")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("INVOICE");

    doc.moveDown(1);

    /* CUSTOMER + ORDER INFO */
    doc.fontSize(12).font("Helvetica");

    doc.text(`Invoice#: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);

    doc.moveDown(1);
    doc.font("Helvetica-Bold").text(`Invoice To :`, { continued: false });
    doc.font("Helvetica").text(order.fullName);

    doc.text(`${order.address} - ${order.pincode}`);
    doc.text(`Email: ${order.userId?.email || "Not Provided"}`);
    doc.text(`Phone: ${order.phone || "Not Provided"}`);

    doc.moveDown(2);

    /* TABLE HEADING */
    doc.font("Helvetica-Bold").fontSize(14).text("Items");
    doc.moveDown(0.5);

    // Table column positions
    const startX = 40;
    const tableWidth = 500;

    const colSL = startX;
    const colDesc = startX + 40;
    const colPrice = startX + 280;
    const colQty = startX + 350;
    const colTotal = startX + 430;

    // Header background
    const tableTop = doc.y;
    doc.rect(startX, tableTop, tableWidth, 25).fill("#0077b6");

    doc.fillColor("#fff").fontSize(12);
    doc.text("SL.", colSL + 5, tableTop + 7);
    doc.text("Item Description", colDesc + 5, tableTop + 7);
    doc.text("Price", colPrice + 5, tableTop + 7);
    doc.text("Qty", colQty + 5, tableTop + 7);
    doc.text("Total", colTotal + 5, tableTop + 7);

    doc.fillColor("#000");

    let y = tableTop + 30;
    const rowHeight = 35;
    const descWidth = 220;

    /* ROWS */
    order.items.forEach((item, index) => {
      const total = (item.price * item.qty).toFixed(2);

      // Row border
      doc.rect(startX, y, tableWidth, rowHeight).stroke("#ccc");

      doc.fontSize(12);

      doc.text(index + 1, colSL + 5, y + 10);
      doc.text(item.name, colDesc + 5, y + 10, { width: descWidth });
      doc.text(`₹${item.price}`, colPrice + 5, y + 10);
      doc.text(item.qty, colQty + 5, y + 10);
      doc.text(`₹${total}`, colTotal + 5, y + 10);

      y += rowHeight;
    });

    doc.moveDown(3);

    /* PAYMENT INFO */
    doc.font("Helvetica-Bold").fontSize(13).text("Payment Info :");
    doc.font("Helvetica").fontSize(11);
    doc.text("Account #: Not Provided");
    doc.text("A/C Name: Sandhya Furnishing");
    doc.text("Bank: Not Provided");

    doc.moveDown(2);

    /* SUMMARY BLOCK */
    const sumX = 320;
    const sumY = doc.y + 10;

    doc.rect(sumX, sumY, 200, 80).stroke("#595959");

    doc.fontSize(12).font("Helvetica");
    doc.text(`Sub Total: ₹${order.subtotal}`, sumX + 10, sumY + 10);
    doc.text(`Delivery Fee: ₹${order.deliveryFee}`, sumX + 10, sumY + 30);

    doc.font("Helvetica-Bold").fontSize(14);
    doc.text(`Total: ₹${order.grandTotal}`, sumX + 10, sumY + 55);

    doc.moveDown(4);

    /* FOOTER */
    doc.fillColor("#000").fontSize(9).text(
      "Terms & Conditions: Lorem Ipsum is dummy printing text used as placeholder since 1500s.",
      { align: "left" }
    );

    doc.moveDown(3);

    doc.fillColor("#333")
      .fontSize(10)
      .text("Thank You For Your Business!", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("Invoice Error:", err);
    res.status(500).json({
      success: false,
      message: "Error generating invoice",
    });
  }
};

// ==========================
// ADMIN CANCEL ORDER
// ==========================
exports.cancelOrderAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (["Delivered", "Cancelled"].includes(order.currentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this order"
      });
    }

    // SET CANCEL STATUS
    order.currentStatus = "Cancelled";
    order.cancelReason = reason || "";   // optional reason
    order.cancelledBy = "admin";

    // Add to tracking history
    order.trackingHistory.push({
      status: "Cancelled",
      message: reason || "Order cancelled by admin",
      date: new Date()
    });

    await order.save();

    await notifyUserEmail(
      order.userId,
      "Order Cancelled",
      `We regret to inform you that your order (ID: ${order._id}) has been cancelled by our administration.\n\nReason: ${reason || "No reason provided."}\nIf you have already paid, a refund will be initiated shortly.`
    );

    return res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });

  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ================= PAY QUOTE (USER) =================
exports.payQuoteUser = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.currentStatus !== "Pending Payment") {
      return res.status(400).json({ success: false, message: "Order is not pending payment." });
    }

    if (!paymentMethod || paymentMethod === "quote_request") {
      return res.status(400).json({ success: false, message: "Please select a valid payment method." });
    }

    order.paymentMethod = paymentMethod;
    order.currentStatus = "Confirmed";
    order.trackingHistory.push({
      status: "Confirmed",
      message: `Payment of ₹${order.grandTotal.toLocaleString('en-IN')} received via ${paymentMethod}. Order Confirmed!`,
      date: new Date()
    });

    await order.save();

    await notifyUserEmail(
      order.userId,
      "Payment Received - Order Confirmed",
      `We have received your payment of ₹${order.grandTotal.toLocaleString('en-IN')} via ${paymentMethod} for your custom order (ID: ${order._id}).\n\nYour order is now Confirmed and will be processed soon.`
    );

    return res.json({
      success: true,
      message: "Payment successful! Order Confirmed."
    });

  } catch (error) {
    console.error("Pay Quote Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET ORDER STATUS COUNT (FOR ADMIN DASHBOARD GRAPH)
exports.getOrderStatusCount = async (req, res) => {
  try {

    const counts = await Order.aggregate([
      {
        $group: {
          _id: "$currentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const formatted = {
      Pending: 0,
      Confirmed: 0,
      Processing: 0,
      Packed: 0,
      "Out for Delivery": 0,
      Delivered: 0,
      Cancelled: 0,
    };

    counts.forEach((item) => {
      formatted[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching order status count:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order status count",
    });
  }
};

// GET ADMIN ANALYTICS
exports.getAdminAnalytics = async (req, res) => {
  try {
    // TOTAL USERS
    const User = require("../models/User");
    const totalUsers = await User.countDocuments();

    // TOTAL ORDERS
    const totalOrders = await Order.countDocuments();

    // 🔥 TOTAL REVENUE (ONLY DELIVERED ORDERS)
    const revenueResult = await Order.aggregate([
      {
        $match: { currentStatus: "Delivered" }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" }
        }
      }
    ]);

    // TOTAL CONSULTATIONS
    const Consultation = require("../models/Consultation");
    const totalConsultations = await Consultation.countDocuments();

    const totalRevenue = revenueResult.length > 0
      ? revenueResult[0].totalRevenue
      : 0;

    // 🔥 MONTHLY REVENUE (ONLY DELIVERED)
    const revenueData = await Order.aggregate([
      {
        $match: { currentStatus: "Delivered" }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$grandTotal" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 🔥 RECENT ORDERS (Last 5)
    const recentOrders = await Order.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalRevenue,
        revenueData,
        totalConsultations,
        recentOrders
      }
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics"
    });
  }
};

exports.createQuoteOrder = async (req, res) => {
  try {
    const {
      userId,
      items,
      fullName,
      phone,
      address,
      subtotal,
      platformFee,
    } = req.body;

    const order = await Order.create({
      userId,
      items,
      fullName,
      phone,
      address,
      paymentMethod: "quote_request",
      subtotal,
      platformFee,
      grandTotal: 0,
      currentStatus: "Pending Quote",
      trackingHistory: [
        {
          status: "Pending Quote",
          message: "Custom size quote request submitted",
          date: new Date(),
        },
      ],
    });

    await Cart.deleteMany({ userId });

    // Fire-and-forget email dispatch
    exports.notifyUserEmail(
      userId,
      "Quote Request Received",
      `We have received your custom size quote request for order (ID: ${order._id}).\n\nOur team will review your requirements and provide a finalized price shortly. You will be notified once the quote is ready.`
    );

    return res.json({
      success: true,
      message: "Quote request submitted",
      order,
    });
  } catch (error) {
    console.error("Error creating quote order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.createCODOrder = async (req, res) => {
  try {
    const {
      userId,
      items,
      fullName,
      phone,
      address,
      subtotal,
      platformFee,
      grandTotal,
    } = req.body;

    const order = await Order.create({
      userId,
      items,
      fullName,
      phone,
      address,
      paymentMethod: "cod",
      subtotal,
      platformFee,
      grandTotal,
      currentStatus: "Confirmed",
      trackingHistory: [
        {
          status: "Confirmed",
          message: "COD order placed successfully",
          date: new Date(),
        },
      ],
    });

    await Cart.deleteMany({ userId });

    await notifyUserEmail(
      userId,
      "Order Placed Successfully (COD)",
      `Your Cash on Delivery (COD) order (ID: ${order._id}) has been placed successfully. Thank you for shopping with us!\n\nTotal Amount: ₹${grandTotal}`
    );

    return res.json({
      success: true,
      message: "COD order created",
      order,
    });
  } catch (err) {
    console.log("COD Error:", err);
    return res.status(500).json({ success: false, message: "COD failed" });
  }
};


