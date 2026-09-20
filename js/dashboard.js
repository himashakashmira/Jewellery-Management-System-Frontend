// js/dashboard.js — Live API integration for AURUM Management Dashboard
// Student style: simple jQuery AJAX, one function per action

$(document).ready(function () {
    // guard: redirect to login if no token
    guardAuth();

    // show dash placeholders while loading real data
    setLoadingState();

    // fire all four data fetches in parallel
    fetchGoldRates();
    fetchOrderStats();
    fetchInventoryCount();
    fetchPatronCount();
});

// ─── Loading Placeholders (shown while API calls are in-flight) ───────────────
function setLoadingState() {
    // show dashes so user knows data is coming
    $("#rate-22k, #rate-24k, #ticker-rate-22k").text("—");
    $("#rate-22k-gram, #rate-24k-gram").text("Loading...");
    $("#stat-sales").text("Rs. 0.00");
    $("#stat-orders-count").text("— Orders");
    $("#stat-vault").text("—");
    $("#stat-vault-val").text("Counting...");
    $("#stat-patrons-count").text("—");
}

// ─── Fade-in Helper (subtle animation when real data arrives) ─────────────────
function fadeInUpdate($el, newText) {
    // fade out, update text, fade back in
    $el.animate({ opacity: 0 }, 180, function () {
        $(this).text(newText).animate({ opacity: 1 }, 280);
    });
}

// ─── 1. Gold Rates — GET /gold-rates/latest ───────────────────────────────────
function fetchGoldRates() {
    // calling the gold rates api
    $.ajax({
        url: BASE_URL + "/gold-rates/latest",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (res) {
            // backend stores rate22K as per-gram value (e.g. 43375)
            var gramRate22 = res.rate22K || 0;
            var gramRate24 = res.rate24K || 0;

            // 1 sovereign = 8 grams, so sovereign price = per-gram × 8
            var sovereignRate22 = gramRate22 * 8;
            var sovereignRate24 = gramRate24 * 8;

            // updating 22K sovereign card with real value
            fadeInUpdate($("#rate-22k"), "Rs. " + sovereignRate22.toLocaleString("en-LK"));
            fadeInUpdate($("#rate-22k-gram"), "Rs. " + gramRate22.toLocaleString("en-LK") + " / gram");

            // updating 24K sovereign card with real value
            fadeInUpdate($("#rate-24k"), "Rs. " + sovereignRate24.toLocaleString("en-LK"));
            fadeInUpdate($("#rate-24k-gram"), "Rs. " + gramRate24.toLocaleString("en-LK") + " / gram");

            // update header ticker with live 22K sovereign rate
            $("#ticker-rate-22k").text("Rs. " + sovereignRate22.toLocaleString("en-LK"));

            // update market date if element exists on page
            if (res.updatedAt && $("#market-date").length) {
                var d = new Date(res.updatedAt);
                $("#market-date").text(d.toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" }));
            }

            console.log("[Dashboard] Gold rates loaded. 22K gram:", gramRate22, "| 24K gram:", gramRate24);
        },
        error: function (err) {
            // if no rates set yet, show placeholder
            console.error("[Dashboard] Failed to fetch gold rates:", err.status, err.statusText);
            $("#rate-22k, #rate-24k").text("Not Set");
            $("#rate-22k-gram, #rate-24k-gram").text("Set a rate first");
        }
    });
}

// ─── 2. Order / Sales Stats — GET /orders/stats ───────────────────────────────
function fetchOrderStats() {
    // calling the order stats api
    $.ajax({
        url: BASE_URL + "/orders/stats",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (res) {
            var totalSales  = res.totalSales  || 0;
            var orderCount  = res.orderCount  || 0;

            // updating today's total sales card with real revenue
            fadeInUpdate($("#stat-sales"), formatLKR(totalSales));
            fadeInUpdate($("#stat-orders-count"), orderCount + " Invoiced Orders");

            console.log("[Dashboard] Order stats loaded. Sales:", totalSales, "| Count:", orderCount);
        },
        error: function (err) {
            console.error("[Dashboard] Failed to fetch order stats:", err.status, err.statusText);
            // show zero on failure — keep UI stable
            $("#stat-sales").text("Rs. 0.00");
            $("#stat-orders-count").text("0 Orders");
        }
    });
}

// ─── 3. Inventory Count — GET /inventory/all ─────────────────────────────────
function fetchInventoryCount() {
    // calling the inventory api to count real stock pieces
    $.ajax({
        url: BASE_URL + "/inventory/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (products) {
            var count = (products && products.length) ? products.length : 0;

            // updating vault holdings card with real piece count
            fadeInUpdate($("#stat-vault"), count + " Pieces");

            // show estimated value badge using count (no per-item price available here)
            fadeInUpdate($("#stat-vault-val"), count + " SKUs In-Stock");

            console.log("[Dashboard] Inventory count loaded:", count, "pieces");
        },
        error: function (err) {
            console.error("[Dashboard] Failed to fetch inventory:", err.status, err.statusText);
            $("#stat-vault").text("0 Pieces");
            $("#stat-vault-val").text("0 SKUs");
        }
    });
}

// ─── 4. Patron Count — GET /customers/count ───────────────────────────────────
function fetchPatronCount() {
    // calling the customer count api
    $.ajax({
        url: BASE_URL + "/customers/count",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (count) {
            var patronCount = count || 0;

            // updating patrons sub-label in vault card
            fadeInUpdate($("#stat-patrons-count"), patronCount + " Patrons");

            console.log("[Dashboard] Patron count loaded:", patronCount);
        },
        error: function (err) {
            console.error("[Dashboard] Failed to fetch patron count:", err.status, err.statusText);
            $("#stat-patrons-count").text("0 Patrons");
        }
    });
}