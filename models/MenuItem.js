const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    displayTitle: {
        type: String,
        required: true,
        trim: true
    },
    smallDescription: {
        type: String,
        required: true,
        maxLength: 90,
        trim: true
    },
    alwaysItem: {
        type: Boolean,
        required: true,
        default: false
    },
    nowProvid: {
        type: Boolean,
        required: true,
        default: false
    },
    startDate: {
        type: Date,
        required: false,
        default: null
    },
    endDate: {
        type: Date,
        required: false,
        default: null
    },
    foodImage: {
        type: String,
        required: true
    },
    ingredients: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Pre-save middleware
menuItemSchema.pre('save', function(next) {
    // Handle alwaysItem logic
    if (this.alwaysItem) {
        this.startDate = null;
        this.endDate = null;
    }
    next();
});

// Pre-findOneAndUpdate middleware
menuItemSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    console.log('Pre-update middleware running with update:', update);

    // If alwaysItem or nowProvid is being set to true, clear dates
    if (update.alwaysItem === true || update.nowProvid === true) {
        this.set({ startDate: null, endDate: null });
    }

    next();
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
