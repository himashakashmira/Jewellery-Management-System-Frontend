// js/dashboard.js — Live API integration for AURUM Management Dashboard

$(document).ready(function () {
    guardAuth();
    // Show loading placeholders
    setLoadingState();
    // Fire all data fetches in parallel
    fetchGoldRates();
    fetchOrderStats();
    fetchRepairStats();
    fetchPatronCount();
});

// ─── Loading State ────────────────────────────────────────────────────────────

function setLoadingState() {
    $('#rate-22k, #rate-24k, #ticker-rate-22k').text('—');
    $('#rate-22k-gram, #rate-24k-gram').text('Loading...');
    $('#stat-sales').text('Rs. 0.00');
    $('#stat-orders-count').text('— Orders');
    $('#stat-repairs').text('—');
    $('#stat-patrons-count').text('—');
}

// ─── 1. Gold Rates ────────────────────────────────────────────────────────────

function fetchGoldRates() {
    apiFetch("/gold-rates/latest")
        .done(function (res) {
            const rate22k = res.rate22K || 0;
            const rate24k = res.rate24K || 0;

            // Main metric cards
            $('#rate-22k').text(formatLKR(rate22k));
            $('#rate-24k').text(formatLKR(rate24k));

            // Per-gram breakdown
            const perGram22k = rate22k / 8; // rate22K is typically per-8g sovereign
            const perGram24k = rate24k / 8;
            $('#rate-22k-gram').text(formatLKR(perGram22k) + ' / gram');
            $('#rate-24k-gram').text(formatLKR(perGram24k) + ' / gram');

            // Header ticker
            $('#ticker-rate-22k').text(formatLKR(rate22k));

            // Market date
            if (res.updatedAt) {
                const d = new Date(res.updatedAt);
                $('#market-date').text(d.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' }));
            }
        })
        .fail(function (err) {
            console.error("Failed to fetch gold rates:", err.status, err.statusText);
            $('#rate-22k, #rate-24k').text('N/A');
        });
}

// ─── 2. Order Stats ───────────────────────────────────────────────────────────

function fetchOrderStats() {
    apiFetch("/orders/stats")
        .done(function (res) {
            const totalSales = res.totalSales || 0;
            const orderCount = res.orderCount || 0;

            $('#stat-sales').text(formatLKR(totalSales));
            $('#stat-orders-count').text(orderCount + ' Invoiced Orders');
        })
        .fail(function (err) {
            console.error("Failed to fetch order stats:", err.status, err.statusText);
            $('#stat-sales').text('Rs. 0.00');
            $('#stat-orders-count').text('0 Orders');
        });
}

// ─── 3. Repair Stats ──────────────────────────────────────────────────────────

function fetchRepairStats() {
    apiFetch("/repairs/stats")
        .done(function (res) {
            const total = res.totalRepairs || 0;
            $('#stat-repairs').text(total + (total === 1 ? ' Order' : ' Orders'));

            // Update repairs page metrics if those elements exist
            if ($('#stat-repairs-ready').length) {
                $('#stat-repairs-ready').text((res.readyCount || 0) + ' Masterpieces');
            }
            if ($('#stat-repairs-crafting').length) {
                $('#stat-repairs-crafting').text((res.craftingCount || 0) + ' on Bench');
            }
            if ($('#stat-repairs-revenue').length) {
                $('#stat-repairs-revenue').text(formatLKR(res.totalRevenue || 0));
            }
        })
        .fail(function (err) {
            console.error("Failed to fetch repair stats:", err.status, err.statusText);
            $('#stat-repairs').text('0 Orders');
        });
}

// ─── 4. Patron Count ─────────────────────────────────────────────────────────

function fetchPatronCount() {
    apiFetch("/customers/count")
        .done(function (count) {
            $('#stat-patrons-count').text(count + ' Patrons');
        })
        .fail(function (err) {
            console.error("Failed to fetch patron count:", err.status, err.statusText);
            $('#stat-patrons-count').text('0 Patrons');
        });
}