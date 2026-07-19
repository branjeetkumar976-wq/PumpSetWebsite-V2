// =====================================================
// RK PUMP WEBSITE
// script.js
// =====================================================


// ================= REGISTER =================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const data = {

            name: document.getElementById("name").value.trim(),

            mobile: document.getElementById("mobile").value.trim(),

            password: document.getElementById("password").value.trim()

        };

        try {

            const res = await fetch("/api/customer/register", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(data)

            });

            const result = await res.json();

            document.getElementById("msg").innerHTML = result.message;

            if (result.success) {

                registerForm.reset();

            }

        } catch (err) {

            console.log(err);

        }

    });

}



// ================= LOGIN =================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const data = {

            mobile: document.getElementById("mobile").value.trim(),

            password: document.getElementById("password").value.trim()

        };

        try {

            const res = await fetch("/api/customer/login", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(data)

            });

            const result = await res.json();

            document.getElementById("msg").innerHTML = result.message;

            if (result.success) {

                localStorage.setItem(

                    "customer",

                    JSON.stringify(result.customer)

                );

                window.location.href = "dashboard.html";

            }

        } catch (err) {

            console.log(err);

        }

    });

}



// ================= DASHBOARD =================

const welcome = document.getElementById("welcome");

if (welcome) {

    const customer = JSON.parse(localStorage.getItem("customer"));

    if (!customer) {

        window.location.href = "login.html";

    }

    welcome.innerHTML = "👤 Welcome " + customer.name;

    document.getElementById("mobile").innerHTML = customer.mobile;

    const hours = document.getElementById("hours");

    const amount = document.getElementById("amount");

    amount.innerHTML = "50";

    hours.addEventListener("change", () => {

        amount.innerHTML = Number(hours.value) * 50;

    });

    loadWallet();

}
// ================= LOGOUT =================

function logout() {

    localStorage.removeItem("customer");

    window.location.href = "login.html";

}


// ================= BOOK PUMP =================

const bookBtn = document.getElementById("bookBtn");

if (bookBtn) {

    bookBtn.addEventListener("click", async () => {

        const customer = JSON.parse(localStorage.getItem("customer"));

        if (!customer) return;

        const hours = Number(document.getElementById("hours").value);
        if (hours === 0 && document.getElementById("walletTime").innerHTML === "00:00:00") {

    document.getElementById("msg").innerHTML =
    "❌ Wallet में Time नहीं है, Hour चुनें।";

    return;

}
        try {

            const res = await fetch("/api/booking/book", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    customerId: customer._id,

                    hours: hours,

                    amount: hours * 50

                })

            });

            const result = await res.json();

            document.getElementById("msg").innerHTML = result.message;

            if (result.success) {

                document.getElementById("hours").value = "1";

                document.getElementById("amount").innerHTML = "50";

                loadPumpStatus();

                loadWallet();

                loadLiveStatus();

            }

        } catch (err) {

            console.log(err);

        }

    });

}



// ================= FINISH =================

const finishBtn = document.getElementById("finishBtn");

if (finishBtn) {

    finishBtn.addEventListener("click", async () => {

        const customer = JSON.parse(localStorage.getItem("customer"));

        if (!customer) return;

        const ok = confirm("क्या आप सिंचाई समाप्त करना चाहते हैं?");

        if (!ok) return;

        try {

            const res = await fetch(

                "/api/booking/finish/" + customer._id,

                {

                    method: "PUT"

                }

            );

            const result = await res.json();

            document.getElementById("msg").innerHTML = result.message;

            loadPumpStatus();

            loadWallet();

            loadLiveStatus();

        } catch (err) {

            console.log(err);

        }

    });

}
// ================= PUMP STATUS =================

async function loadPumpStatus() {

    const customer = JSON.parse(localStorage.getItem("customer"));

    if (!customer) return;

    try {

        const res = await fetch("/api/booking/status/" + customer._id);

        const booking = await res.json();

        if (!booking) return;

        const pumpStatus = document.getElementById("pumpStatus");
        const statusMsg = document.getElementById("statusMsg");

        if (booking.status === "Pending") {

            pumpStatus.innerHTML = "🟡 Waiting";
            pumpStatus.style.color = "orange";
            statusMsg.innerHTML = "आपकी Booking Queue में है।";

        } else if (booking.status === "Running") {

            pumpStatus.innerHTML = "🟢 Pump Running";
            pumpStatus.style.color = "green";
            statusMsg.innerHTML = "💧 आपकी सिंचाई चल रही है।";

        } else if (booking.status === "Completed") {

            pumpStatus.innerHTML = "🔴 सिंचाई समाप्त";
            pumpStatus.style.color = "red";
            statusMsg.innerHTML = "🌾 आपकी सिंचाई पूरी हो गई।";

        }

    } catch (err) {

        console.log(err);

    }

}


