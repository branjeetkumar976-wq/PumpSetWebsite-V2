const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

// ================= REGISTER =================

router.post("/register", async (req, res) => {

    try {

        const { name, mobile, password } = req.body;

        // Mobile Already Exists
        const exist = await Customer.findOne({ mobile });

        if (exist) {
            return res.json({
                success: false,
                message: "Mobile Number Already Registered"
            });
        }

        const customer = new Customer({
            name,
            mobile,
            password
        });

        await customer.save();

        res.json({
            success: true,
            message: "Customer Registered Successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// ================= LOGIN =================

router.post("/login", async (req, res) => {

    try {

        const { mobile, password } = req.body;

        const customer = await Customer.findOne({
            mobile,
            password
        });

        if (!customer) {

            return res.json({
                success: false,
                message: "Invalid Mobile or Password"
            });

        }

        res.json({
            success: true,
            message: "Login Successful",
            customer
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
// ================= FORGOT PASSWORD =================

router.post("/forgot-password", async (req, res) => {

    try {

        const { mobile } = req.body;

        const customer = await Customer.findOne({ mobile });

        if (!customer) {
            return res.json({
                success: false,
                message: "Mobile Number Not Found"
            });
        }

        res.json({
            success: true,
            message: "OTP feature coming soon"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
// ================= RESET PASSWORD =================

router.post("/reset-password", async (req, res) => {

    try {

        const { mobile, password } = req.body;

        const customer = await Customer.findOne({ mobile });

        if (!customer) {

            return res.json({

                success: false,

                message: "Mobile Number Not Found"

            });

        }

        customer.password = password;

        await customer.save();

        res.json({

            success: true,

            message: "Password Changed Successfully"

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

module.exports = router;