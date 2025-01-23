const mongoose = require('mongoose');
const Admin_user = require('../models/Admin_user');
require('dotenv').config();

async function initializeAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wcb_cafe', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin_user.findOne({ userName: 'wcb-admin' });
        
        if (existingAdmin) {
            console.log('Updating existing admin user...');
            existingAdmin.password = 'admin';
            await existingAdmin.save();
            console.log('Admin user updated successfully');
        } else {
            console.log('Creating new admin user...');
            // Create default admin user
            const admin = new Admin_user({
                userName: 'wcb-admin',
                password: 'admin',
                email: 'admin@example.com',
                createdAt: new Date(),
                lastLogin: new Date()
            });

            await admin.save();
            console.log('Admin user created successfully');
        }

        // Verify the admin user
        const verifyAdmin = await Admin_user.findOne({ userName: 'wcb-admin' });
        console.log('Verified admin user:', verifyAdmin);

    } catch (error) {
        console.error('Error initializing admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

initializeAdmin();
