require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });
        
        console.log('Successfully connected to MongoDB');
        
        // Create a test collection
        const testCollection = mongoose.connection.collection('test');
        
        // Insert a test document
        await testCollection.insertOne({ test: 'Hello MongoDB!' });
        console.log('Successfully inserted test document');
        
        // Read the test document
        const doc = await testCollection.findOne({ test: 'Hello MongoDB!' });
        console.log('Found document:', doc);
        
        // Clean up
        await testCollection.deleteOne({ test: 'Hello MongoDB!' });
        console.log('Cleaned up test document');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testConnection();
