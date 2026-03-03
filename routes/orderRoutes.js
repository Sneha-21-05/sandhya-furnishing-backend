const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");

const {
  createOrder,
  getMyOrders,
  getOrderDetails,
  getAllOrdersAdmin,
  updateOrderStatus,
  downloadInvoice,
  cancelOrderAdmin,
  getDeliveredOrdersAdmin,
  getOrderStatusCount,
  getAdminAnalytics,
  updateOrderQuote,
  payQuoteUser,
  createCODOrder,
  createQuoteOrder,
} = require("../controllers/orderController");

// ================= USER ROUTES =================
router.post("/create", createOrder);
router.post("/create-cod", createCODOrder);
router.post("/create-quote", createQuoteOrder);

router.get("/my-orders", getMyOrders);
router.get("/details/:orderId", getOrderDetails);
router.get("/invoice/:orderId", downloadInvoice);
router.post("/user/pay-quote/:orderId", payQuoteUser);

// ================= ADMIN ROUTES =================
router.get("/admin/all", adminAuth, getAllOrdersAdmin);
router.patch("/admin/update-status/:orderId", adminAuth, updateOrderStatus);
router.patch("/admin/update-quote/:orderId", adminAuth, updateOrderQuote);
router.post("/admin/cancel/:orderId", adminAuth, cancelOrderAdmin);
router.get("/admin/delivered", adminAuth, getDeliveredOrdersAdmin);
router.get("/admin/status-count", adminAuth, getOrderStatusCount);
router.get("/admin/analytics", adminAuth, getAdminAnalytics);

module.exports = router;