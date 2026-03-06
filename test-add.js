const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testAddCategoryWithImage() {
    try {
        const form = new FormData();
        form.append('name', 'Test Category Image ' + Date.now());
        form.append('image', fs.createReadStream('dummy.jpg'));

        const res = await axios.post('http://localhost:5000/api/categories/add', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Category ADD SUCCESS:', res.data);
    } catch (err) {
        console.error('Category ADD ERROR:', err.response?.data || err.message);
    }
}

testAddCategoryWithImage();
