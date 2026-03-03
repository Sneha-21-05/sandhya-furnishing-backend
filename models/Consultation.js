const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    serviceType: {
        type: String,
        required: true,
    },
    preferredDate: {
        type: String,
        required: true,
    },
    message: {
        type: String,
    },
    status: {
        type: String,
        enum: ["pending", "contacted", "completed"],
        default: "pending",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Consultation", consultationSchema);
