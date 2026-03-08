const mongoose = require('mongoose');
const { createQuoteOrder } = require('./controllers/orderController');

async function checkOrder() {
    try {
        const uri = "mongodb+srv://snehamguptaji212005_db_user:y45WRwd81vXEdaJG@cluster0.wygv9ti.mongodb.net/sandhya_furnishing_db?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(uri);

        // mock req res
        const req = {
            body: {
                userId: "6648797f14bba28ecbcf5dc9", // admin user obj id
                items: [{ productId: "661280058b8f3ee8b8686f7f", quantity: 1, price: 100 }],
                fullName: "Test User",
                phone: "9999999999",
                address: "Test St, Test, TS - 000000",
                subtotal: 100,
                platformFee: 7,
            }
        };

        const res = {
            status: function (code) { console.log("STATUS:", code); return this; },
            json: function (data) { console.log("JSON:", data); return this; }
        };

        await createQuoteOrder(req, res);

        process.exit(0);
    } catch (e) {
        console.error("DB Error:", e);
        process.exit(1);
    }
}

checkOrder();
