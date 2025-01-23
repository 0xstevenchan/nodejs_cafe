const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Get all menu items
router.get('/', async (req, res) => {
    try {
        const items = await MenuItem.find()
            .select('displayTitle smallDescription foodImage ingredients startDate endDate alwaysItem nowProvid price');

        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({
            success: false,
            error: '載入菜單時發生錯誤'
        });
    }
});

module.exports = router;
