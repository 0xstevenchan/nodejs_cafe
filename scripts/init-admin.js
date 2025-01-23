require('dotenv').config();
const mongoose = require('mongoose');
const Admin_user = require('../models/Admin_user');

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');
    
    try {
        // Check if admin already exists
        const existingAdmin = await Admin_user.findOne({ username: 'wcb-admin' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const adminUser = new Admin_user({
            username: 'wcb-admin',
            password: 'wcb-1234',
            email: 'admin@wcbcafe.com'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
