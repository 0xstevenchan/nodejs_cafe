var express = require('express');
var router = express.Router();
var { MongoClient } = require('mongodb');

require('dotenv').config(); // Make sure to install dotenv
const client = new MongoClient(process.env.MONGODB_URI); // Use environment variable

router.get(['/', '/table/:table'], async(req, res) => {

    try {        
        console.log('Received Get request from /order');
        let table = req.params.table;
        if (!table) {
            table = 'test'
        }

        // Connect to MongoDB
        await client.connect();  
        const db = client.db('wcb_cafe');
        const collection = db.collection('menuitems');
        const memuitems = await collection.find().toArray();

        //Categorize items
        limited = [], // 期間限定
        regular = [], // 常規供應
        other = []    // 其他美食
        memuitems.forEach(item => {
            if (item.alwaysItem) {
                // 常規供應
                regular.push(item);
            } else if (item.nowProvid) {
                // 其他美食
                other.push(item);
            } else {
                // Check if item is within date range for 期間限定
                const now = new Date();
                const startDate = item.startDate ? new Date(item.startDate) : null;
                const endDate = item.endDate ? new Date(item.endDate) : null;                
                if (startDate && endDate && startDate <= now && endDate >= now) {
                    limited.push(item);
                }
            }
        });
        catelogue = { 期間限定:limited, 常規供應:regular, 其他美食:other };
        res.render('order', { limited:limited, catelogue:catelogue, table:table });

    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).send('Internal Server Error');
        
    } finally {
        await client.close();
    }
});

router.post(['/', '/table/:table'], async(req, res) => {
    console.log('Received Post request from /order');
    const order = Object.fromEntries(
        Object.entries(req.body)
            .map(([key, value]) => [key, parseInt(value, 10)]) // Convert values to integers
            .filter(([key, value]) => value > 0) // Filter out entries where value is 0
    );
    order['time'] = new Date();
    order['status'] = 'pending';
    let table = req.params.table;
    if (!table) {
        order['table'] = 'test'
    } else {
        order['table'] = table
    }

    // Connect to MongoDB
    await client.connect();  
    const db = client.db('wcb_cafe');
    const collection = db.collection('orders');
    const result = await collection.insertOne(order);
    res.redirect('/order');
});

module.exports = router;