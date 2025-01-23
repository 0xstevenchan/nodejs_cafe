const checkAdminSession = (req, res, next) => {
    // Skip auth check if already authenticated in this session
    if (req.session && req.session.isAuthenticated) {
        // Set a flag to indicate this session has been verified
        req.session.adminVerified = true;
        return next();
    }

    // Skip check if session was previously verified
    if (req.session && req.session.adminVerified) {
        return next();
    }

    // Check if it's an API request
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    // Save the intended URL to redirect back after login
    req.session.returnTo = req.originalUrl;
    
    // Redirect to login for non-API requests
    res.redirect('/admin');
};

module.exports = checkAdminSession;
