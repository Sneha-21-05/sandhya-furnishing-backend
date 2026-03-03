const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");
require("dotenv").config();
const connectMongo = require("./config/db_mongo");

// Default Admin Credentials
const adminUsername = "admin";
const adminPassword = "admin123";

async function createAdmin() {
  try {
    await connectMongo();

    const existingAdmin = await Admin.findOne({ username: adminUsername });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists. Skipping creation.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await Admin.create({
      username: adminUsername,
      password: hashedPassword,
    });

    console.log("✅ Default Admin Created Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
