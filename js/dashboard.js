// js/dashboard.js — Live API integration for AURUM Management Dashboard
// Student style: simple jQuery AJAX, one function per action

$(document).ready(function () {
    // guard: redirect to login if no token
    guardAuth();

    // show dash placeholders while loading real data
    setLoadingState();

    // fire all five data fetches in parallel
    fetchGoldRates();
    fetchOrderStats();
    fetchInventoryCount();
    fetchPatronCount();
    loadDashboardOrders();
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

// ─── 5. Recent Orders Ledger with Staff Approval / Admin View-Only ───────────
var _dashboardOrders = [];
var _currentDashboardFilter = 'all';

function loadDashboardOrders() {
    var token = localStorage.getItem("token") || "";

    $.ajax({
        url: BASE_URL + "/orders/all",
        method: "GET",
        headers: token ? { "Authorization": "Bearer " + token } : {},
        success: function (dbOrders) {
            syncAndRenderOrders(dbOrders || []);
        },
        error: function () {
            // Offline / local storage fallback
            syncAndRenderOrders([]);
        }
    });
}

function syncAndRenderOrders(dbOrders) {
    // Read local public orders from localStorage
    var localOrders = [];
    try {
        localOrders = JSON.parse(localStorage.getItem('aurum_orders') || '[]');
    } catch (e) {
        localOrders = [];
    }

    // Combine dbOrders with localOrders (avoiding duplicate refs)
    var merged = [...dbOrders];
    var seenRefs = new Set();
    merged.forEach(function (o) {
        if (o.orderRef) seenRefs.add(o.orderRef);
    });

    localOrders.forEach(function (lo) {
        if (!seenRefs.has(lo.orderRef)) {
            // Convert to matching schema
            merged.push({
                id: lo.id || null,
                orderRef: lo.orderRef,
                orderDate: lo.orderDate,
                customerName: lo.customerName || lo.patron || "Valued Patron",
                customerContact: lo.customerContact || "",
                deliveryAddress: lo.deliveryAddress || "",
                paymentMethod: lo.paymentMethod || "COD",
                orderType: lo.orderType || "IMITATION",
                status: lo.status || "PENDING_APPROVAL",
                totalAmount: lo.grandTotal || lo.subtotal || 0,
                totalItems: lo.items ? lo.items.reduce((s, i) => s + (i.qty || 1), 0) : 1,
                items: (lo.items || []).map(function (it) {
                    return {
                        productName: it.title || it.name || "Jewellery Piece",
                        itemType: it.itemType || "IMITATION",
                        karat: it.material || "18K PVD",
                        qty: it.qty || 1,
                        unitPrice: it.price || 0,
                        lineTotal: (it.price || 0) * (it.qty || 1)
                    };
                })
            });
            seenRefs.add(lo.orderRef);
        }
    });

    // If still empty, add default baseline mock orders for aesthetic presentation
    if (merged.length === 0) {
        merged = [
            {
                id: 991,
                orderRef: "AUR-2026-9281",
                orderDate: new Date().toISOString(),
                customerName: "Lady Vivienne De Silva",
                customerContact: "+94 77 123 4567",
                deliveryAddress: "No. 42, Queen's Road, Colombo 07",
                paymentMethod: "Cash on Delivery (COD)",
                orderType: "IMITATION",
                status: "PENDING_APPROVAL",
                totalAmount: 14500.0,
                totalItems: 1,
                items: [{ productName: "Aurelia Double-Layer Solitaire Pendant", itemType: "IMITATION", karat: "18K PVD Gold", qty: 1, unitPrice: 14500.0, lineTotal: 14500.0 }]
            },
            {
                id: 992,
                orderRef: "AUR-2026-8920",
                orderDate: new Date(Date.now() - 3600000).toISOString(),
                customerName: "Kavinda Senanayake",
                customerContact: "+94 71 987 6543",
                deliveryAddress: "Kandy Boutique Flagship Suite",
                paymentMethod: "Credit Card (•••• 4242)",
                orderType: "IMITATION",
                status: "APPROVED",
                totalAmount: 18200.0,
                totalItems: 1,
                items: [{ productName: "Soleil Hand-Hammered Sculpted Cuff", itemType: "IMITATION", karat: "18K Anti-Tarnish", qty: 1, unitPrice: 18200.0, lineTotal: 18200.0 }]
            }
        ];
    }

    _dashboardOrders = merged;

    // Update pending imitation counter badge
    var pendingImtCount = _dashboardOrders.filter(function (o) {
        return (o.orderType === 'IMITATION' || isImitationOrder(o)) && o.status === 'PENDING_APPROVAL';
    }).length;

    var badgeEl = $("#pending-imitation-counter-badge");
    if (pendingImtCount > 0) {
        $("#pending-imt-count").text(pendingImtCount);
        badgeEl.show();
    } else {
        badgeEl.hide();
    }

    renderDashboardOrders();
}

function isImitationOrder(o) {
    if (o.orderType === "IMITATION") return true;
    if (o.items && o.items.some(function (i) { return i.itemType === "IMITATION"; })) return true;
    return false;
}

function setDashboardOrderFilter(filterKey, btn) {
    _currentDashboardFilter = filterKey;
    $(".order-filter-btn").removeClass("active");
    $(btn).addClass("active");
    renderDashboardOrders();
}

function renderDashboardOrders() {
    var tbody = $("#dashboard-orders-table-body");
    tbody.empty();

    var role = localStorage.getItem("role") || "ROLE_STAFF";
    var isStaff = (role === "ROLE_STAFF");
    var isAdmin = (role === "ROLE_ADMIN");

    var filtered = _dashboardOrders.filter(function (o) {
        var isImt = isImitationOrder(o);
        var isPending = (o.status === "PENDING_APPROVAL");

        if (_currentDashboardFilter === "imitation") return isImt;
        if (_currentDashboardFilter === "pending") return isPending;
        return true; // 'all'
    });

    if (filtered.length === 0) {
        tbody.html('<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-box-open" style="font-size:24px;margin-bottom:8px;display:block;"></i>No orders found for selected filter.</td></tr>');
        return;
    }

    $.each(filtered, function (idx, o) {
        var isImt = isImitationOrder(o);
        var isPending = (o.status === "PENDING_APPROVAL");

        // Format items preview
        var firstItem = (o.items && o.items.length > 0) ? o.items[0] : { productName: "Jewellery Creation", karat: "18K PVD" };
        var extraCount = (o.items && o.items.length > 1) ? ` <span style="font-size:11px;color:var(--gold-deep);font-weight:700;">+${o.items.length - 1} more</span>` : '';

        // Channel badge
        var channelBadge = isImt
            ? '<span class="status-pill gold" style="font-size:10.5px;padding:3px 8px;"><i class="fa-solid fa-globe"></i> Public Store</span>'
            : '<span class="status-pill" style="font-size:10.5px;padding:3px 8px;background:#F3F4F6;color:#374151;"><i class="fa-solid fa-store"></i> Boutique POS</span>';

        // Status Pill
        var statusPill = isPending
            ? '<span class="status-pill warning" style="background:#FEF3C7;color:#B45309;border:1px solid #FCD34D;font-weight:700;"><i class="fa-solid fa-clock-rotate-left"></i> Pending Approval</span>'
            : '<span class="status-pill success" style="font-weight:700;"><i class="fa-solid fa-circle-check"></i> Approved</span>';

        // Action Buttons:
        // STAFF: Can View and Approve!
        // ADMIN: Can View Summary report of the order, but DOES NOT HAVE THE APPROVE SECTION!
        var actionsHtml = '';
        if (isStaff) {
            if (isPending) {
                actionsHtml += `<button type="button" class="btn-gold-primary staff-approval-action" style="font-size:11px;padding:5px 12px;gap:5px;border-radius:6px;box-shadow:0 2px 8px rgba(197,160,89,0.35);" onclick="approveImitationOrder(${o.id ? o.id : 0}, '${o.orderRef}')" title="Approve Customer Order">
                    <i class="fa-solid fa-check-double"></i> <span>Approve</span>
                </button> `;
            }
            actionsHtml += `<button type="button" class="btn-white-outline" style="font-size:11px;padding:5px 10px;gap:4px;border-radius:6px;" onclick="viewOrderDocketModal('${o.orderRef}')" title="Inspect Order Memorandum">
                <i class="fa-solid fa-receipt"></i> <span>Docket</span>
            </button>`;
        } else {
            // Admin Panel: View summary report only, NO APPROVE SECTION!
            actionsHtml = `<button type="button" class="btn-white-outline" style="font-size:11.5px;padding:6px 14px;gap:6px;border-radius:6px;" onclick="viewOrderDocketModal('${o.orderRef}')" title="View Summary Report">
                <i class="fa-solid fa-eye" style="color:var(--gold-deep);"></i> <span>View Summary</span>
            </button>`;
        }

        var initials = (o.customerName || "VP").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

        var tr = $(`
            <tr id="row-order-${o.orderRef}">
                <td>
                    <strong style="color:var(--gold-deep);font-family:monospace;font-size:13px;">${o.orderRef}</strong>
                    <div style="font-size:10.5px;color:var(--text-muted);">${formatDateDisplay(o.orderDate)}</div>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:28px;height:28px;border-radius:50%;background:var(--gold-subtle-bg);color:var(--gold-deep);border:1px solid var(--border-gold);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${initials}</div>
                        <div>
                            <p style="font-weight:700;font-size:13px;margin:0;color:var(--text-main);">${o.customerName || "Valued Patron"}</p>
                            <span style="font-size:11px;color:var(--text-muted);">${o.customerContact || o.deliveryAddress || "Sri Lanka"}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                        ${channelBadge}
                    </div>
                    <span style="font-size:12.5px;font-weight:600;color:var(--text-main);">${firstItem.productName}</span>${extraCount}
                </td>
                <td>
                    <strong style="font-family:'Inter',sans-serif;font-size:14px;color:var(--text-main);font-weight:800;">${formatLKR(o.totalAmount)}</strong>
                </td>
                <td>
                    <span style="font-size:12px;color:var(--text-secondary);font-weight:600;"><i class="fa-solid fa-credit-card" style="font-size:11px;margin-right:4px;color:var(--gold-deep);"></i> ${o.paymentMethod || "COD"}</span>
                </td>
                <td id="status-cell-${o.orderRef}">
                    ${statusPill}
                </td>
                <td style="text-align:right;" id="actions-cell-${o.orderRef}">
                    ${actionsHtml}
                </td>
            </tr>
        `);

        tbody.append(tr);
    });
}

function formatDateDisplay(d) {
    if (!d) return "Today";
    try {
        var dt = new Date(d);
        return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
        return "Recent";
    }
}

// ─── 6. Staff Approval Action ─────────────────────────────────────────────────
function approveImitationOrder(orderId, orderRef) {
    var token = localStorage.getItem("token") || "";

    // 1. Update local cached order immediately for instant UI feedback
    var target = _dashboardOrders.find(function (o) { return o.orderRef === orderRef || (orderId && o.id === orderId); });
    if (target) {
        target.status = "APPROVED";
    }

    // 2. Update persistent localStorage 'aurum_orders'
    try {
        var storedOrders = JSON.parse(localStorage.getItem('aurum_orders') || '[]');
        storedOrders.forEach(function (so) {
            if (so.orderRef === orderRef || (orderId && so.id === orderId)) {
                so.status = "APPROVED";
            }
        });
        localStorage.setItem('aurum_orders', JSON.stringify(storedOrders));
    } catch (e) {
        console.error("Failed to sync approved status to localStorage", e);
    }

    // 3. Update database via PUT /api/v1/orders/{id}/approve if valid integer ID
    if (orderId && orderId > 0 && orderId < 900) {
        $.ajax({
            url: BASE_URL + "/orders/" + orderId + "/approve",
            method: "PUT",
            headers: token ? { "Authorization": "Bearer " + token } : {},
            success: function (msg) {
                console.log("[Staff Approval] Backend response:", msg);
            },
            error: function (err) {
                console.warn("[Staff Approval] Backend call failed, retained locally:", err);
            }
        });
    }

    // 4. Update UI row and badge
    showToastNotification(`Order ${orderRef} Approved! Staff authorization registered.`);
    loadDashboardOrders();
}

// ─── 7. Order Docket & Summary Modal ─────────────────────────────────────────
function viewOrderDocketModal(orderRefOrId) {
    var order = _dashboardOrders.find(function (o) {
        return o.orderRef === orderRefOrId || String(o.id) === String(orderRefOrId);
    });

    if (!order) {
        alert("Order details not found.");
        return;
    }

    var isPending = (order.status === "PENDING_APPROVAL");
    var statusBadge = isPending
        ? '<span class="status-pill warning" style="background:#FEF3C7;color:#B45309;font-weight:700;"><i class="fa-solid fa-clock"></i> Pending Staff Approval</span>'
        : '<span class="status-pill success" style="font-weight:700;"><i class="fa-solid fa-circle-check"></i> Approved & Verified</span>';

    var itemsHtml = '';
    (order.items || []).forEach(function (item) {
        itemsHtml += `
            <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 10px 6px;">
                    <strong style="font-size:13px;color:var(--text-main);">${item.productName || "Jewellery Piece"}</strong><br>
                    <small style="color:var(--text-muted);font-size:11px;">${item.karat || item.itemType || "18K PVD Gold"}</small>
                </td>
                <td style="padding: 10px 6px;text-align:center;font-weight:700;">${item.qty || 1}</td>
                <td style="padding: 10px 6px;text-align:right;font-weight:800;font-family:'Inter',sans-serif;">${formatLKR(item.lineTotal || item.unitPrice)}</td>
            </tr>
        `;
    });

    var modalHtml = `
        <div style="text-align: center; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid rgba(197, 160, 89, 0.3);">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 4px;">
                <i class="fa-solid fa-crown" style="color: var(--gold-primary);"></i>
                <h4 style="font-family: 'Playfair Display', serif; font-size: 18px; margin: 0; letter-spacing: 0.1em;">AURUM ATELIER</h4>
            </div>
            <span style="font-size: 11px; text-transform: uppercase; color: var(--gold-deep); letter-spacing: 0.08em;">Official Order Summary & Memoranda</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; font-size: 12.5px;">
            <div>
                <span style="display:block;font-size:11px;color:var(--text-muted);text-transform:uppercase;">Order Reference</span>
                <strong style="font-family:monospace;font-size:13.5px;color:var(--gold-deep);">${order.orderRef}</strong>
            </div>
            <div>
                <span style="display:block;font-size:11px;color:var(--text-muted);text-transform:uppercase;">Channel Type</span>
                <strong>${order.orderType === "IMITATION" ? "Public Imitation Store" : "Boutique POS"}</strong>
            </div>
            <div>
                <span style="display:block;font-size:11px;color:var(--text-muted);text-transform:uppercase;">Client Patron</span>
                <strong>${order.customerName || "Valued Client"}</strong>
                <span style="display:block;font-size:11px;color:var(--text-muted);">${order.customerContact || ""}</span>
            </div>
            <div>
                <span style="display:block;font-size:11px;color:var(--text-muted);text-transform:uppercase;">Payment Method</span>
                <strong>${order.paymentMethod || "COD"}</strong>
            </div>
            <div style="grid-column: 1/-1;">
                <span style="display:block;font-size:11px;color:var(--text-muted);text-transform:uppercase;">Insured Delivery Address</span>
                <span style="color:var(--text-main);font-weight:600;">${order.deliveryAddress || "In-Boutique Pickup"}</span>
            </div>
            <div style="grid-column: 1/-1; display:flex; justify-content:space-between; align-items:center; background:var(--bg-light-gray); padding:8px 12px; border-radius:6px; border:1px solid var(--border-light);">
                <span style="font-size:11.5px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Approval Status:</span>
                ${statusBadge}
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
                <tr style="border-bottom: 1.5px solid var(--border-gold); font-size: 11px; text-transform: uppercase; color: var(--text-muted);">
                    <th style="text-align:left;padding:6px;">Artisan Piece</th>
                    <th style="text-align:center;padding:6px;">Qty</th>
                    <th style="text-align:right;padding:6px;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--gold-subtle-bg); border-radius: 8px; border: 1px solid var(--border-gold);">
            <strong style="font-size: 13px; color: var(--gold-deep);">Grand Total Invoiced:</strong>
            <strong style="font-family: 'Inter', sans-serif; font-size: 16px; color: var(--gold-deep);">${formatLKR(order.totalAmount)}</strong>
        </div>
    `;

    $("#dashboardDocketModalBody").html(modalHtml);
    $("#dashboardOrderDocketModal").css("display", "flex");
}

function showToastNotification(msg) {
    var toast = $(`<div style="position:fixed;bottom:28px;right:28px;background:linear-gradient(135deg,#C5A059,#E8C87E);color:#FFF;padding:14px 22px;border-radius:10px;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(197,160,89,0.45);z-index:99999;display:flex;align-items:center;gap:10px;">
        <i class="fa-solid fa-circle-check" style="font-size:16px;"></i>
        <span>${msg}</span>
    </div>`);
    $("body").append(toast);
    setTimeout(function () { toast.fadeOut(300, function () { $(this).remove(); }); }, 3600);
}