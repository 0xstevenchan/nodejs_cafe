# WCB Cafe Web Application

A modern, full-featured cafe website with customer-facing pages and an admin dashboard. Built with Node.js, Express, and MongoDB.

## Features

### Customer Features
1. **Menu Browsing**
   - View cafe menu items with images and descriptions
   - Filter items by category
   - Real-time menu updates

2. **Contact System**
   - Submit inquiries and feedback
   - Form validation
   - Automatic confirmation messages

3. **Order System**
   - Place orders online
   - Customize menu items
   - Real-time order status updates

4. **User Experience**
   - Responsive design for all devices
   - Background music on selected pages
   - Modern, clean interface
   - Multi-language support (中文/English)

### Admin Features
1. **Dashboard**
   - Overview of orders and inquiries
   - Real-time statistics
   - Quick access to all management functions

2. **Menu Management**
   - Add/Edit/Delete menu items
   - Upload item images
   - Update prices and descriptions
   - Manage categories

3. **Contact Management**
   - View customer inquiries
   - Mark messages as handled
   - Sound notifications for new messages
   - Auto-refresh functionality

4. **Order Management**
   - View and process orders
   - Update order status
   - Order history tracking

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v6 or higher)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd cafe_web_template
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     MONGODB_URI=mongodb://127.0.0.1:27017/wcb_cafe
     SESSION_SECRET=your_session_secret
     PORT=3000
     ```

4. **Initialize Database**
   ```bash
   # Import sample menu items
   mongoimport --db wcb_cafe --collection menuitems --file cafe_db.menuitems.json --jsonArray
   ```

5. **Start the Application**
   ```bash
   npm start
   ```

6. **Access the Application**
   - Customer Website: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3000/admin`
   - Default admin credentials:
     - Username: admin
     - Password: admin123

## Project Structure

```
cafe_web_template/
├── public/           # Static files (CSS, JS, images)
│   ├── css/         # Stylesheets
│   ├── js/          # Client-side JavaScript
│   ├── images/      # Image assets
│   └── music/       # Background music files
├── views/           # EJS templates
├── routes/          # Route handlers
├── models/          # Database models
├── middleware/      # Custom middleware
└── app.js          # Application entry point
```

## Key Features Implementation

### Background Music
- Plays automatically on supported pages
- Volume control and auto-pause when tab is hidden
- Files located in `/public/music/`

### Message Notifications
- Real-time notifications for new customer messages
- Sound alerts for admin dashboard
- Auto-refresh functionality

### Security Features
- Session-based authentication
- CSRF protection
- Input validation
- Secure password handling

## Troubleshooting

### Common Issues

1. **MongoDB Connection**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Sound Not Playing**
   - Check browser sound permissions
   - Interact with the page (click) to enable sound
   - Verify sound files exist in correct location

3. **Image Upload Issues**
   - Check folder permissions
   - Verify supported file types
   - Check file size limits

## Maintenance

### Regular Tasks
1. **Database Backup**
   - Regular exports of collections
   - Store backups securely

2. **Log Management**
   - Check `/logs` directory
   - Rotate logs regularly

3. **Updates**
   - Keep dependencies updated
   - Check for security updates

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support or questions, please contact [support email]

---

Last updated: 2025-01-22
