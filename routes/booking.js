const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");
const Customer = require("../models/customer");

// ================= BOOK PUMP =================

router.post("/book", async (req, res) => {

    try {

        const customer = await Customer.findById(req.body.customerId);
        
        if (!customer) {

            return res.json({
                success: false,
                message: "customer Not Found"
            });

        }

        // Duplicate Booking Check

        const oldBooking = await Booking.findOne({

            customerId: customer._id,

            status: { $in: ["Pending", "Running"] }

        });

        if (oldBooking) {

            return res.json({

                success: false,

                message: "❌ आपकी पहले से एक Booking चल रही है। पहले Finish सिंचाई करें या Add Time करें।"

            });

        }

        // Running Pump Check

        const runningBooking = await Booking.findOne({

            status: "Running"

        });

        const status = runningBooking ? "Pending" : "Running";

        // Purchased Time

        const purchasedSeconds = Number(req.body.hours || 0) * 3600;

        // Wallet Time

        const walletSeconds = customer.walletSeconds || 0;

        // Total Time

        const totalSeconds = purchasedSeconds + walletSeconds;

        if (totalSeconds <= 0) {

            return res.json({

                success: false,

                message: "⚠ पहले Time खरीदें या Wallet Time इस्तेमाल करें।"

            });

        }

     const booking = new Booking({

    customerId: customer._id,

    farmerName: customer.name,

    hours: Number(req.body.hours || 0),

    amount: Number(req.body.amount || 0),

    status,

    totalSeconds,

    remainingSeconds: totalSeconds,

    startTime: null,

    endTime: null,

    usedWallet: walletSeconds > 0

});

        await booking.save();
    
        // Cash से खरीदा हुआ Time पहले Wallet में जोड़ो
         customer.walletSeconds += purchasedSeconds;

          // History
        customer.totalPurchasedSeconds += purchasedSeconds;

        await customer.save();
        
        res.json({

            success: true,

            message: "✅ Pump Booked Successfully",

            status,

            totalSeconds

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});
// ================= CUSTOMER LAST BOOKING STATUS =================

router.get("/status/:customerId", async (req, res) => {

    try {

        let booking = await Booking.findOne({

            customerId: req.params.customerId,

            status: { $in: ["Running", "Pending"] }

        }).sort({ bookingDate: -1 });

        // अगर Running/Pending नहीं है, तब आखिरी Booking दिखाओ
        if (!booking) {

            booking = await Booking.findOne({

                customerId: req.params.customerId

            }).sort({ bookingDate: -1 });

        }

        res.json(booking);

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});



        
       // ================= CUSTOMER FINISH =================

     router.put("/finish/:customerId", async (req, res) => {

       try {

        const current = await Booking.findOne({

            customerId: req.params.customerId,

            status: { $in: ["Running", "Pending"] }

        }).sort({ bookingDate: -1 });

        if (!current) {

            return res.json({

                success: false,

                message: "Booking Not Found"

            });

        }

        // ================= Pending Booking =================

        if (current.status === "Pending") {

            // Pending में Pump Start नहीं हुआ,
            // इसलिए Wallet को बिल्कुल मत छुओ।

            current.startTime = null;
            current.endTime = null;
            current.status = "Completed";

            await current.save();

            // अगली Pending Booking Running करो
            const next = await Booking.findOne({
                status: "Pending"
            }).sort({ bookingDate: 1 });

            if (next) {

                next.status = "Running";
                next.startTime = null;
                next.endTime = null;

                await next.save();

            }

            return res.json({

                success: true,

                message: "🌾 Pending Booking Cancel Successfully"

            });

        }

        

       
        // ================= Running Booking Finish =================

const customer = await Customer.findById(current.customerId);

let remaining = 0;

if (!current.startTime) {

    // Pump अभी Start नहीं हुआ
    remaining = customer.walletSeconds;

} else {

    // Pump Start हो चुका है
    remaining = Math.max(
        0,
        Math.floor(
            (new Date(current.endTime) - new Date()) / 1000
        )
    );

}

customer.walletSeconds = remaining;
await customer.save();

current.remainingSeconds = remaining;
current.startTime = null;
current.endTime = null;
current.status = "Completed";

await current.save();
        // अगली Pending Booking Running

        const next = await Booking.findOne({

            status: "Pending"

        }).sort({ bookingDate: 1 });

        if (next) {

            next.status = "Running";
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
// ================= LIVE DASHBOARD STATUS =================

router.get("/live/:customerId", async (req, res) => {

    try {

        let myBooking = await Booking.findOne({
            customerId: req.params.customerId,
            status: { $in: ["Running", "Pending"] }
        }).sort({ bookingDate: -1 });

        // अगर Running/Pending नहीं मिली तो आखिरी Booking दिखाओ
        if (!myBooking) {

            myBooking = await Booking.findOne({
                customerId: req.params.customerId
            }).sort({ bookingDate: -1 });

        }

        const runningBooking = await Booking.findOne({
            status: "Running"
        });

        let queuePosition = 0;

        if (myBooking && myBooking.status === "Pending") {

            queuePosition = await Booking.countDocuments({
                status: "Pending",
                bookingDate: {
                    $lt: myBooking.bookingDate
                }
            });

            queuePosition++;

        }

        let remainingSeconds = myBooking
            ? myBooking.remainingSeconds
            : 0;

        let startTime = null;
        let endTime = null;

        if (
            myBooking &&
            myBooking.status === "Running" &&
            myBooking.startTime &&
            myBooking.endTime
        ) {

            startTime = myBooking.startTime;
            endTime = myBooking.endTime;

            remainingSeconds = Math.max(
                0,
                Math.floor(
                    (new Date(endTime) - new Date()) / 1000
                )
            );

        }

        res.json({

            success: true,

            runningFarmer: runningBooking
                ? runningBooking.farmerName
                : "कोई नहीं",

            myStatus: myBooking
                ? myBooking.status
                : "No Booking",

            queuePosition,

            remainingSeconds,

            startTime,

            endTime

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});
// ================= ADD TIME =================

router.put("/add-time", async (req, res) => {

    try {

        const { customerId, hours } = req.body;

        const booking = await Booking.findOne({

            customerId,

            status: { $in: ["Running", "Pending"] }

        }).sort({ bookingDate: -1 });

        if (!booking) {

            return res.json({

                success: false,

                message: "⚠ कोई Running/Pending Booking नहीं मिली।"

            });

        }

        const addSeconds = Number(hours) * 3600;

        booking.amount += Number(hours) * 50;

        // अगर Pump Start है तो End Time बढ़ाओ
        if (

            booking.status === "Running" &&
            booking.startTime &&
            booking.endTime

        ) {

            booking.endTime = new Date(

                booking.endTime.getTime() + addSeconds * 1000

            );

        }

        await booking.save();

        const customer = await Customer.findById(customerId);

        if (customer) {

        // Wallet में नया Time जोड़ो
        customer.walletSeconds += addSeconds;

        // History
         customer.totalPurchasedSeconds += addSeconds;

         await customer.save();

     }

        res.json({

            success: true,

            message: `✅ ${hours} Hour Successfully Added`

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});


// ================= EXPORT =================

module.exports = router;