var express = require('express');
var router = express.Router();
var { MongoClient } = require('mongodb');

require('dotenv').config(); // Make sure to install dotenv
const client = new MongoClient(process.env.MONGODB_URI); // Use environment variable

router.get('/', async(req, res) => {
    try {
        console.log('Received Get request from /order');
        let table = req.params.table;
        if (!table) {
            table = 'test'
        }

        await client.connect();  
        const db = client.db('wcb_cafe');
        const collection = db.collection('orders');
        const orders = await collection.find({
            status: { $ne: 'paid' }  // Only get orders that are not paid
        }, { projection: { _id: 0 }}).sort({time: -1}).toArray();
        
        console.log('Found orders:', orders);

        // Group orders by table
        const groupedOrders = {};
        orders.forEach(order => {
            const table = order.table || 'unknown';
            if (!groupedOrders[table]) {
                groupedOrders[table] = {
                    table: table,
                    orderItems: []
                };
            }
            
            // Create flat order items array
            Object.entries(order).forEach(([key, value]) => {
                if (!['time', 'status', 'table'].includes(key) && value > 0) {
                    groupedOrders[table].orderItems.push({
                        name: key,
                        quantity: value,
                        time: order.time,
                        status: order.status
                    });
                }
            });
        });

        // Sort order items by time for each table
        Object.values(groupedOrders).forEach(tableGroup => {
            tableGroup.orderItems.sort((a, b) => new Date(b.time) - new Date(a.time));
        });

        console.log('Grouped orders:', JSON.stringify(groupedOrders, null, 2));
        res.render('customerOrder', { groupedOrders: Object.values(groupedOrders) })

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
        
    } finally {
        await client.close();
    }
});

// Add new route to handle paid status update
router.post('/markPaid', async(req, res) => {
    let mongoClient;
    try {
        mongoClient = new MongoClient(process.env.MONGODB_URI);
        await mongoClient.connect();
        
        const { table } = req.body;
        console.log('Marking table as paid:', table);
        
        if (!table) {
            return res.status(400).json({ error: 'Table number is required' });
        }

        const db = mongoClient.db('wcb_cafe');
        const collection = db.collection('orders');
        
        // Update all non-paid orders for the specified table
        const result = await collection.updateMany(
            { 
                table: table,
                status: { $ne: 'paid' }
            },
            { 
                $set: { status: 'paid' }
            }
        );

        console.log('Update result:', result);

        // Check if any documents were modified
        if (result.modifiedCount === 0) {
            console.log('No orders were updated for table:', table);
        } else {
            console.log(`Updated ${result.modifiedCount} orders for table:`, table);
        }

        res.redirect('/customerOrder');
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
    }
});

module.exports = router;