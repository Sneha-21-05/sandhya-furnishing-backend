const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Absolute path to uploads folder
const uploadPath = path.join(__dirname, "uploads");

// ✅ Auto-create uploads folder if missing
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = upload;
