require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');
    try {
        const adminUsers = await mongoose.connection.db.collection('Admin_user').find({}).toArray();
        console.log('\nDocuments in Admin_user collection:', adminUsers.length);
        adminUsers.forEach(user => {
            console.log('Full user document:');
            console.log(JSON.stringify(user, null, 2));
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
