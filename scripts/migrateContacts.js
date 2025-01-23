require('dotenv').config();
const mongoose = require('mongoose');

async function migrateContacts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Get both collections
        const contactCollection = mongoose.connection.collection('contact');
        const contactsCollection = mongoose.connection.collection('contacts');

        // Count documents in contact collection
        const contactCount = await contactCollection.countDocuments();
        console.log(`\nNumber of documents in "contact":`, contactCount);

        if (contactCount > 0) {
            // Get all documents from contact
            const allContacts = await contactCollection.find({}).toArray();
            
            // Transform documents to add timestamps
            const transformedContacts = allContacts.map(doc => ({
                ...doc,
                createdAt: new Date(),
                updatedAt: new Date(),
                __v: 0
            }));
            
            // Insert into contacts collection
            const result = await contactsCollection.insertMany(transformedContacts);
            console.log(`\nSuccessfully copied ${result.insertedCount} documents from "contact" to "contacts"`);
        } else {
            console.log('No documents to migrate from "contact"');
        }

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

migrateContacts();
