const Consultation = require("../models/Consultation");

// @desc    Create a new consultation request
// @route   POST /api/consultations
// @access  Private (Authenticated users only)
const createConsultation = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            serviceType,
            preferredDate,
            message
        } = req.body;

        // 🔥 Trim values to avoid blank spaces
        const trimmedName = name?.trim();
        const trimmedEmail = email?.trim();
        const trimmedPhone = phone?.trim();
        const trimmedServiceType = serviceType?.trim();
        const trimmedPreferredDate = preferredDate?.trim();
        const trimmedMessage = message?.trim();

        // ✅ Required field validation (message now required)
        if (
            !trimmedName ||
            !trimmedEmail ||
            !trimmedPhone ||
            !trimmedServiceType ||
            !trimmedPreferredDate ||
            !trimmedMessage
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields including additional details are required."
            });
        }

        // ✅ Ensure user is attached via authMiddleware
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login again."
            });
        }

        const consultation = await Consultation.create({
            userId: req.user.userId,
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            serviceType: trimmedServiceType,
            preferredDate: trimmedPreferredDate,
            message: trimmedMessage,
        });

        res.status(201).json({
            success: true,
            message: "Consultation booked successfully. We will contact you soon!",
            consultation,
        });

    } catch (error) {
        console.error("Error creating consultation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to book consultation."
        });
    }
};


// @desc    Get user specific consultations
// @route   GET /api/consultations/user
// @access  Private (Authenticated users only)
const getUserConsultations = async (req, res) => {
    try {
        const consultations = await Consultation.find({ userId: req.user.userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            consultations
        });

    } catch (error) {
        console.error("Error getting user consultations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch consultations."
        });
    }
};

// @desc    Get all consultations
// @route   GET /api/consultations
// @access  Private (Admin only)
const getConsultations = async (req, res) => {
    try {
        const consultations = await Consultation.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            consultations
        });

    } catch (error) {
        console.error("Error getting consultations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch consultations."
        });
    }
};


// @desc    Update consultation status
// @route   PUT /api/consultations/:id
// @access  Private (Admin only)
const updateConsultationStatus = async (req, res) => {
    try {
        console.log("UPDATE CONSULTATION STATUS HIT", req.params.id, req.body);
        const { status } = req.body;

        const allowedStatuses = ["pending", "contacted", "completed"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status received: ${status}`
            });
        }

        const consultation = await Consultation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: "Consultation not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Status updated successfully.",
            consultation
        });

    } catch (error) {
        console.error("Error updating consultation status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update status."
        });
    }
};

module.exports = {
    createConsultation,
    getUserConsultations,
    getConsultations,
    updateConsultationStatus,
};