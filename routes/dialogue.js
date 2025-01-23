const express = require('express');
const router = express.Router();
const path = require('path');

// GET /dialogue
router.get('/', function(req, res, next) {
    try {
        res.render('dialogue', { 
            title: 'WCB Cafe - 讚賞與建議',
            query: req.query 
        });
    } catch (error) {
        console.error('Error rendering dialogue page:', error);
        next(error);
    }
});

module.exports = router;
