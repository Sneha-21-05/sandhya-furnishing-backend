const mongoose = require('mongoose');

async function checkOrder() {
    try {
        const uri = "mongodb+srv://snehamguptaji212005_db_user:y45WRwd81vXEdaJG@cluster0.wygv9ti.mongodb.net/sandhya_furnishing_db?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(uri);

        // We need to use the Order schema briefly
        const orderSchema = new mongoose.Schema({
            currentStatus: String,
            trackingHistory: Array
        }, { strict: false });
        const Order = mongoose.model('Order', orderSchema);

        const order = await Order.findById("69ac7dc4224ea6188c5d211d");
        if (order) {
            console.log("Current Status in DB:", order.currentStatus);
            console.log("Tracking History:", order.trackingHistory);
        } else {
            console.log("Order not found in DB.");
        }

        process.exit(0);
    } catch (e) {
        console.error("DB Error:", e);
        process.exit(1);
    }
}

checkOrder();
