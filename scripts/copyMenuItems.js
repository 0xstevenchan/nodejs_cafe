const mongoose = require('mongoose');
require('dotenv').config();

async function copyMenuItems() {
    try {
        // Connect to source database (cafe_db)
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        // Get the menuItems collection
        const sourceCollection = mongoose.connection.collection('menuitems');
        
        // Get all documents
        const documents = await sourceCollection.find({}).toArray();
        console.log(`Found ${documents.length} documents to copy from cafe_db`);

        // Switch to target database and clear existing documents
        const targetDb = mongoose.connection.useDb('wcb_cafe');
        const targetCollection = targetDb.collection('menuitems');
        
        // Remove existing documents from target collection
        const deleteResult = await targetCollection.deleteMany({});
        console.log(`Cleared ${deleteResult.deletedCount} existing documents from wcb_cafe`);

        if (documents.length > 0) {
            // Insert into target database
            const result = await targetCollection.insertMany(documents);
            console.log(`Successfully copied ${result.insertedCount} documents to wcb_cafe.menuitems`);
        }

    } catch (error) {
        console.error('Error copying documents:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit();
    }
}

copyMenuItems();
