require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const MenuItem = require('../models/MenuItem');

async function importMenuItems() {
    try {
        // Connect to MongoDB with specific options
        await mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // 5 second timeout
        });
        console.log('Connected to MongoDB');

        // Read the menu items from backup file
        const data = await fs.readFile(path.join(__dirname, '../cafe_db.menuitems_20250118.json'), 'utf8');
        const menuItems = JSON.parse(data);

        // Clear existing menu items
        await MenuItem.deleteMany({});
        console.log('Cleared existing menu items');

        // Insert new menu items
        for (const item of menuItems) {
            // Convert MongoDB ObjectId to string
            if (item._id && item._id.$oid) {
                item._id = item._id.$oid;
            }
            // Convert dates
            if (item.createdAt && item.createdAt.$date) {
                item.createdAt = new Date(item.createdAt.$date);
            }
            if (item.updatedAt && item.updatedAt.$date) {
                item.updatedAt = new Date(item.updatedAt.$date);
            }
            if (item.startDate && item.startDate.$date) {
                item.startDate = new Date(item.startDate.$date);
            }
            if (item.endDate && item.endDate.$date) {
                item.endDate = new Date(item.endDate.$date);
            }
            
            // Add default price if not present
            if (!item.price) {
                item.price = 0;
            }

            // Add default values for required fields
            const menuItem = {
                displayTitle: item.displayTitle || 'Untitled Item',
                smallDescription: item.smallDescription || 'No description available',
                foodImage: item.foodImage || '/images/menu/default.jpg',
                ingredients: item.ingredients || [],
                startDate: item.startDate || null,
                endDate: item.endDate || null,
                alwaysItem: item.alwaysItem || false,
                nowProvid: item.nowProvid || false,
                price: item.price || 0,
                _id: item._id
            };
            
            try {
                await MenuItem.create(menuItem);
                console.log(`Imported item: ${menuItem.displayTitle}`);
            } catch (err) {
                console.error(`Error importing item ${menuItem.displayTitle}:`, err);
            }
        }

        console.log(`Successfully imported ${menuItems.length} menu items`);
        process.exit(0);
    } catch (error) {
        console.error('Error importing menu items:', error);
        process.exit(1);
    }
}

importMenuItems();
