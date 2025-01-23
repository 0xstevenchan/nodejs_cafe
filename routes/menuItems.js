const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const MenuItem = require('../models/MenuItem');

const UPLOAD_DIR = path.join(__dirname, '../public/images/menu');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        try {
            // Get file extension
            const ext = path.extname(file.originalname);
            
            // Get original name without extension and decode it
            let nameWithoutExt = path.basename(file.originalname, ext);
            
            try {
                // Decode the filename if it's URI encoded
                nameWithoutExt = decodeURIComponent(nameWithoutExt);
            } catch (e) {
                console.log('Filename was not URI encoded:', nameWithoutExt);
            }
            
            // Add timestamp to ensure uniqueness but preserve the original name
            const timestamp = Date.now();
            const finalName = `${nameWithoutExt}_${timestamp}${ext}`;
            
            console.log('File upload name processing:', {
                original: file.originalname,
                decoded: nameWithoutExt,
                final: finalName
            });
            
            cb(null, finalName);
        } catch (error) {
            console.error('Error processing filename:', error);
            cb(error);
        }
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
            req.fileValidationError = 'Only image files are allowed!';
            return cb(null, false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Initialize with sample data if empty
async function initializeMenuItems() {
    try {
        const count = await MenuItem.countDocuments();
        if (count === 0) {
            console.log('Initializing sample menu items...');
            
            const sampleItems = [
                {
                    displayTitle: '經典黑咖啡',
                    smallDescription: '使用優質阿拉比卡豆製作的香醇黑咖啡',
                    alwaysItem: true,
                    nowProvid: true,
                    foodImage: '/images/menu/black_coffee.jpg'
                },
                {
                    displayTitle: '拿鐵咖啡',
                    smallDescription: '濃郁的義式濃縮與絲滑奶泡的完美結合',
                    alwaysItem: true,
                    nowProvid: true,
                    foodImage: '/images/menu/latte.jpg'
                },
                {
                    displayTitle: '季節限定草莓蛋糕',
                    smallDescription: '新鮮草莓與輕盈奶油的美味組合',
                    alwaysItem: false,
                    nowProvid: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                    foodImage: '/images/menu/strawberry_cake.jpg'
                }
            ];
            
            await MenuItem.insertMany(sampleItems);
            console.log('Sample menu items created successfully');
        }
    } catch (error) {
        console.error('Error initializing menu items:', error);
    }
}

// Call initialization on module load
initializeMenuItems();

// Get all menu items
router.get('/', async (req, res) => {
    try {
        const items = await MenuItem.find()
            .select('displayTitle smallDescription foodImage ingredients startDate endDate alwaysItem nowProvid price')
            .lean();

        // Sort items by category and title
        const now = new Date();
        
        // Group items into categories
        const limitedItems = items.filter(item => {
            if (!(!item.alwaysItem && !item.nowProvid)) return false;
            if (!item.startDate || !item.endDate) return false;
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);
            return startDate <= now && now <= endDate;
        });
        
        const regularItems = items.filter(item => item.alwaysItem);
        const otherItems = items.filter(item => item.nowProvid);
        
        // Sort each category by title
        [limitedItems, regularItems, otherItems].forEach(category => {
            category.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
        });

        res.json({
            success: true,
            data: {
                limited: limitedItems,
                regular: regularItems,
                other: otherItems
            }
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ 
            success: false, 
            error: '載入菜單時發生錯誤，請稍後再試' 
        });
    }
});

