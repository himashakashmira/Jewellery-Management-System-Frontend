// js/reports.js — Financial Analytics & Sales Ledger Engine for AURUM Boutique
// Fully connected to database: Live Order Reporting, Sales Ledger, and Printable Invoices

var allOrdersData = [];

$(document).ready(function () {
    // 1. Guard authentication
    if (typeof guardAuth === "function") {
        guardAuth();
    }

    // 2. Fetch live metrics and sales ledger from database
    loadExecutiveAnalytics();
    loadSalesLedger();
    fetchHeaderRate();
});

// ─── 1. Header Gold Spot Rate ────────────────────────────────────────────────
function fetchHeaderRate() {
    $.ajax({
        url: BASE_URL + "/gold-rates/latest",
        method: "GET",
        headers: { "Authorization": "Bearer " + (localStorage.getItem("token") || "") },
        success: function (res) {
            if (res && res.rate22K) {
                $("#header-spot-rate").text("Rs. " + Number(res.rate22K).toLocaleString("en-LK") + " / g");
            }
        }
    });
}

// ─── 2. Executive Analytics Summary Cards ────────────────────────────────────
function loadExecutiveAnalytics() {
    var token = localStorage.getItem("token") || "";

    $.ajax({
        url: BASE_URL + "/orders/report",
        method: "GET",
        headers: { "Authorization": "Bearer " + token },
        success: function (report) {
            if (!report) return;

            var gross = report.grossRevenue || 0;
            var aov = report.averageOrderValue || 0;
            var count = report.totalOrders || 0;
            var items = report.totalItemsSold || 0;

            $("#metric-gross-revenue").text(formatLKR(gross));
            $("#metric-aov").text(formatLKR(aov));
            $("#metric-orders-count").text(count + " Orders");
            $("#metric-items-sold").text(items + " Pieces");

            console.log("[Reports] Executive metrics loaded:", report);
        },
        error: function () {
            // Fallback: calculate from /orders/stats
            $.ajax({
                url: BASE_URL + "/orders/stats",
                method: "GET",
                headers: { "Authorization": "Bearer " + token },
                success: function (stats) {
                    var total = stats.totalSales || 0;
                    var count = stats.orderCount || 0;
                    var aov = count > 0 ? (total / count) : 0;

                    $("#metric-gross-revenue").text(formatLKR(total));
                    $("#metric-aov").text(formatLKR(aov));
                    $("#metric-orders-count").text(count + " Orders");
                }
            });
        }
    });
}

// ─── 3. Audited Sales Ledger Table ───────────────────────────────────────────
function loadSalesLedger() {
    var tbody = $("#sales-ledger-tbody");
    tbody.html('<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:20px;color:var(--gold-primary);margin-right:8px;"></i>Loading Audited Sales Ledger from Database...</td></tr>');

    var token = localStorage.getItem("token") || "";

    $.ajax({
        url: BASE_URL + "/orders/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + token },
        success: function (orders) {
            allOrdersData = orders || [];
            tbody.empty();

            if (!orders || orders.length === 0) {
                tbody.html('<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-box-open" style="font-size:24px;margin-bottom:8px;display:block;"></i>No orders recorded yet. Complete sales in Boutique POS first.</td></tr>');
                return;
            }

            $.each(orders, function (index, o) {
                var docketCode = "#AUR-" + (new Date(o.orderDate || Date.now()).getFullYear()) + "-" + String(o.id).padStart(4, "0");
                var dateStr = formatDate(o.orderDate);
                var itemsCount = o.totalItems || (o.items ? o.items.length : 1);
                var customerName = o.customerName || "Walk-in Boutique Client";
                var contactStr = o.customerContact ? '<span style="display:block;font-size:11px;color:var(--text-muted);">' + o.customerContact + '</span>' : '';

                var row = $(
                    '<tr>' +
                        '<td><strong style="color:var(--gold-deep);font-family:monospace;font-size:13px;">' + docketCode + '</strong></td>' +
                        '<td><span style="font-size:12.5px;color:var(--text-main);font-weight:600;">' + dateStr + '</span></td>' +
                        '<td>' +
                            '<div style="font-size:13px;font-weight:700;color:var(--text-main);">' + customerName + '</div>' +
                            contactStr +
                        '</td>' +
                        '<td><span class="status-pill gold">' + itemsCount + ' Pieces</span></td>' +
                        '<td><strong style="font-family:\'Inter\',sans-serif;font-size:14px;color:var(--text-main);font-weight:800;">' + formatLKR(o.totalAmount) + '</strong></td>' +
                        '<td><span class="status-pill success"><i class="fa-solid fa-circle-check"></i> Audited</span></td>' +
                        '<td style="text-align:right;">' +
                            '<button type="button" class="btn-white-outline" style="font-size:11.5px;padding:6px 12px;gap:6px;" onclick="viewOrderDocket(' + o.id + ')" title="View & Print Invoice Receipt">' +
                                '<i class="fa-solid fa-receipt"></i> <span>Invoice Docket</span>' +
                            '</button>' +
                        '</td>' +
                    '</tr>'
                );

                tbody.append(row);
            });

            console.log("[Reports] Loaded", orders.length, "sales ledger entries from database.");
        },
        error: function (err) {
            console.error("[Reports] Failed to load sales ledger:", err.status);
            tbody.html('<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Unable to load sales ledger. Is the backend running?</td></tr>');
        }
    });
}

