require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

async function addTestData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // First, let's check existing records
        const count = await MenuItem.countDocuments();
        console.log(`Current number of menu items: ${count}`);

        // If no records exist, add some test data
        if (count === 0) {
            const testItems = [
                {
                    displayTitle: "Cappuccino",
                    smallDescription: "Rich espresso with steamed milk and foam",
                    foodImage: "/images/menu/cappuccino.jpg",
                    ingredients: ["Coffee", "Milk", "Foam"],
                    nowProvid: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
                },
                {
                    displayTitle: "Chocolate Cake",
                    smallDescription: "Decadent chocolate cake with rich frosting",
                    foodImage: "/images/menu/chocolate-cake.jpg",
                    ingredients: ["Chocolate", "Flour", "Sugar", "Eggs"],
                    nowProvid: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            ];

            await MenuItem.insertMany(testItems);
            console.log('Test data added successfully');
        }

        // Verify the data
        const items = await MenuItem.find();
        console.log('\nCurrent menu items:');
        console.log(JSON.stringify(items, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

addTestData();
