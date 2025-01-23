const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');

// Admin authentication middleware
const adminAuth = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/admin/login.html');
    }
};

// GET Route - Fetch Contacts with "inProgress" Status
router.get('/', adminAuth, async function(req, res) {
    try {
        const contacts = await Contact.find({ progress: 'inProgress' })
            .sort({ date: -1 });
            
        res.render('check', { contacts });
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).send('Error fetching contacts from database');
    }
});

// POST Route - Update Contact Progress
router.post('/', adminAuth, async function(req, res) {
    try {
        if (!req.body.contactId) {
            return res.status(400).send('Missing contactId');
        }

        const result = await Contact.findByIdAndUpdate(
            req.body.contactId,
            { $set: { progress: 'done' } }
        );

        if (!result) {
            console.log('No contact found with the given ID');
            return res.status(404).send('Contact not found');
        }

        res.redirect('/check');
    } catch (err) {
        console.error('Error updating contact:', err);
        res.status(500).send('Error updating contact in database');
    }
});

// GET Route - Get count of completed contacts
router.get('/completed-count', adminAuth, async function(req, res) {
    try {
        const count = await Contact.countDocuments({ progress: 'done' });
        res.json({ success: true, count });
    } catch (err) {
        console.error('Error getting completed count:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
