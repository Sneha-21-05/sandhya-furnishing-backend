const Service = require("../models/Service");

// ===============================
// ADD SERVICE (Admin)
// ===============================
exports.addService = async (req, res) => {
  try {
    const { service_name, price, description, image_url } = req.body;

    if (!service_name || !description) {
      return res.status(400).json({
        success: false,
        message: "Service name and description required",
      });
    }

    const service = new Service({
      service_name,
      price: price || 0,
      description,
      image_url: image_url || "",
    });

    await service.save();

    return res.json({
      success: true,
      message: "Service added successfully",
      id: service._id,
    });
  } catch (error) {
    console.log("Add Service Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ===============================
// GET ALL SERVICES (Users + Admin)
// ===============================
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      services,
    });
  } catch (error) {
    console.log("Get Services Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE SERVICE (Admin)
// ===============================
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { service_name, price, description, image_url } = req.body;

    await Service.findByIdAndUpdate(id, {
      service_name,
      price,
      description,
      image_url,
    });

    return res.json({
      success: true,
      message: "Service updated successfully",
    });
  } catch (error) {
    console.log("Update Service Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ===============================
// DELETE SERVICE (Admin)
// ===============================
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    await Service.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.log("Delete Service Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
