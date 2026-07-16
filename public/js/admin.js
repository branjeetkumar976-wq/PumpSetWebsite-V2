// ================= LOAD ADMIN DASHBOARD =================

async function loadAdmin() {

    try {

        // ================= SUMMARY =================

        const summaryRes = await fetch("/api/admin/summary");
        const summary = await summaryRes.json();

        if (summary.success) {

            document.getElementById("runningCount").innerHTML = summary.running;
            document.getElementById("pendingCount").innerHTML = summary.pending;
            document.getElementById("completedCount").innerHTML = summary.completed;
            document.getElementById("todayIncome").innerHTML = summary.todayIncome;

        }

        // ================= RUNNING =================

        const liveRes = await fetch("/api/admin/running");
        const live = await liveRes.json();

        if (live.success && live.booking) {

            document.getElementById("runningFarmer").innerHTML = live.booking.farmerName;

            document.getElementById("runningMobile").innerHTML =
                live.booking.customerId ? live.booking.customerId.mobile : "-";

            updateTimer(live.booking.endTime);

        } else {

            document.getElementById("runningFarmer").innerHTML = "None";
            document.getElementById("runningMobile").innerHTML = "-";
            document.getElementById("runningTime").innerHTML = "00:00:00";

        }

        // ================= QUEUE =================

        const queueRes = await fetch("/api/admin/queue");
        const queue = await queueRes.json();

        const queueTable = document.getElementById("queueTable");
        queueTable.innerHTML = "";

        queue.bookings.forEach(item => {

            queueTable.innerHTML += `
            <tr>
                <td>${item.farmerName}</td>
                <td>${item.hours}</td>
            </tr>`;

        });

        // ================= BOOKINGS =================

        const bookingRes = await fetch("/api/admin/bookings");
        const bookingData = await bookingRes.json();

        const bookingTable = document.getElementById("bookingTable");
        bookingTable.innerHTML = "";

        bookingData.bookings.forEach(item => {

            bookingTable.innerHTML += `
            <tr>
                <td>${item.farmerName}</td>
                <td>${item.hours}</td>
                <td>${item.status}</td>
                <td>
                    <button
                        onclick="finishPump('${item._id}')"
                        style="background:red;color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;">
                        🌾 Finish सिंचाई
                    </button>
                </td>
            </tr>`;

        });

        // ================= CUSTOMERS =================

        const customerRes = await fetch("/api/admin/customers");
        const customerData = await customerRes.json();

        const customerTable = document.getElementById("customerTable");
        customerTable.innerHTML = "";

        customerData.customers.forEach(c => {

            customerTable.innerHTML += `
            <tr>
                <td>${c.name}</td>
                <td>${c.mobile}</td>
                <td>${secToTime(c.walletSeconds || 0)}</td>
            </tr>`;

        });

    } catch (err) {

        console.log(err);

    }

}

// ================= FINISH PUMP =================

async function finishPump(id) {

    if (!confirm("क्या आप सिंचाई समाप्त करना चाहते हैं?")) return;

    const res = await fetch("/api/admin/finish/" + id, {
        method: "PUT"
    });

    const result = await res.json();

    alert(result.message);

    loadAdmin();

}

// ================= TIMER =================

function updateTimer(endTime) {

    if (!endTime) {

        document.getElementById("runningTime").innerHTML = "00:00:00";
        return;

    }

    let diff = new Date(endTime) - new Date();

    if (diff < 0) diff = 0;

    const h = Math.floor(diff / 1000 / 3600);
    const m = Math.floor((diff / 1000 % 3600) / 60);
    const s = Math.floor(diff / 1000 % 60);

    document.getElementById("runningTime").innerHTML =
        String(h).padStart(2, "0") + ":" +
        String(m).padStart(2, "0") + ":" +
        String(s).padStart(2, "0");

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

// ================= AUTO REFRESH =================

loadAdmin();
setInterval(loadAdmin, 5000);
// ================= TEST START =================

const testStartBtn = document.getElementById("testStartBtn");

if (testStartBtn) {

    testStartBtn.addEventListener("click", async () => {

        const res = await fetch("/api/admin/test-start", {

            method: "PUT"

        });

        const result = await res.json();

        document.getElementById("testMsg").innerHTML = result.message;

        loadAdmin();

    });

}

// ================= TEST STOP =================

const testStopBtn = document.getElementById("testStopBtn");

if (testStopBtn) {

    testStopBtn.addEventListener("click", async () => {

        const res = await fetch("/api/admin/test-stop", {

            method: "PUT"

        });

        const result = await res.json();

        document.getElementById("testMsg").innerHTML = result.message;

        loadAdmin();

    });

}