// ─── 4. View & Print Past Invoice Receipt Docket ─────────────────────────────
function viewOrderDocket(orderId) {
    var order = allOrdersData.find(function (x) { return x.id === orderId; });

    if (!order) {
        // If not loaded in memory, fetch directly
        $.ajax({
            url: BASE_URL + "/orders/" + orderId,
            method: "GET",
            headers: { "Authorization": "Bearer " + (localStorage.getItem("token") || "") },
            success: function (res) {
                renderDocketModal(res);
            },
            error: function () {
                alert("Order details not found.");
            }
        });
        return;
    }

    renderDocketModal(order);
}

function renderDocketModal(order) {
    var docketCode = "#AUR-" + (new Date(order.orderDate || Date.now()).getFullYear()) + "-" + String(order.id).padStart(4, "0");
    var dateFormatted = formatDate(order.orderDate);
    var customerName = order.customerName || "Walk-in Boutique Client";
    var customerContact = order.customerContact ? " &bull; " + order.customerContact : "";

    var itemsHTML = '';
    var subtotalGross = 0;

    if (order.items && order.items.length > 0) {
        $.each(order.items, function (i, item) {
            var lineTot = item.lineTotal || (item.unitPrice * item.qty);
            subtotalGross += lineTot;
            itemsHTML +=
                '<tr>' +
                    '<td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;">' +
                        '<strong>' + item.productName + '</strong>' +
                        '<div style="font-size:11px;color:var(--text-muted);">' + (item.karat || "22K Solid Gold") + '</div>' +
                    '</td>' +
                    '<td style="padding:10px 12px;text-align:center;border-bottom:1px solid #F3F4F6;">' + item.qty + '</td>' +
                    '<td style="padding:10px 12px;text-align:right;font-family:\'Inter\',sans-serif;border-bottom:1px solid #F3F4F6;">' + formatLKR(item.unitPrice) + '</td>' +
                    '<td style="padding:10px 12px;text-align:right;font-family:\'Inter\',sans-serif;font-weight:700;border-bottom:1px solid #F3F4F6;">' + formatLKR(lineTot) + '</td>' +
                '</tr>';
        });
    } else {
        subtotalGross = order.totalAmount || 0;
        itemsHTML = '<tr><td colspan="4" style="padding:14px;text-align:center;color:var(--text-muted);">Bespoke Jewellery Pieces</td></tr>';
    }

    var makingCharges = Math.round(subtotalGross * 0.08);
    var discount = order.discount || 0;
    var grandTotal = order.totalAmount || (subtotalGross + makingCharges - discount);

    var container = document.getElementById("docketModalBody");
    container.innerHTML =
        '<div class="printable-invoice-docket" style="background:#FFF;padding:10px;">' +
            '<!-- Brand Header -->' +
            '<div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1.5px dashed var(--border-gold);">' +
                '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;">' +
                    '<i class="fa-solid fa-crown" style="color:var(--gold-primary);font-size:18px;"></i>' +
                    '<h2 class="font-serif" style="font-size:22px;letter-spacing:0.1em;margin:0;">AURUM JEWELS</h2>' +
                '</div>' +
                '<p style="font-size:11.5px;color:var(--text-muted);margin:2px 0;">Flagship Boutique &bull; 48 Galle Face Court, Colombo 03</p>' +
                '<p style="font-size:11px;color:var(--text-muted);margin:0;">Official Tax Docket: <strong>' + docketCode + '</strong> &bull; ' + dateFormatted + '</p>' +
            '</div>' +

            '<!-- Patron Info -->' +
            '<div style="background:#FAF9F6;padding:12px 16px;border-radius:8px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;font-size:12.5px;">' +
                '<div>' +
                    '<span style="font-size:10.5px;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;">Patron Docket</span>' +
                    '<strong style="font-size:13.5px;color:var(--text-main);">' + customerName + '</strong>' +
                    '<span style="color:var(--text-muted);font-size:11.5px;">' + customerContact + '</span>' +
                '</div>' +
                '<div style="text-align:right;">' +
                    '<span style="font-size:10.5px;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;">Register Status</span>' +
                    '<span class="status-pill success" style="font-size:11px;"><i class="fa-solid fa-check"></i> Paid & Settled</span>' +
                '</div>' +
            '</div>' +

            '<!-- Itemized Table -->' +
            '<table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:18px;">' +
                '<thead>' +
                    '<tr style="background:#F9FAFB;border-bottom:1px solid #E5E7EB;color:var(--text-muted);text-transform:uppercase;font-size:10.5px;">' +
                        '<th style="padding:8px 12px;text-align:left;">Piece Description</th>' +
                        '<th style="padding:8px 12px;text-align:center;">Qty</th>' +
                        '<th style="padding:8px 12px;text-align:right;">Rate</th>' +
                        '<th style="padding:8px 12px;text-align:right;">Amount</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' + itemsHTML + '</tbody>' +
            '</table>' +

            '<!-- Financial Breakdown -->' +
            '<div style="border-top:1.5px dashed var(--border-gold);padding-top:14px;margin-bottom:16px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px;color:var(--text-muted);">' +
                    '<span>Subtotal Gross:</span>' +
                    '<strong style="font-family:\'Inter\',sans-serif;color:var(--text-main);">' + formatLKR(subtotalGross) + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px;color:var(--text-muted);">' +
                    '<span>Wastage & Making Charges (8%):</span>' +
                    '<span style="font-family:\'Inter\',sans-serif;">' + formatLKR(makingCharges) + '</span>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:6px;border-top:2px solid #141518;align-items:baseline;">' +
                    '<span style="font-size:13px;font-weight:800;text-transform:uppercase;">Grand Total Paid:</span>' +
                    '<strong style="font-family:\'Inter\',sans-serif;font-size:24px;font-weight:800;color:var(--gold-deep);">' + formatLKR(grandTotal) + '</strong>' +
                '</div>' +
            '</div>' +

            '<!-- Footer Notice -->' +
            '<div style="text-align:center;font-size:11px;color:var(--text-muted);padding-top:8px;">' +
                'Thank you for your esteemed patronage &bull; Certified Authentic Atelier Craftsmanship' +
            '</div>' +
        '</div>';

    document.getElementById("receiptDocketModal").style.display = "flex";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(dStr) {
    if (!dStr) return "Today";
    var d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString("en-LK", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }) + " " + d.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" });
}

// Expose globals
window.viewOrderDocket = viewOrderDocket;
window.loadSalesLedger = loadSalesLedger;
