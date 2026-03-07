require("dotenv").config({ path: "./.env" });

async function test() {
    const isSandbox = process.env.NODE_ENV !== "production";
    const apiUrl = isSandbox
        ? 'https://sandbox.cashfree.com/pg/orders'
        : 'https://api.cashfree.com/pg/orders';

    const options = {
        method: "POST",
        headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "x-api-version": "2023-08-01",
            "x-client-id": process.env.CASHFREE_APP_ID,
            "x-client-secret": process.env.CASHFREE_SECRET_KEY
        },
        body: JSON.stringify({
            order_amount: 1000,
            order_currency: "INR",
            order_id: "order_test_123",
            customer_details: {
                customer_id: "test1234",
                customer_phone: "9999999999",
                customer_name: "Test User"
            }
        })
    };

    const response = await fetch(apiUrl, options);
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Data:", data);
}
test();
