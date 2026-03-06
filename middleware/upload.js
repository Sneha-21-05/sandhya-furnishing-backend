const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sandhya-furnishing",
    format: async (req, file) => {
      // Allow specific formats or default to 'png'
      const allowedFormats = ["jpg", "jpeg", "png", "webp", "avif"];
      const ext = file.mimetype.split("/")[1];
      return allowedFormats.includes(ext) ? ext : "png";
    },
  },
});

const upload = multer({ storage });

module.exports = upload;