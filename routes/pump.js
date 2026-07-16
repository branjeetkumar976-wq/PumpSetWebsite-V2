const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");

// Pump Status
router.get("/status", async (req, res) => {

    try {

        const running = await Booking.findOne({
            status: "Running"
        });

        if (
            running &&
            running.startTime &&
            running.endTime
        ) {

            const remaining = Math.max(
                0,
                Math.floor(
                    (new Date(running.endTime) - new Date()) / 1000
                )
            );

            if (remaining > 0) {

                return res.json({
                    success: true,
                    pumpStatus: "ON"
                });

            }

        }

        res.json({
            success: true,
            pumpStatus: "OFF"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;