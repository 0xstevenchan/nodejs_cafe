var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const AdminUser = require('../models/adminUser');

require('dotenv').config(); // Make sure to install dotenv

// Render the login form  
router.get('/', (req, res) => {  
    res.render('login', { 
        returnTo: req.session.returnTo || '/admin/dashboard.html',
        messages: req.flash()
    });  
});

// Login route
router.post('/', async (req, res) => {
    try {
        let { username, password } = req.body;
        
        // Decode URI encoded credentials
        username = decodeURIComponent(username);
        password = decodeURIComponent(password);
        
        // Find the admin user
        const admin = await AdminUser.findOne({ 
            username: { $regex: new RegExp('^' + username + '$', 'i') }
        });

        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Verify password
        const isValid = await admin.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Set session
        req.session.isAuthenticated = true;
        req.session.user = { 
            username: admin.username,
            id: admin._id
        };
        
        // Get return URL from session and remove it
        const returnTo = req.session.returnTo || '/admin/dashboard.html';
        delete req.session.returnTo;
        
        res.json({ 
            success: true, 
            redirect: returnTo 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error during logout' 
            });
        }
        res.redirect('/admin/login.html');
    });
});

// Auth check route
router.get('/auth/check', (req, res) => {
    res.json({
        authenticated: !!(req.session && req.session.isAuthenticated)
    });
});

// Auth check endpoint
router.get('/auth/check/endpoint', (req, res) => {
    res.json({
        authenticated: !!(req.session && req.session.isAuthenticated)
    });
});

module.exports = router;