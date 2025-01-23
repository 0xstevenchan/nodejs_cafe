const { MongoClient } = require('mongodb');

const sourceUrl = 'mongodb://127.0.0.1:27017';
const sourceDB = 'wcbcafe';
const sourceCollection = 'contact';

const targetUrl = 'mongodb://127.0.0.1:27017';
const targetDB = 'wcb_cafe';
const targetCollection = 'contact';

async function copyContacts() {
    const sourceClient = new MongoClient(sourceUrl);
    const targetClient = new MongoClient(targetUrl);

    try {
        // Connect to both databases
        await sourceClient.connect();
        await targetClient.connect();
        console.log('Connected to both databases');

        // Get database references
        const srcDb = sourceClient.db(sourceDB);
        const targetDb = targetClient.db(targetDB);

        // Get all documents from source collection
        const contacts = await srcDb.collection(sourceCollection).find({}).toArray();
        console.log(`Found ${contacts.length} contacts in source database`);

        if (contacts.length > 0) {
            // Prepare contacts for insertion by removing _id field
            const preparedContacts = contacts.map(contact => {
                const { _id, ...contactWithoutId } = contact;
                return contactWithoutId;
            });

            // Insert all documents into target collection
            const result = await targetDb.collection(targetCollection).insertMany(preparedContacts, { ordered: false });
            console.log(`Successfully copied ${result.insertedCount} contacts to target database`);
        } else {
            console.log('No contacts found to copy');
        }

    } catch (err) {
        if (err.code === 11000) {
            console.log('Some contacts were already present in the target database');
        } else {
            console.error('Error copying contacts:', err);
        }
    } finally {
        // Close both connections
        await sourceClient.close();
        await targetClient.close();
        console.log('Database connections closed');
    }
}

// Run the copy operation
copyContacts().catch(console.error);
