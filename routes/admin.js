
const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");
const Customer = require("../models/customer");

// ================= GET ALL BOOKINGS =================

router.get("/bookings", async (req, res) => {

    try {

        const bookings = await Booking.find()
            .populate("customerId", "name mobile")
            .sort({ bookingDate: 1 });

        res.json({
            success: true,
            bookings
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ================= FINISH PUMP =================

router.put("/finish/:id", async (req, res) => {

    try {

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.json({
                success: false,
                message: "Booking Not Found"
            });
        }

        booking.remainingSeconds = Math.max(
    0,
    Math.floor((new Date(booking.endTime) - new Date()) / 1000)
);

booking.startTime = null;
booking.endTime = null;

booking.status = "Completed";

await booking.save();
        

        // अगली Pending Booking को केवल Running बनाओ
// Pump अपने आप Start नहीं होगा

const next = await Booking.findOne({
    status: "Pending"
}).sort({ bookingDate: 1 });

if (next) {

    next.status = "Running";

    // Timer अभी Start मत करो
    next.startTime = null;
    next.endTime = null;

    await next.save();

}

        res.json({
            success: true,
            message: "🌾 सिंचाई समाप्त हो गई।"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
// ================= ADMIN SUMMARY =================

router.get("/summary", async (req, res) => {

    try {

        const running = await Booking.countDocuments({
            status: "Running"
        });

        const pending = await Booking.countDocuments({
            status: "Pending"
        });

        const completed = await Booking.countDocuments({
            status: "Completed"
        });

        const income = await Booking.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        res.json({
            success: true,
            running,
            pending,
            completed,
            todayIncome: income.length ? income[0].total : 0
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
// ================= RUNNING PUMP =================

router.get("/running", async (req, res) => {

    try {

        const booking = await Booking.findOne({
            status: "Running"
        }).populate("customerId", "name mobile");

        res.json({
            success: true,
            booking
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
// ================= WAITING QUEUE =================

router.get("/queue", async (req, res) => {

    try {

        const bookings = await Booking.find({
            status: "Pending"
        }).sort({
            bookingDate: 1
        });

        res.json({
            success: true,
            bookings
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
// ================= GET ALL CUSTOMERS =================

router.get("/customers", async (req, res) => {

    try {

        const customers = await Customer.find().sort({ name: 1 });

        res.json({
            success: true,
            customers
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// ================= TEST PUMP START =================

router.put("/test-start", async (req, res) => {

    try {

        const booking = await Booking.findOne({
            status: "Running"
        });

        if (!booking) {

            return res.json({
                success: false,
                message: "No Running Booking"
            });

        }

        // अगर Pump पहले से चालू है
        if (booking.startTime && booking.endTime) {

            return res.json({
                success: true,
                message: "Pump Already Running"
            });

        }

        console.log("========== TEST START ==========");
        console.log("TOTAL :", booking.totalSeconds);
        console.log("REM   :", booking.remainingSeconds);

        // Pump Start
        booking.startTime = new Date();

        let seconds = 0;

        if (booking.remainingSeconds > 0) {

            // Stop के बाद Resume
            seconds = booking.remainingSeconds;

        } else {

            // पहली बार Start
            seconds = booking.totalSeconds;
            booking.remainingSeconds = booking.totalSeconds;

        }

        console.log("START FROM :", seconds);

        booking.endTime = new Date(
            Date.now() + seconds * 1000
        );

        console.log("END TIME :", booking.endTime);

        await booking.save();

        res.json({

            success: true,
            message: "✅ TEST Pump Started",
            remainingSeconds: seconds

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

/// ================= TEST PUMP STOP =================

router.put("/test-stop", async (req, res) => {

    try {

        const booking = await Booking.findOne({
            status: "Running"
        });

        if (!booking) {

            return res.json({
                success: false,
                message: "Running Booking Not Found"
            });

        }

        // ===== DEBUG =====
        console.log("========== TEST STOP ==========");
        console.log("END TIME :", booking.endTime);
        console.log("NOW      :", new Date());
        console.log("TOTAL    :", booking.totalSeconds);
        console.log("OLD REM  :", booking.remainingSeconds);

        // बचा हुआ समय निकालो
        const remaining = Math.max(
            0,
            Math.floor(
                (new Date(booking.endTime).getTime() - Date.now()) / 1000
            )
        );

        console.log("NEW REM  :", remaining);

        // Booking Update
        booking.remainingSeconds = remaining;
        booking.totalSeconds = remaining;
        booking.startTime = null;
        booking.endTime = null;

        await booking.save();

        // Customer Wallet Update
        const customer = await Customer.findById(booking.customerId);

        if (customer) {

            customer.walletSeconds = remaining;

            await customer.save();

            console.log("CUSTOMER WALLET :", customer.walletSeconds);

        }

        console.log("SAVED REM :", booking.remainingSeconds);
        console.log("===============================");

        res.json({

            success: true,
            message: "🛑 TEST Pump STOP",
            remainingSeconds: remaining

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;