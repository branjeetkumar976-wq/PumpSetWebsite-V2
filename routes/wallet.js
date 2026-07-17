const express = require("express");
const router = express.Router();

const Customer = require("../models/customer");

// ================= RECHARGE WALLET =================

router.post("/recharge", async (req, res) => {

    try {

        const { customerId, hours } = req.body;

        const customer = await Customer.findById(customerId);

        if (!customer) {

            return res.json({
                success: false,
                message: "Customer Not Found"
            });

        }

        const seconds = Number(hours) * 3600;

        customer.walletSeconds += seconds;
        customer.totalPurchasedSeconds += seconds;

        await customer.save();

        res.json({
            success: true,
            message: "✅ Wallet Recharge Successful",
            walletSeconds: customer.walletSeconds
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
// ================= WALLET INFO =================

router.get("/:customerId", async (req, res) => {

    try {

        const customer = await Customer.findById(req.params.customerId);

        if (!customer) {

            return res.json({
                success: false,
                message: "Customer Not Found"
            });

        }

        res.json({

            success: true,

            walletSeconds: customer.walletSeconds,

            totalPurchasedSeconds: customer.totalPurchasedSeconds,

            totalUsedSeconds: customer.totalUsedSeconds

        });

       

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});
module.exports = router;