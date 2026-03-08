const axios = require("axios");

exports.sendEmail = async ({ email, subject, message }) => {
  try {
    const response = await axios.post("https://sandhya-furnishing-frontend.vercel.app/api/send-email", {
      email,
      subject,
      message,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Unknown error from Vercel email relay");
    }

    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    throw new Error(`Failed to relay email via Vercel: ${errorMsg}`);
  }
};