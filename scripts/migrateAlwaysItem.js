require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

async function migrateAlwaysItem() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Update all existing documents to set alwaysItem field
        const result = await MenuItem.updateMany(
            { alwaysItem: { $exists: false } }, // Find documents without alwaysItem
            { $set: { alwaysItem: false } }     // Set alwaysItem to false
        );

        console.log(`Migration complete. Updated ${result.modifiedCount} documents.`);

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the migration
migrateAlwaysItem();
