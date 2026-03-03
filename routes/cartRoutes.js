const express = require("express");
const { addToCart, getCart, removeFromCart } = require("../controllers/cartController");

const router = express.Router();

router.post("/add", addToCart);
router.post("/remove", removeFromCart);
router.get("/:userId", getCart);

module.exports = router;
