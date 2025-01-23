const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Contact = require('../models/contact');
const Admin = require('../models/Admin');

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
};

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt received:', req.body);
        const { username, password } = req.body;

        // Get Admin_user collection directly
        const collection = mongoose.connection.db.collection('Admin_user');
        
        // Find admin user by userName field (as it exists in the database)
        const admin = await collection.findOne({ userName: username });
        console.log('Found admin record:', admin ? 'yes' : 'no');
        
        // Debug log
        console.log('Comparing credentials');
        console.log('Input username:', username);
        console.log('Stored username:', admin?.userName);
        console.log('Input password:', password);
        console.log('Stored password:', admin?.password);

        if (!admin) {
            console.log('Login failed: User not found');
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Compare password directly (as it's stored in plain text)
        if (password !== admin.password) {
            console.log('Login failed: Invalid password');
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Set session
        req.session.isAuthenticated = true;
        req.session.adminVerified = true;
        req.session.user = {
            id: admin._id,
            userName: admin.userName
        };

        // Update last login time
        await collection.updateOne(
            { _id: admin._id },
            { $set: { lastLogin: new Date() } }
        );

        console.log('Login successful for user:', admin.userName);
        res.json({ 
            success: true,
            redirectUrl: '/admin/dashboard.html'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Auth check endpoint
router.get('/check', (req, res) => {
    const isAuthenticated = !!(req.session && req.session.isAuthenticated);
    console.log('Auth check - Session:', req.session);
    console.log('Auth check - Is authenticated:', isAuthenticated);
    
    res.json({
        authenticated: isAuthenticated
    });
});

// Logout route
router.post('/logout', (req, res) => {
    // Clear all session data
    req.session.isAuthenticated = false;
    req.session.adminVerified = false;
    req.session.user = null;
    
    // Destroy the session completely
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error during logout' 
            });
        }
        
        // Clear the session cookie
        res.clearCookie('connect.sid');
        
        res.json({ 
            success: true,
            redirect: '/'
        });
    });
});

// Get check messages page
router.get('/check', requireAuth, async (req, res) => {
    try {
        const contact = await Contact.find().sort({ createdAt: -1 });
        res.render('check', { contact });
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).send('Error loading messages');
    }
});

// Handle marking message as done
router.post('/check', requireAuth, async (req, res) => {
    try {
        const { contactId, progress } = req.body;
        await Contact.findByIdAndUpdate(contactId, { progress: 'done' });
        res.redirect('/check');
    } catch (error) {
        console.error('Error updating contact message:', error);
        res.status(500).send('Error updating message');
    }
});

// Messages stats endpoint
router.get('/api/messages/stats', requireAuth, async (req, res) => {
    try {
        const totalMessages = await Contact.countDocuments();
        const newMessages = await Contact.countDocuments({ progress: 'inProgress' });
        res.json({ totalMessages, newMessages });
    } catch (error) {
        console.error('Error fetching message stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
