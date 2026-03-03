const Inquiry = require("../models/Inquiry");

/* ================= USER CREATE / CONTINUE INQUIRY ================= */
exports.createOrAppendInquiry = async (req, res) => {
  try {
    const {
      product_id,
      name,
      email,
      contact,
      message,
      type,
      customSize,
    } = req.body;

    if (!product_id || !name || !email || !contact || !message || !type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    let inquiry = await Inquiry.findOne({ product_id, email, type });

    if (!inquiry) {
      inquiry = await Inquiry.create({
        product_id,
        type,
        name,
        email,
        contact,
        customSize: type === "custom_size" ? customSize : "",
        messages: [{ sender: "user", text: message }],
        seenByAdmin: false,
        seenByUser: true,
      });
    } else {
      inquiry.messages.push({ sender: "user", text: message });
      inquiry.seenByAdmin = false;
      inquiry.seenByUser = true;
      inquiry.status = "pending";

      if (type === "custom_size") {
        inquiry.customSize = customSize;
      }

      await inquiry.save();
    }

    const populatedInquiry = await Inquiry.findById(inquiry._id)
      .populate("product_id");

    res.json({ success: true, inquiry: populatedInquiry });

  } catch (error) {
    console.error("CREATE INQUIRY ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= USER REFURBISHMENT INQUIRY ================= */
exports.createRefurbishmentInquiry = async (req, res) => {
  try {
    const {
      product_id,
      name,
      email,
      contact,
      refurbishServices, // Expected to be JSON array or string
      frameDimensions,
      fabricPreference,
      additionalNotes
    } = req.body;

    if (!product_id || !name || !email || !contact) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    let services = [];
    try {
      services = typeof refurbishServices === 'string' ? JSON.parse(refurbishServices) : (refurbishServices || []);
    } catch {
      services = typeof refurbishServices === 'string' ? [refurbishServices] : [];
    }

    // Process uploaded images
    const imagePaths = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    // Format the first message string
    const messageText = `Requested Refurbishment for existing frame.\nServices: ${services.join(', ')}\nDimensions: ${frameDimensions}\nFabric: ${fabricPreference}\nNotes: ${additionalNotes}`;

    const inquiry = await Inquiry.create({
      product_id,
      type: "refurbishment",
      name,
      email,
      contact,
      refurbishServices: services,
      frameDimensions: frameDimensions || "",
      fabricPreference: fabricPreference || "",
      refurbishImages: imagePaths,
      additionalNotes: additionalNotes || "",
      messages: [{ sender: "user", text: messageText }],
      seenByAdmin: false,
      seenByUser: true,
    });

    res.json({ success: true, inquiry });

  } catch (error) {
    console.error("CREATE REFURBISH INQUIRY ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= USER FOLLOW-UP ================= */
exports.addUserMessage = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).populate("product_id");

    if (!inquiry) {
      return res.status(404).json({ success: false, error: "Inquiry not found" });
    }

    inquiry.messages.push({ sender: "user", text: req.body.message });
    inquiry.seenByAdmin = false;
    inquiry.seenByUser = true;
    inquiry.status = "pending";

    await inquiry.save();

    res.json({ success: true, inquiry });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= ADMIN REPLY ================= */
exports.addAdminMessage = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).populate("product_id");

    if (!inquiry) {
      return res.status(404).json({ success: false, error: "Inquiry not found" });
    }

    inquiry.messages.push({ sender: "admin", text: req.body.message });
    inquiry.seenByUser = false;
    inquiry.seenByAdmin = true;
    inquiry.status = "completed";

    await inquiry.save();

    res.json({ success: true, inquiry });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= MARK MESSAGES SEEN ================= */
exports.markSeen = async (req, res) => {
  try {
    const { role } = req.body;

    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, error: "Inquiry not found" });
    }

    inquiry.messages.forEach((m) => {
      if (m.sender !== role && !m.seen) {
        m.seen = true;
        m.seenAt = new Date();
      }
    });

    if (role === "user") inquiry.seenByUser = true;
    if (role === "admin") inquiry.seenByAdmin = true;

    await inquiry.save();

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= GET USER INQUIRIES ================= */
exports.getUserInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ email: req.params.email })
      .populate("product_id")
      .sort({ createdAt: -1 });

    res.json({ success: true, inquiries });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= ADMIN GET ALL ================= */
exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate("product_id")
      .sort({ createdAt: -1 });

    res.json({ success: true, inquiries });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ================= GET UNREAD COUNT FOR USER ================= */
exports.getUnreadCountForUser = async (req, res) => {
  try {
    const { email } = req.params;

    const count = await Inquiry.countDocuments({
      email,
      seenByUser: false,
    });

    res.json({ success: true, count });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
