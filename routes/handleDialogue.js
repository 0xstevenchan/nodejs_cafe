const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify email configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

router.post('/', async function(req, res) {
    console.log('Received form submission:', req.body);
    const { name, email, subject, message } = req.body;

    try {
        console.log('Sending email to cafe...');
        // Send email to cafe
        const cafeEmailResult = await transporter.sendMail({
            from: `"${name}" <${email}>`,
            to: process.env.EMAIL_USER,
            subject: `來自網站的訊息: ${subject}`,
            text: `
姓名: ${name}
電郵: ${email}
主旨: ${subject}
訊息: ${message}
            `,
            replyTo: email
        });
        console.log('Email sent to cafe:', cafeEmailResult);

        console.log('Sending auto-reply...');
        // Send auto-reply to customer
        const autoReplyResult = await transporter.sendMail({
            from: `"WCB Cafe" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: '感謝您的訊息 - WCB Cafe',
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #0bd;">親愛的 ${name}：</h2>
    
    <p>感謝您與WCB Cafe回饋。我們已收到您的訊息，祈望將來為你提供更好的服務。</p>
    
    <p>以下是您發送的訊息摘要：</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>主旨：</strong> ${subject}</p>
        <p><strong>訊息：</strong> ${message}</p>
    </div>
    
    <p>如有任何緊急事項，歡迎致電：03-1234-5678</p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p><strong>WCB Cafe</strong></p>
        <p>地址：XX市XX區XX路XX號</p>
        <p>電話：03-1234-5678</p>
        <p>營業時間：10:00-20:00（週一公休）</p>
    </div>
</div>
            `
        });
        console.log('Auto-reply sent:', autoReplyResult);

        res.json({ 
            success: true, 
            message: '訊息已發送，請查看您的電子郵件信箱。' 
        });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ 
            success: false, 
            message: '發送失敗，請稍後再試。',
            error: error.message 
        });
    }
});

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: '發送失敗，請稍後再試。',
        error: err.message
    });
});

module.exports = router;
