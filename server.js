const walletRoutes = require("./routes/wallet");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const pumpRoutes = require("./routes/pump");
const app = express();

// Database Connect
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes
app.use("/api/customer", require("./routes/customer"));
app.use("/api/booking", require("./routes/booking"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/wallet", walletRoutes);
app.use("/api/pump", pumpRoutes);
// Home
app.get("/", (req, res) => {
    res.send("🚰 RK Pump Control Server Running...");
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 RK PUMP SERVER UPDATED");
});