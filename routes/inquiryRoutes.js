const router = require("express").Router();
const c = require("../controllers/inquiryController");
const upload = require("../middleware/upload");

router.post("/add", c.createOrAppendInquiry);
router.post("/refurbish", upload.array("images", 3), c.createRefurbishmentInquiry);
router.put("/user/message/:id", c.addUserMessage);
router.put("/admin/message/:id", c.addAdminMessage);
router.put("/mark-seen/:id", c.markSeen);

router.get("/user/:email", c.getUserInquiries);
router.get("/", c.getAllInquiries);

router.get("/unread-count/:email", c.getUnreadCountForUser);

module.exports = router;