// Get menu statistics
router.get('/stats', async (req, res) => {
    try {
        const currentDate = new Date();
        const [totalItems, activeItems] = await Promise.all([
            MenuItem.countDocuments(),
            MenuItem.countDocuments({
                $or: [
                    // First condition: nowProvid true OR alwaysItem true
                    { nowProvid: true },
                    { alwaysItem: true },
                    // Second condition: within date range
                    {
                        startDate: { $lte: currentDate },
                        endDate: { $gte: currentDate }
                    }
                ]
            })
        ]);
        res.json({ 
            totalItems, 
            activeItems,
            lastUpdated: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search menu items
router.get('/search', async (req, res) => {
    try {
        const { availability = 'all', sortBy = 'title', sortOrder = 'asc', limit = 1000 } = req.query;
        
        console.log('Search request:', {
            availability,
            sortBy,
            sortOrder,
            limit
        });

        // Build query
        let query = MenuItem.find();

        // Apply availability filter
        if (availability !== 'all') {
            if (availability === 'always') {
                query = query.where('alwaysItem').equals(true);
            } else if (availability === 'now') {
                query = query.where('nowProvid').equals(true);
            }
        }

        // Apply sorting
        const sortConfig = {};
        if (sortBy === 'title') {
            sortConfig.displayTitle = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'price') {
            sortConfig.price = sortOrder === 'desc' ? -1 : 1;
        }
        query = query.sort(sortConfig);

        // Apply limit
        if (limit) {
            query = query.limit(parseInt(limit));
        }

        // Execute query and convert to plain objects
        const items = await query
            .select('_id displayTitle smallDescription foodImage alwaysItem nowProvid')
            .lean()
            .exec();
        
        console.log(`Found ${items.length} items`);

        // Process items to ensure proper encoding
        const processedItems = items.map(item => ({
            ...item,
            displayTitle: item.displayTitle || '',
            smallDescription: item.smallDescription || '',
            foodImage: item.foodImage ? encodeURI(item.foodImage) : '',
            alwaysItem: !!item.alwaysItem,
            nowProvid: !!item.nowProvid
        }));

        res.json(processedItems);
    } catch (error) {
        console.error('Error searching menu items:', error);
        res.status(500).json({ 
            success: false, 
            error: '搜尋菜單時發生錯誤，請稍後再試' 
        });
    }
});

// Get active menu items
router.get('/active', async (req, res) => {
    try {
        const items = await MenuItem.find();
        const now = new Date();
        
        // Sort items based on their category
        const sortedItems = items.sort((a, b) => {
            // Helper function to check if an item is currently in its date range
            const isInDateRange = (item) => {
                return !item.alwaysItem && 
                       !item.nowProvid && 
                       item.startDate && 
                       item.endDate && 
                       new Date(item.startDate) <= now && 
                       new Date(item.endDate) >= now;
            };

            // Limited time items go first
            const aIsLimited = isInDateRange(a);
            const bIsLimited = isInDateRange(b);
            if (aIsLimited && !bIsLimited) return -1;
            if (!aIsLimited && bIsLimited) return 1;
            
            // Always items go second
            if (a.alwaysItem && !b.alwaysItem) return -1;
            if (!a.alwaysItem && b.alwaysItem) return 1;
            
            // Sort by title
            return a.displayTitle.localeCompare(b.displayTitle);
        });

        res.json({
            success: true,
            data: sortedItems
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch menu items' });
    }
});

// Get a specific menu item
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: '找不到菜單項目'
            });
        }
        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({
            success: false,
            message: error.message || '獲取菜單項目時發生錯誤'
        });
    }
});

// Create new menu item
router.post('/', upload.single('foodImage'), async (req, res) => {
    try {
        console.log('Creating new menu item with data:', req.body);
        const itemData = { ...req.body };
        
        // Handle boolean fields
        itemData.alwaysItem = itemData.alwaysItem === 'true' || itemData.alwaysItem === true;
        itemData.nowProvid = itemData.nowProvid === 'true' || itemData.nowProvid === true;
        
        // Handle dates
        if (itemData.startDate) {
            itemData.startDate = new Date(itemData.startDate);
        }
        if (itemData.endDate) {
            itemData.endDate = new Date(itemData.endDate);
        }
        
        // Handle file upload
        if (req.file) {
            console.log('File uploaded:', req.file);
            const imagePath = '/images/menu/' + req.file.filename;
            console.log('Saving image path:', imagePath);
            itemData.foodImage = imagePath;
        }
        
        const menuItem = new MenuItem(itemData);
        await menuItem.save();
        
        res.status(201).json({
            success: true,
            data: menuItem,
            message: '新增菜單項目成功'
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({
            success: false,
            message: error.message || '新增菜單項目時發生錯誤'
        });
    }
});

// Update menu item
router.put('/:id', upload.single('foodImage'), async (req, res) => {
    try {
        const id = req.params.id;
        const updateData = { ...req.body };
        
        // Convert checkbox values to boolean
        updateData.alwaysItem = updateData.alwaysItem === 'true';
        updateData.nowProvid = updateData.nowProvid === 'true';
        
        // Handle date fields
        if (updateData.startDate === 'null' || updateData.startDate === '') {
            updateData.startDate = null;
        } else if (updateData.startDate) {
            updateData.startDate = new Date(updateData.startDate);
        }
        
        if (updateData.endDate === 'null' || updateData.endDate === '') {
            updateData.endDate = null;
        } else if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
        }
        
        // If either checkbox is checked, ensure dates are null
        if (updateData.alwaysItem || updateData.nowProvid) {
            updateData.startDate = null;
            updateData.endDate = null;
        }
        
        // Handle file upload
        if (req.file) {
            updateData.foodImage = `/images/menu/${req.file.filename}`;
        }
        
        // Update database
        await MenuItem.findByIdAndUpdate(id, updateData);
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ success: false });
    }
});

