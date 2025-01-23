require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

async function checkMenuItems() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const items = await MenuItem.find();
        console.log(`Found ${items.length} menu items:`);
        items.forEach(item => {
            console.log(`- ${item.displayTitle} (${item.alwaysItem ? 'Always Available' : item.nowProvid ? 'Now Providing' : 'Limited Time'})`);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkMenuItems();
