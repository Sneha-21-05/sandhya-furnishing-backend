const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// -------------------------------
// DATABASE CONNECTION
// -------------------------------
const connectMongo = require("./config/db_mongo");

// -------------------------------
// ROUTES
// -------------------------------
const inquiryRoutes = require("./routes/inquiryRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const typeRoutes = require("./routes/typeRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const consultationRoutes = require("./routes/consultationRoutes");

// -------------------------------
// APP INIT
// -------------------------------
const app = express();

/*  
=======================================================
   FIXED CORS (STRONGEST + CLEANEST VERSION)
   - Automatically allows ANY Vite dev server port
   - Fixes login CORS
   - Fixes dashboard API failures
   - Fixes "server lost connection" issues
=======================================================
*/
app.use(
  cors({
    origin: true,        // allows 5173, 5174, 5175 automatically
    credentials: true,
  })
);

// -------------------------------
// MIDDLEWARE
// -------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// SERVE UPLOADED IMAGES
// -------------------------------
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));
console.log("📂 Serving uploads from:", uploadsPath);

// -------------------------------
// API ROUTES
// -------------------------------
app.use("/api/inquiry", inquiryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/types", typeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/public", express.static(path.join(__dirname, "public")));

// -------------------------------
// GLOBAL ERROR HANDLER
// -------------------------------
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR CAUGHT:");
  if (err.message) {
    console.error("Message:", err.message);
  }
  if (err.stack) {
    console.error("Stack:", err.stack);
  } else {
    console.error(err);
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: err.toString()
  });
});

// -------------------------------
// DB CONNECT
// -------------------------------
connectMongo();

// -------------------------------
// START SERVER
// -------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
