const adminAuth = (req, res, next) => {
    // Check if user is authenticated
    if (req.session && req.session.adminLoggedIn) {
        next();
    } else {
        // For API requests, return 401
        if (req.path.startsWith('/api/')) {
            res.status(401).json({ 
                authenticated: false,
                message: 'Authentication required'
            });
        } else {
            // For page requests, redirect to login
            req.session.returnTo = req.originalUrl;
            res.redirect('/admin/login.html');
        }
    }
};

module.exports = adminAuth;
