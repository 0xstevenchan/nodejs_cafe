require('dotenv').config();
const mongoose = require('mongoose');
const Admin_user = require('../models/Admin_user');

mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');
    try {
        const users = await Admin_user.find({});
        console.log('Found users:', users.length);
        users.forEach(user => {
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
