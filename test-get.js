const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('http://localhost:5000/api/categories/add:1');
        console.log(res.data);
    } catch (err) {
        console.error('Error:', err.response?.status, err.response?.data);
    }
}
test();