/// ================= LIVE STATUS =================

let timer = null;

async function loadLiveStatus() {

    const customer = JSON.parse(localStorage.getItem("customer"));

    if (!customer) return;

    try {

        const res = await fetch("/api/booking/live/" + customer._id);

        const data = await res.json();

        if (!data.success) return;

        // ===== DEBUG =====
        console.log(
            "Live:",
            data.startTime,
            data.endTime,
            data.remainingSeconds
        );

        document.getElementById("runningFarmer").innerHTML =
            data.runningFarmer;

        document.getElementById("myStatus").innerHTML =
            data.myStatus;

        document.getElementById("queuePosition").innerHTML =
            data.queuePosition;

        // Pump Running
        if (data.startTime && data.endTime) {

            updateWalletTimer(data.endTime);

        } else {

            if (walletTimer) {
                clearInterval(walletTimer);
                walletTimer = null;
            }

        }

    } catch (err) {

        console.log(err);

    }

}


// ================= TIME FORMAT =================

function secToTime(sec) {

    sec = Number(sec);

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    return String(h).padStart(2, "0") + ":" +
           String(m).padStart(2, "0") + ":" +
           String(s).padStart(2, "0");

}


// ================= WALLET =================

async function loadWallet() {

    const customer = JSON.parse(localStorage.getItem("customer"));

    if (!customer) return;

    try {

        const res = await fetch("/api/wallet/" + customer._id);

        const result = await res.json();

        const live = await fetch("/api/booking/live/" + customer._id);
        const liveData = await live.json();

        if (result.success) {

    console.log("Wallet API =", result.walletSeconds);

    if (!liveData.startTime) {

        document.getElementById("walletTime").innerHTML =
            secToTime(result.walletSeconds);

    }

    document.getElementById("totalPurchased").innerHTML =
        secToTime(result.totalPurchasedSeconds);

    document.getElementById("totalUsed").innerHTML =
        secToTime(result.totalUsedSeconds);
}
    } catch (err) {

        console.log(err);

    }

}
// ================= ADD TIME =================

const addTimeBtn = document.getElementById("addTimeBtn");

if (addTimeBtn) {

    addTimeBtn.addEventListener("click", async () => {

        const customer = JSON.parse(localStorage.getItem("customer"));

        const hours = Number(document.getElementById("addHours").value);

        try {

            const res = await fetch("/api/booking/add-time", {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    customerId: customer._id,
                    hours: hours

                })

            });

            const result = await res.json();

            document.getElementById("addMsg").innerHTML =
                result.message;

            if (result.success) {

                loadWallet();
                loadPumpStatus();
                loadLiveStatus();

            }

        } catch (err) {

            console.log(err);

        }

    });

}


// ================= AUTO REFRESH =================

if (document.getElementById("pumpStatus")) {

    loadPumpStatus();

    loadLiveStatus();

    loadWallet();

    setInterval(loadPumpStatus, 5000);

    setInterval(loadLiveStatus, 5000);

    setInterval(loadWallet, 5000);

}
// =====================================================
// RK PUMP FINAL STARTUP
// =====================================================

window.addEventListener("load", () => {

    const customer = JSON.parse(localStorage.getItem("customer"));

    // Dashboard पर ही Run होगा
    if (customer && document.getElementById("welcome")) {

        console.log("✅ Dashboard Loaded");

        loadWallet();

        loadPumpStatus();

        loadLiveStatus();

    }

});


/// ================= WALLET TIMER =================

let walletTimer = null;

function updateWalletTimer(endTime) {

    if (walletTimer) clearInterval(walletTimer);

    walletTimer = setInterval(() => {

        let diff = new Date(endTime) - new Date();

        if (diff <= 0) {
            clearInterval(walletTimer);
            document.getElementById("walletTime").innerHTML = "00:00:00";
            return;
        }

        document.getElementById("walletTime").innerHTML =
            secToTime(Math.floor(diff / 1000));

    }, 1000);

}

// =====================================================
// AUTO REFRESH
// =====================================================

setInterval(() => {

    const customer = JSON.parse(localStorage.getItem("customer"));

    if (!customer) return;

    if (document.getElementById("welcome")) {

        loadWallet();

        loadPumpStatus();

        loadLiveStatus();

    }

}, 5000);