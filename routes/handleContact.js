var express = require('express');
var router = express.Router();
const Contact = require('../models/contact');

/* Your customer has contacted you!
   The variable req contains the name, email, and message.
   Store it in your MongoDB database (127.0.0.1:27017).
*/
router.post('/', async function(req, res, next) {
  try {
    console.log('Received contact form submission:', req.body);
    const { name, email, message, progress } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).render('error', {
        message: '所有欄位都必須填寫',
        error: { status: 400 }
      });
    }

    // Create new contact
    const contact = new Contact({
      name,
      email,
      message,
      progress: progress || 'inProgress',
      createdAt: new Date()
    });

    // Save to database
    await contact.save();
    console.log('Contact saved successfully:', contact);

    // Redirect back to contact page with success message
    res.redirect('/contact?success=true');
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).render('error', { 
      message: '提交表單時發生錯誤',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
});

module.exports = router;
