const mongoose = require('mongoose');

// Configuration model for storing dynamic settings
const configSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    category: {
        type: String,
        enum: ['payment', 'general', 'email', 'admin'],
        default: 'general'
    },
    description: {
        type: String,
        default: ''
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
configSchema.index({ key: 1 });
configSchema.index({ category: 1 });

// Static methods for easy access
configSchema.statics.get = async function (key, defaultValue = null) {
    const config = await this.findOne({ key });
    return config ? config.value : defaultValue;
};

configSchema.statics.set = async function (key, value, category = 'general', userId = null) {
    return await this.findOneAndUpdate(
        { key },
        {
            value,
            category,
            updatedBy: userId
        },
        {
            upsert: true,
            new: true
        }
    );
};

configSchema.statics.getPaymentConfig = async function () {
    const upiId = await this.get('payment.upiId', process.env.UPI_ID || 'anshgiri@fam');
    const payeeName = await this.get('payment.payeeName', process.env.PAYEE_NAME || 'Acadmix');
    const bankName = await this.get('payment.bankName', process.env.BANK_NAME || 'Paytm');

    return { upiId, payeeName, bankName };
};

configSchema.statics.setPaymentConfig = async function (config, userId = null) {
    const results = {};

    if (config.upiId !== undefined) {
        results.upiId = await this.set('payment.upiId', config.upiId, 'payment', userId);
    }

    if (config.payeeName !== undefined) {
        results.payeeName = await this.set('payment.payeeName', config.payeeName, 'payment', userId);
    }

    if (config.bankName !== undefined) {
        results.bankName = await this.set('payment.bankName', config.bankName, 'payment', userId);
    }

    return results;
};

module.exports = mongoose.model('Config', configSchema);