// Delete menu item
router.delete('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: '找不到菜單項目'
            });
        }
        
        res.json({
            success: true,
            message: '菜單項目刪除成功'
        });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({
            success: false,
            error: '刪除菜單項目時發生錯誤'
        });
    }
});

// Toggle alwaysItem
router.put('/:id/toggle-always', async (req, res) => {
    try {
        const { id } = req.params;
        const { value } = req.body;
        
        const updateData = {
            alwaysItem: value
        };
        
        // If turning on alwaysItem, clear dates
        if (value) {
            updateData.startDate = null;
            updateData.endDate = null;
        }
        
        const item = await MenuItem.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!item) {
            return res.status(404).json({ success: false, message: '找不到菜單項目' });
        }
        
        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Error toggling alwaysItem:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Toggle nowProvid
router.put('/:id/toggle-now-provid', async (req, res) => {
    try {
        const { id } = req.params;
        const { value } = req.body;
        
        const updateData = {
            nowProvid: value
        };
        
        // If turning on nowProvid, clear dates
        if (value) {
            updateData.startDate = null;
            updateData.endDate = null;
        }
        
        const item = await MenuItem.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!item) {
            return res.status(404).json({ success: false, message: '找不到菜單項目' });
        }
        
        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Error toggling nowProvid:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload endpoint
router.post('/upload', upload.single('foodImage'), async (req, res) => {
    try {
        if (req.fileValidationError) {
            return res.status(400).json({ 
                success: false, 
                error: req.fileValidationError 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        // Return the URL path that can be used to access the file
        const imageUrl = `/images/menu/${encodeURIComponent(req.file.filename)}`;
        
        res.json({ 
            success: true, 
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'File upload failed' 
        });
    }
});

// Get unserved menu items
router.get('/unserved', async (req, res) => {
    try {
        // Find items that are not always available and not currently provided
        const items = await MenuItem.find({
            $or: [
                { alwaysItem: false },
                { nowProvid: false }
            ]
        }).sort({ displayTitle: 1 });

        // Categorize items
        const result = {
            success: true,
            data: {
                limited: items.filter(item => !item.alwaysItem && isInDateRange(item)),
                regular: items.filter(item => !item.alwaysItem && !isInDateRange(item)),
                other: items.filter(item => item.alwaysItem && !item.nowProvid)
            }
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching unserved items:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
