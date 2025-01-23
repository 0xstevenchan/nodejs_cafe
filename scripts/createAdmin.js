const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function createAdmin() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Create admin user
        const admin = new Admin({
            username: 'wcb-admin',
            password: 'admin',
            email: 'admin@example.com',
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully');

        // Verify the admin user
        const verifyAdmin = await Admin.findOne({ username: 'wcb-admin' });
        console.log('Verified admin user:', verifyAdmin);

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createAdmin();
