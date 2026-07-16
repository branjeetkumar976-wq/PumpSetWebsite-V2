const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    mobile: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    // ================= TIME WALLET =================

    // वर्तमान बचा हुआ समय (सेकंड में)
    walletSeconds: {
        type: Number,
        default: 0
    },

    // अब तक खरीदा गया कुल समय
    totalPurchasedSeconds: {
        type: Number,
        default: 0
    },

    // अब तक उपयोग किया गया कुल समय
    totalUsedSeconds: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Customer", customerSchema);