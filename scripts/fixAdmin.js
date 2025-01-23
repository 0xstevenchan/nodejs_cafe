const mongoose = require('mongoose');

async function fixAdmin() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Get the Admin_user collection directly
        const db = mongoose.connection.db;
        const collection = db.collection('Admin_user');
        
        // Find all documents
        const docs = await collection.find({}).toArray();
        console.log('Current admin records:', docs);

        // Update or create admin user
        const result = await collection.updateOne(
            { username: 'wcb-admin' },
            { 
                $set: {
                    username: 'wcb-admin',
                    password: 'admin',
                    email: 'admin@example.com',
                    role: 'admin',
                    lastLogin: new Date()
                }
            },
            { upsert: true }
        );

        console.log('Update result:', result);

        // Verify the update
        const updatedDocs = await collection.find({}).toArray();
        console.log('Updated admin records:', updatedDocs);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixAdmin();
