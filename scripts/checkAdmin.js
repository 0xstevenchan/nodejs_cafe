const mongoose = require('mongoose');
const Admin_user = require('../models/Admin_user');

async function checkAdmin() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Find all admin users
        const admins = await Admin_user.find();
        console.log('Found admins:', admins);

        // Create default admin if none exists
        if (admins.length === 0) {
            console.log('No admin found, creating default admin...');
            const admin = new Admin_user({
                userName: 'wcb-admin',
                password: 'admin',
                email: 'admin@example.com',
                createdAt: new Date(),
                lastLogin: new Date()
            });
            await admin.save();
            console.log('Created default admin:', admin);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkAdmin();
