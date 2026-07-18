const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    farmerName: {
        type: String,
        required: true
    },

    hours: {
        type: Number,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        default: "Pending"
    },

    bookingDate: {
        type: Date,
        default: Date.now
    },

    // Pump Start Time
    startTime: {
        type: Date,
        default: null
    },

    // Pump End Time
    endTime: {
        type: Date,
        default: null
    },

    // कुल समय (सेकंड में)
totalSeconds: {
    type: Number,
    default: 0
},

// बचा हुआ समय (सेकंड में)
remainingSeconds: {
    type: Number,
    default: 0
},

// Time Wallet से Book हुआ था?
usedWallet: {
    type: Boolean,
    default: false
}

});
module.exports = mongoose.model("Booking", bookingSchema);