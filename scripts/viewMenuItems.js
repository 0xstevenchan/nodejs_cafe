require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

async function viewMenuItems() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        // Find all menu items
        const items = await MenuItem.find({});
        
        console.log('\nFound', items.length, 'menu items:\n');
        
        // Display each item
        items.forEach((item, index) => {
            console.log(`${index + 1}. ${item.displayTitle}`);
            console.log(`   Description: ${item.smallDescription}`);
            console.log(`   Image: ${item.foodImage}`);
            console.log(`   Ingredients: ${item.ingredients.join(', ')}`);
            console.log(`   Available: ${item.nowProvid ? 'Yes' : 'No'}`);
            console.log(`   Date Range: ${item.startDate.toLocaleDateString()} - ${item.endDate.toLocaleDateString()}`);
            console.log('-------------------');
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

viewMenuItems();
