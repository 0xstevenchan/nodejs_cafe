require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const fs = require('fs').promises;
const path = require('path');

class DBManager {
    constructor() {
        this.connected = false;
    }

    async connect() {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            this.connected = true;
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.connected) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
    }

    async backup(outputPath) {
        try {
            const items = await MenuItem.find({});
            const backup = {
                timestamp: new Date(),
                items: items
            };
            
            await fs.writeFile(
                path.join(outputPath, `backup_${Date.now()}.json`),
                JSON.stringify(backup, null, 2)
            );
            console.log('Backup created successfully');
        } catch (error) {
            console.error('Backup error:', error);
            throw error;
        }
    }

    async restore(backupFile) {
        try {
            const data = require(backupFile);
            await MenuItem.deleteMany({});
            await MenuItem.insertMany(data.items);
            console.log('Restore completed successfully');
        } catch (error) {
            console.error('Restore error:', error);
            throw error;
        }
    }

    async stats() {
        try {
            const totalItems = await MenuItem.countDocuments();
            const activeItems = await MenuItem.countDocuments({
                nowProvid: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            });
            const upcomingItems = await MenuItem.countDocuments({
                startDate: { $gt: new Date() }
            });
            const expiredItems = await MenuItem.countDocuments({
                endDate: { $lt: new Date() }
            });

            console.log('\nDatabase Statistics:');
            console.log('-------------------');
            console.log(`Total Items: ${totalItems}`);
            console.log(`Active Items: ${activeItems}`);
            console.log(`Upcoming Items: ${upcomingItems}`);
            console.log(`Expired Items: ${expiredItems}`);
        } catch (error) {
            console.error('Stats error:', error);
            throw error;
        }
    }

    async cleanup() {
        try {
            const result = await MenuItem.deleteMany({
                endDate: { $lt: new Date() }
            });
            console.log(`Cleaned up ${result.deletedCount} expired items`);
        } catch (error) {
            console.error('Cleanup error:', error);
            throw error;
        }
    }

    async validate() {
        try {
            const items = await MenuItem.find({});
            const errors = [];

            for (const item of items) {
                if (!item.displayTitle) {
                    errors.push(`Item ${item._id}: Missing display title`);
                }
                if (!item.smallDescription) {
                    errors.push(`Item ${item._id}: Missing description`);
                }
                if (!item.foodImage) {
                    errors.push(`Item ${item._id}: Missing image`);
                }
                if (!item.ingredients || item.ingredients.length === 0) {
                    errors.push(`Item ${item._id}: No ingredients listed`);
                }
                if (item.startDate > item.endDate) {
                    errors.push(`Item ${item._id}: Invalid date range`);
                }
            }

            if (errors.length > 0) {
                console.log('\nValidation Errors:');
                console.log('------------------');
                errors.forEach(error => console.log(error));
            } else {
                console.log('All items passed validation');
            }
        } catch (error) {
            console.error('Validation error:', error);
            throw error;
        }
    }
}

// Command line interface
async function main() {
    const manager = new DBManager();
    const command = process.argv[2];
    
    try {
        await manager.connect();

        switch (command) {
            case 'backup':
                await manager.backup('./backups');
                break;
            case 'restore':
                const backupFile = process.argv[3];
                if (!backupFile) {
                    throw new Error('Please specify backup file path');
                }
                await manager.restore(backupFile);
                break;
            case 'stats':
                await manager.stats();
                break;
            case 'cleanup':
                await manager.cleanup();
                break;
            case 'validate':
                await manager.validate();
                break;
            default:
                console.log(`
Available commands:
  backup   - Create a backup of the database
  restore  - Restore from a backup file
  stats    - Show database statistics
  cleanup  - Remove expired items
  validate - Validate all items
                `);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await manager.disconnect();
    }
}

if (require.main === module) {
    main();
}

module.exports = DBManager;
