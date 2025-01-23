var express = require('express');
var router = express.Router();
const Contact = require('../models/contact');

// Admin authentication middleware for protected routes
const adminAuth = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/admin/login.html');
    }
};

// Render contact form
router.get('/', function(req, res) {
    res.render('contact', { 
        msg: '',
        query: req.query 
    });
});

// Handle contact form submission
router.post('/', async function(req, res) {
    try {
        const contact = new Contact({
            name: req.body.name,
            email: req.body.email,
            message: req.body.message,
            progress: 'inProgress',
            date: new Date()
        });
        
        await contact.save();
        res.render('contact', { msg: '感謝您的詢問。我們會盡快回覆。' });
    } catch (err) {
        console.error('Error saving contact:', err);
        res.render('contact', { msg: '發生錯誤。請稍後再試。' });
    }
});

// Admin routes
router.get('/manager', adminAuth, async function(req, res) {
    try {
        const contacts = await Contact.find()
            .sort({ date: -1 });
        res.render('contact-manager', { contacts });
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).send('Error fetching contacts from database');
    }
});

router.post('/update-status', adminAuth, async function(req, res) {
    try {
        const { contactId, status } = req.body;
        await Contact.findByIdAndUpdate(contactId, { progress: status });
        res.redirect('/contact/manager');
    } catch (err) {
        console.error('Error updating contact status:', err);
        res.status(500).send('Error updating contact status');
    }
});

// Handle legacy form submission path
router.post('/submit', async function(req, res) {
    // Redirect to the main contact post handler
    router.handle(req, res, () => {});
});

// Handle contact status update (admin only)
router.post('/check', adminAuth, async function(req, res) {
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

        res.redirect('/contact/manager');
    } catch (err) {
        console.error('Error updating contact:', err);
        res.status(500).send('Error updating contact in database');
    }
});

// Done contacts page with pagination (admin only)
router.get('/done', adminAuth, async function(req, res) {
    try {
        const perPage = 3;
        const currentPage = parseInt(req.query.page) || 1;
        const previousPage = currentPage - 1;
        const nextPage = currentPage + 1;
        
        const maxDocuments = await Contact.countDocuments({ progress: 'done' });
        const maxPages = Math.ceil(maxDocuments / perPage);
        
        const contacts = await Contact.find({ progress: 'done' })
            .sort({ date: -1 })
            .skip((currentPage-1) * perPage)
            .limit(perPage);
            
        res.render('done', { 
            contact: contacts, 
            currentPage, 
            previousPage, 
            nextPage, 
            maxPages 
        });
    } catch (err) {
        console.error('Error fetching done contacts:', err);
        res.status(500).send('Error fetching contacts from database');
    }
});

// Check for new messages (admin only)
router.get('/check-new', adminAuth, async function(req, res) {
    try {
        const count = await Contact.countDocuments({ progress: 'inProgress' });
        res.json({ count });
    } catch (err) {
        console.error('Error checking new messages:', err);
        res.status(500).json({ error: 'Failed to check new messages' });
    }
});

module.exports = router;
