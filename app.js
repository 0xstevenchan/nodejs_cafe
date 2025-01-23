require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');
var cors = require('cors');
var compression = require('compression');
var session = require('express-session');
var rateLimit = require('express-rate-limit');
var bodyParser = require('body-parser');
const fs = require('fs');

var indexRouter = require('./routes/index');
var handleContactRouter = require('./routes/handleContact');
var handleDialogueRouter = require('./routes/handleDialogue');
var checkRouter = require('./routes/check');
var menuItemsRouter = require('./routes/menuItems');
var dialogueRouter = require('./routes/dialogue');
var contactRouter = require('./routes/contact');
var authRouter = require('./routes/auth');
var orderRouter = require('./routes/order');
var customerOrderRouter = require('./routes/customerOrder');
var messagesRouter = require('./routes/messages');

const checkAdminSession = require('./middleware/auth');

var app = express();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/wcb_cafe', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

// Middleware to check MongoDB connection
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        console.error('MongoDB not connected. Current state:', mongoose.connection.readyState);
        return res.status(500).json({
            success: false,
            message: '資料庫連接失敗，請稍後再試'
        });
    }
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors());
app.use(compression());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: true,
    saveUninitialized: false,
    rolling: true, // Reset maxAge on every response
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    }
}));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

const staticLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // increased limit to 1000 requests per minute
    message: 'Too many requests from this IP, please try again after a minute'
});

// Apply rate limiting only to API routes
app.use('/api/', apiLimiter);

// Apply less restrictive rate limiting to static files
app.use('/images/', staticLimiter);

// Serve static files for basic assets
app.use(express.static(path.join(__dirname, 'public'), {
    // Enable proper decoding of URL-encoded filenames
    decodeURIComponent: true
}));

// Special handling for menu images to handle encoded filenames
app.get('/images/menu/:filename', (req, res, next) => {
    try {
        // Get the encoded filename from the URL
        const encodedFilename = req.params.filename;
        
        // Decode the filename
        const filename = decodeURIComponent(encodedFilename);
        const imagePath = path.join(__dirname, 'public', 'images', 'menu', filename);
        
        // Log the request for debugging
        console.log('Image request:', {
            requested: encodedFilename,
            decoded: filename,
            fullPath: imagePath
        });

        // Check if file exists
        fs.access(imagePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Image not found:', imagePath);
                res.status(404).send('Image not found');
                return;
            }

            // Send the file with proper headers
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
            res.sendFile(imagePath, (err) => {
                if (err) {
                    console.error('Error sending image:', err);
                    next(err);
                }
            });
        });
    } catch (error) {
        console.error('Error processing image request:', error);
        next(error);
    }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/menu-items', menuItemsRouter);
app.use('/api/dialogue', dialogueRouter);
app.use('/api/contact', contactRouter);
app.use('/api/messages', messagesRouter);

// Direct logout route for backward compatibility
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error during logout' 
            });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Protected admin routes
app.use('/check', checkAdminSession, checkRouter);
app.use('/customerOrder', checkAdminSession, customerOrderRouter);

// Public routes
app.use('/handleDialogue', handleDialogueRouter);
app.use('/handleContact', handleContactRouter);  
app.use('/contact', contactRouter);  
app.use('/', indexRouter);
app.use('/order', orderRouter);

// Admin routes
app.get(['/admin', '/admin/'], (req, res) => {
    // If already logged in, serve dashboard
    if (req.session && req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname, 'public/admin/dashboard.html'));
        return;
    }
    // If not logged in, serve login.html
    res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// Admin logout route
app.post('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error during logout' 
            });
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

// Admin routes protection
app.use('/admin/*', (req, res, next) => {
    // Public paths that don't require authentication
    const publicPaths = [
        '/admin/login.html',
        '/admin/css/*',
        '/admin/js/*',
        '/admin/images/*'
    ];

    if (publicPaths.some(path => {
        if (path.endsWith('*')) {
            return req.path.startsWith(path.slice(0, -1));
        }
        return req.path === path;
    })) {
        return next();
    }

    if (!req.session.isAuthenticated) {
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        return res.redirect('/admin/login.html');
    }
    next();
});

// Admin page routes
app.get('/admin/menuManager', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/admin/login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin', 'menuManager.html'));
});

app.get('/admin/', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/admin/login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// API routes
app.get('/api/menu-items/unserved', async (req, res) => {
    try {
        const MenuItem = require('./models/MenuItem');
        
        // Find items that are not always available and not currently provided
        const items = await MenuItem.find({
            $or: [
                { alwaysItem: false },
                { nowProvid: false }
            ]
        }).sort({ displayTitle: 1 });

        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Error fetching unserved items:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use('/music', express.static(path.join(__dirname, 'public/music')));

// Serve favicon
app.use('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'images', 'favicon.ico'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    console.log('404 Not Found:', req.path);
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    console.error('Error:', err);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
