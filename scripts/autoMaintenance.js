require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const DBManager = require('./dbManager');

class AutoMaintenance {
    constructor() {
        this.dbManager = new DBManager();
        this.backupDir = path.join(__dirname, '../backups');
        this.logDir = path.join(__dirname, '../logs');
    }

    async initialize() {
        // Create necessary directories
        await fs.mkdir(this.backupDir, { recursive: true });
        await fs.mkdir(this.logDir, { recursive: true });
        
        // Initialize log file
        this.logFile = path.join(this.logDir, `maintenance_${new Date().toISOString().split('T')[0]}.log`);
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        await fs.appendFile(this.logFile, logMessage);
        console.log(message);
    }

    async runDailyMaintenance() {
        try {
            await this.log('Starting daily maintenance...');

            // Connect to database
            await this.dbManager.connect();

            // 1. Create backup
            await this.log('Creating backup...');
            await this.dbManager.backup(this.backupDir);

            // 2. Clean up old backups (keep last 7 days)
            await this.log('Cleaning up old backups...');
            await this.cleanupOldBackups();

            // 3. Run database validation
            await this.log('Validating database...');
            await this.dbManager.validate();

            // 4. Get database statistics
            await this.log('Collecting statistics...');
            await this.dbManager.stats();

            // 5. Clean up expired items
            await this.log('Cleaning up expired items...');
            await this.dbManager.cleanup();

            // 6. Check disk space
            await this.log('Checking disk space...');
            await this.checkDiskSpace();

            // 7. Verify image files
            await this.log('Verifying image files...');
            await this.verifyImages();

            await this.log('Daily maintenance completed successfully');
        } catch (error) {
            await this.log(`ERROR: ${error.message}`);
            throw error;
        } finally {
            await this.dbManager.disconnect();
        }
    }

    async cleanupOldBackups() {
        const files = await fs.readdir(this.backupDir);
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

        for (const file of files) {
            const filePath = path.join(this.backupDir, file);
            const stats = await fs.stat(filePath);
            if (stats.mtimeMs < sevenDaysAgo) {
                await fs.unlink(filePath);
                await this.log(`Deleted old backup: ${file}`);
            }
        }
    }

    async checkDiskSpace() {
        const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
        await this.log('Disk Space Report:\n' + stdout);
    }

    async verifyImages() {
        const MenuItem = require('../models/MenuItem');
        const items = await MenuItem.find({});
        const imageDir = path.join(__dirname, '../public/images/menu');
        const errors = [];

        for (const item of items) {
            const imagePath = path.join(imageDir, path.basename(item.foodImage));
            try {
                await fs.access(imagePath);
            } catch (error) {
                errors.push(`Missing image for ${item.displayTitle}: ${item.foodImage}`);
            }
        }

        if (errors.length > 0) {
            await this.log('Image verification errors:');
            for (const error of errors) {
                await this.log(error);
            }
        } else {
            await this.log('All images verified successfully');
        }
    }

    async compressImages() {
        // TODO: Implement image compression
        await this.log('Image compression not implemented yet');
    }
}

// Command line interface
async function main() {
    const maintenance = new AutoMaintenance();
    
    try {
        await maintenance.initialize();
        await maintenance.runDailyMaintenance();
    } catch (error) {
        console.error('Maintenance failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
