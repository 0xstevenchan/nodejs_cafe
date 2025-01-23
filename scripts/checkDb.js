const mongoose = require('mongoose');

async function checkDb() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nCollections in database:', collections.map(c => c.name));

        // Get Admin_user collection
        const adminCollection = mongoose.connection.db.collection('Admin_user');
        const admins = await adminCollection.find({}).toArray();
        
        console.log('\nAdmin_user collection contents:');
        console.log(JSON.stringify(admins, null, 2));

        // Show field names for each document
        console.log('\nField names in each document:');
        admins.forEach((doc, i) => {
            console.log(`\nDocument ${i + 1} fields:`, Object.keys(doc));
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkDb();
