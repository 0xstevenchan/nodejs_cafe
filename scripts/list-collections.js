require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in wcb_cafe database:');
        collections.forEach(collection => {
            console.log('-', collection.name);
        });
        
        // Also check the actual documents in admin_users collection
        const adminUsers = await mongoose.connection.db.collection('admin_users').find({}).toArray();
        console.log('\nDocuments in admin_users collection:', adminUsers.length);
        adminUsers.forEach(user => {
            console.log('Username:', user.username);
            console.log('Email:', user.email);
            console.log('Password:', user.password);
            console.log('-------------------');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
