const mongoose = require('mongoose');
const Category = require('./models/Category');
const ProductType = require('./models/ProductType');
const Product = require('./models/Product');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        try {
            const cat = await Category.findOne({});
            const type = await ProductType.findOne({});

            const product = await Product.create({
                name: 'Test Product ' + Date.now(),
                price: 1000,
                price_unit: 'fixed',
                description: 'Test Description',
                specifications: 'test specs',
                colors: [],
                images: [],
                dimensionImages: [],
                category: cat ? cat._id : new mongoose.Types.ObjectId(),
                type: type ? type._id : new mongoose.Types.ObjectId(),
                extraFields: {},
                isLatest: false,
            });

            console.log('PRODUCT CREATED:', product._id);
            process.exit(0);
        } catch (err) {
            console.error('PRODUCT CREATION ERROR:', err.message);
            process.exit(1);
        }
    })
    .catch((err) => {
        console.error('TEST DB ERROR:', err);
        process.exit(1);
    });
