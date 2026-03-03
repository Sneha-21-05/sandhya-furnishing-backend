const Order = require("../models/Order");
const User = require("../models/User");
const Service = require("../models/Service");

exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalOrders = await Order.countDocuments();

    const revenueData = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const statusData = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Get recent orders (only id + createdAt for notification system)
    const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .select("_id createdAt");

    res.json({
        success: true,
        stats: {
            totalUsers,
            totalServices,
            totalOrders,
            totalRevenue: totalRevenue[0]?.revenue || 0,
            revenueData,
            statusData,
            recentOrders
        }
        });



  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
