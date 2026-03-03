const Cart = require("../models/Cart");

exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, isCustomSize, customDimensions } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, quantity, isCustomSize, customDimensions }],
      });
      await cart.save();
      return res.json({ success: true, message: "Added (new cart)" });
    }

    // Check if same product AND same custom size configuration exists
    const index = cart.items.findIndex((item) => {
      if (item.productId.toString() !== productId) return false;

      // If one is custom and the other isn't, they are different
      if (item.isCustomSize !== isCustomSize) return false;

      // If both are custom, check if dimensions match
      if (isCustomSize) {
        return (
          item.customDimensions?.width === customDimensions?.width &&
          item.customDimensions?.height === customDimensions?.height &&
          item.customDimensions?.note === customDimensions?.note
        );
      }
      return true; // Match standard item
    });

    if (index >= 0) {
      cart.items[index].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, isCustomSize, customDimensions });
    }

    await cart.save();

    res.json({ success: true, message: "Added to cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    res.json({
      success: true,
      cart: cart || { items: [] }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId, isCustomSize, customDimensions } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => {
      if (item.productId.toString() !== productId) return true; // Keep others

      // If we are deleting a specific custom size
      if (isCustomSize !== undefined && item.isCustomSize !== isCustomSize) return true;

      if (isCustomSize && customDimensions) {
        if (
          item.customDimensions?.width !== customDimensions.width ||
          item.customDimensions?.height !== customDimensions.height ||
          item.customDimensions?.note !== customDimensions.note
        ) {
          return true; // Keep other custom sizes of same product
        }
      }
      return false; // Remove this matched item
    });

    await cart.save();

    res.json({ success: true, message: "Item removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
