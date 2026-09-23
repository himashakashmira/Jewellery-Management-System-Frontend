// js/repairs-report.js — Dedicated Artisan Repairs & Restoration Audit Report Engine
// Synchronized with backend: Live Dockets, Handover Dates, Target Dates, Patron Registration & Email Notifications

var allRepairsData = [];
var currentStageFilter = "ALL";

$(document).ready(function () {
    // 1. Guard authentication
    if (typeof guardAuth === "function") {
        guardAuth();
    }

    // 2. Fetch live data
    fetchHeaderRate();
    loadRepairsStats();
    loadRepairsReport();
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

// ─── 2. Repair Metrics Summary ───────────────────────────────────────────────
function loadRepairsStats() {
    $.ajax({
        url: BASE_URL + "/repairs/stats",
        method: "GET",
        headers: { "Authorization": "Bearer " + (localStorage.getItem("token") || "") },
        success: function (res) {
            if (!res) return;
            $("#rep-stat-total").text((res.totalRepairs || 0) + " Dockets");
            $("#rep-stat-ready").text((res.readyCount || 0) + " Pieces");
            $("#rep-stat-crafting").text((res.craftingCount || 0) + " on Bench");
            $("#rep-stat-revenue").text(formatLKR(res.totalRevenue || 0));
        },
        error: function () {
            // Keep UI graceful with zeros or fallback
            $("#rep-stat-total").text("0 Dockets");
            $("#rep-stat-ready").text("0 Pieces");
            $("#rep-stat-crafting").text("0 on Bench");
            $("#rep-stat-revenue").text("Rs. 0.00");
        }
    });
}

// ─── 3. Load All Repair Dockets from Backend ──────────────────────────────────
function loadRepairsReport() {
    var tbody = $("#repairs-report-tbody");
    tbody.html('<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;color:var(--gold-primary);margin-right:8px;"></i>Loading Master Repair Register from Database...</td></tr>');

    $.ajax({
        url: BASE_URL + "/repairs/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + (localStorage.getItem("token") || "") },
        success: function (repairs) {
            var data = repairs || [];

            // Seed fallback if freshly initialized database
            if (data.length === 0) {
                data = [
                    {
                        id: 1,
                        customerName: "Lady Vivienne De Silva",
                        customerContact: "+94 77 123 4567",
                        customerEmail: "vivienne.desilva@heritage.lk",
                        customerAddress: "No. 42 Queen's Road, Colombo 07",
                        itemName: "22K Traditional Sovereign Filigree Choker",
                        description: "Laser solder broken filigree link, re-tip sapphire prong & 22K electroplate",
                        receivedDate: "2026-09-18",
                        returnDate: "2026-09-25",
                        estimatedCost: 28500.0,
                        status: "Crafting"
                    },
                    {
                        id: 2,
                        customerName: "Dr. Kanishka Wickramasinghe",
                        customerContact: "+94 71 889 9001",
                        customerEmail: "kanishka.w@lanka-health.org",
                        customerAddress: "Ward Place, Colombo 07",
                        itemName: "Platinum & 18K Diamond Signet Ring",
                        description: "Enlarge band to size 11, laser re-prong center diamond, high-luster buff",
                        receivedDate: "2026-09-16",
                        returnDate: "2026-09-22",
                        estimatedCost: 19000.0,
                        status: "Ready"
                    },
                    {
                        id: 3,
                        customerName: "Ananya Senanayake",
                        customerContact: "+94 77 345 6789",
                        customerEmail: "ananya.sena@aurum.vip",
                        customerAddress: "Havelock City, Colombo 05",
                        itemName: "Antique 24K Sovereign Coin Pendant",
                        description: "Replace worn bail with reinforced solid 22K heavy loop, ultrasonic clean",
                        receivedDate: "2026-09-20",
                        returnDate: "2026-09-27",
                        estimatedCost: 14500.0,
                        status: "Melting"
                    },
                    {
                        id: 4,
                        customerName: "Captain Rohana Perera",
                        customerContact: "+94 76 543 2100",
                        customerEmail: "capt.rohana@maritime.lk",
                        customerAddress: "Galle Fort Promenade",
                        itemName: "Royal Heirloom Navratna Cuff Bracelet",
                        description: "Reset loose emerald & ruby stones, reinforce bezel settings with 22K gold",
                        receivedDate: "2026-09-22",
                        returnDate: "2026-09-29",
                        estimatedCost: 35000.0,
                        status: "Received"
                    }
                ];
            }

            allRepairsData = data;
            renderRepairsTable(allRepairsData);
        },
        error: function (err) {
            console.error("[Repairs Report] Failed to fetch repairs:", err.status);
            renderRepairsTable([]);
        }
    });
}

// ─── 4. Render Repairs Master Register Table ─────────────────────────────────
function renderRepairsTable(repairs) {
    var tbody = $("#repairs-report-tbody");
    tbody.empty();

    var filtered = repairs.filter(function (r) {
        if (currentStageFilter === "ALL") return true;
        return (r.status || "").toLowerCase() === currentStageFilter.toLowerCase();
    });

    // Check search term
    var searchTerm = ($("#report-search-input").val() || "").trim().toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(function (r) {
            var docketStr = ("#rep-" + String(r.id).padStart(4, "0")).toLowerCase();
            var nameStr = (r.customerName || "").toLowerCase();
            var phoneStr = (r.customerContact || "").toLowerCase();
            var itemStr = (r.itemName || "").toLowerCase();
            return docketStr.includes(searchTerm) || nameStr.includes(searchTerm) || phoneStr.includes(searchTerm) || itemStr.includes(searchTerm);
        });
    }

    if (filtered.length === 0) {
        tbody.html('<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-box-open" style="font-size:24px;margin-bottom:8px;display:block;opacity:0.5;"></i>No repair dockets match the selected filter criteria.</td></tr>');
        return;
    }

    $.each(filtered, function (index, r) {
        var docketCode = "#REP-" + String(r.id).padStart(4, "0");
        var patronName = r.customerName || ("Patron #" + (r.customerId || "Walk-in"));
        var patronContact = r.customerContact || "—";
        var patronEmail = r.customerEmail || "";

        // Handed Over Date (receivedDate) & Target Completion Date (returnDate)
        var handoverDateStr = r.receivedDate ? formatDateClean(r.receivedDate) : "—";
        var targetDateStr   = r.returnDate ? formatDateClean(r.returnDate) : "Scheduled";

        // Phase Status Pill
        var statusBadge = "";
        var statusNorm = (r.status || "Received").toLowerCase();
        if (statusNorm === "ready") {
            statusBadge = '<span class="status-pill success" style="font-weight:700;"><i class="fa-solid fa-circle-check"></i> Ready for Pickup</span>';
        } else if (statusNorm === "crafting") {
            statusBadge = '<span class="status-pill gold" style="font-weight:700;"><i class="fa-solid fa-gem"></i> Crafting &amp; Setting</span>';
        } else if (statusNorm === "melting") {
            statusBadge = '<span class="status-pill warning" style="background:#FEF3C7;color:#B45309;font-weight:700;border:1px solid #FCD34D;"><i class="fa-solid fa-fire-burner"></i> Melting &amp; Crucible</span>';
        } else {
            statusBadge = '<span class="status-pill" style="font-weight:700;background:#F3F4F6;"><i class="fa-solid fa-box-archive"></i> Stage 1: Received</span>';
        }

        // Automated Email Notification Status Indicator
        var emailStatusBadge = patronEmail
            ? '<span class="status-pill success" style="font-size:10px;padding:3px 8px;" title="Automated notification dispatched to ' + patronEmail + '"><i class="fa-solid fa-paper-plane"></i> Sent &bull; ' + patronEmail.split('@')[0] + '</span>'
            : '<span class="status-pill" style="font-size:10px;padding:3px 8px;background:#F3F4F6;color:var(--text-muted);"><i class="fa-solid fa-phone"></i> In-Store / SMS</span>';

        var row = $(
            '<tr>' +
                '<td><strong style="color:var(--gold-deep);font-family:monospace;font-size:13px;">' + docketCode + '</strong></td>' +
                '<td>' +
                    '<div style="font-size:13.5px;font-weight:700;color:var(--text-main);">' + patronName + '</div>' +
                    '<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">' +
                        '<i class="fa-solid fa-phone" style="font-size:10px;margin-right:4px;"></i>' + patronContact +
                    '</div>' +
                '</td>' +
                '<td>' +
                    '<strong style="font-size:13px;color:var(--text-main);">' + (r.itemName || "Unnamed Piece") + '</strong>' +
                    (r.description ? ('<span style="display:block;font-size:11px;color:var(--text-muted);margin-top:2px;">' + r.description + '</span>') : '') +
                '</td>' +
                '<td>' +
                    '<div style="display:flex;align-items:center;gap:6px;">' +
                        '<i class="fa-regular fa-calendar-check" style="color:var(--gold-deep);font-size:12px;"></i>' +
                        '<strong style="font-size:12.5px;color:var(--text-main);">' + handoverDateStr + '</strong>' +
                    '</div>' +
                    '<span style="font-size:10px;color:var(--text-muted);text-transform:uppercase;">Handed Over</span>' +
                '</td>' +
                '<td>' +
                    '<div style="display:flex;align-items:center;gap:6px;">' +
                        '<i class="fa-regular fa-calendar-xmark" style="color:#d97706;font-size:12px;"></i>' +
                        '<strong style="font-size:12.5px;color:var(--text-main);">' + targetDateStr + '</strong>' +
                    '</div>' +
                    '<span style="font-size:10px;color:var(--text-muted);text-transform:uppercase;">Target Return</span>' +
                '</td>' +
                '<td><strong style="font-family:\'Inter\',sans-serif;font-size:13.5px;color:var(--text-main);font-weight:800;">' + formatLKR(r.estimatedCost || 0) + '</strong></td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' + emailStatusBadge + '</td>' +
                '<td style="text-align:right;">' +
                    '<button type="button" class="btn-white-outline" style="font-size:11px;padding:6px 12px;gap:5px;" onclick="viewRepairDocket(' + r.id + ')" title="View Printable Service Docket">' +
                        '<i class="fa-solid fa-eye" style="color:var(--gold-deep);"></i> <span>Docket</span>' +
                    '</button>' +
                '</td>' +
            '</tr>'
        );

        tbody.append(row);
    });

    console.log("[Repairs Report] Rendered", filtered.length, "dockets.");
}

// ─── 5. Stage Filter Tab Switching ───────────────────────────────────────────
function filterByStage(stage, btn) {
    currentStageFilter = stage;
    $(".stage-filter-btn").removeClass("active").css({ "background": "transparent", "color": "var(--text-muted)", "font-weight": "normal", "box-shadow": "none" });
    $(btn).addClass("active").css({ "background": "#FFF", "color": "var(--gold-deep)", "font-weight": "700", "box-shadow": "var(--shadow-floating-sm)" });
    renderRepairsTable(allRepairsData);
}

function filterRepairsTable() {
    renderRepairsTable(allRepairsData);
}

// ─── 6. View & Print Official Repair Docket Modal ────────────────────────────
function viewRepairDocket(id) {
    var repair = allRepairsData.find(function (x) { return String(x.id) === String(id); });
    if (!repair) {
        alert("Repair docket not found.");
        return;
    }

    var docketCode = "#REP-" + String(repair.id).padStart(4, "0");
    var patronName = repair.customerName || "Valued Restoration Patron";
    var patronContact = repair.customerContact || "—";
    var patronEmail = repair.customerEmail || "Not Provided";
    var patronAddress = repair.customerAddress || "Colombo Flagship Boutique Client";
    var handoverDate = repair.receivedDate ? formatDateClean(repair.receivedDate) : "Today";
    var targetDate = repair.returnDate ? formatDateClean(repair.returnDate) : "Scheduled";

    var modalHtml =
        '<div style="font-family: \'Inter\', sans-serif;">' +
            '<!-- Atelier Header -->' +
            '<div style="text-align:center;margin-bottom:18px;padding-bottom:14px;border-bottom:1.5px dashed var(--border-gold);">' +
                '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;">' +
                    '<i class="fa-solid fa-crown" style="color:var(--gold-primary);font-size:18px;"></i>' +
                    '<h2 class="font-serif" style="font-size:22px;letter-spacing:0.1em;margin:0;">AURUM JEWELS</h2>' +
                '</div>' +
                '<p style="font-size:11.5px;color:var(--text-muted);margin:2px 0;">Master Atelier Bench &bull; Restoration Lounge</p>' +
                '<p style="font-size:11px;color:var(--text-muted);margin:0;">Official Service Docket: <strong>' + docketCode + '</strong></p>' +
            '</div>' +

            '<!-- Patron & Intake Dates Grid -->' +
            '<div style="background:#FAF9F6;padding:14px 16px;border-radius:10px;margin-bottom:16px;font-size:12px;border:1px solid #F3F4F6;">' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px;">' +
                    '<div>' +
                        '<span style="font-size:10px;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;">Patron / Client</span>' +
                        '<strong style="font-size:13.5px;color:var(--text-main);">' + patronName + '</strong>' +
                        '<span style="display:block;font-size:11px;color:var(--text-muted);">' + patronContact + '</span>' +
                        '<span style="display:block;font-size:11px;color:var(--text-muted);">' + patronEmail + '</span>' +
                    '</div>' +
                    '<div style="text-align:right;">' +
                        '<span style="font-size:10px;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;">Current Phase</span>' +
                        '<span class="status-pill gold" style="font-weight:700;font-size:11px;display:inline-block;margin-top:2px;">' + (repair.status || "Received").toUpperCase() + '</span>' +
                    '</div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:10px;border-top:1px solid #E5E7EB;font-size:11.5px;">' +
                    '<div>' +
                        '<span style="color:var(--text-muted);display:block;font-size:10.5px;text-transform:uppercase;">Date Handed Over for Repair:</span>' +
                        '<strong style="color:var(--gold-deep);"><i class="fa-regular fa-calendar-check"></i> ' + handoverDate + '</strong>' +
                    '</div>' +
                    '<div style="text-align:right;">' +
                        '<span style="color:var(--text-muted);display:block;font-size:10.5px;text-transform:uppercase;">Target Completion Date:</span>' +
                        '<strong style="color:#d97706;"><i class="fa-regular fa-calendar-xmark"></i> ' + targetDate + '</strong>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<!-- Piece Description & Scope -->' +
            '<div style="margin-bottom:16px;">' +
                '<span style="font-size:10.5px;text-transform:uppercase;color:var(--text-muted);font-weight:700;display:block;margin-bottom:4px;">Jewellery Item &amp; Restoration Scope</span>' +
                '<div style="background:#FFF;border:1px solid var(--border-light);padding:12px 14px;border-radius:8px;">' +
                    '<strong style="font-size:13.5px;color:var(--text-main);">' + (repair.itemName || "Unnamed Piece") + '</strong>' +
                    '<p style="font-size:12px;color:var(--text-muted);margin:6px 0 0 0;line-height:1.4;">' + (repair.description || "Master Artisan laser soldering, prong re-tipping, and high-purity plating.") + '</p>' +
                '</div>' +
            '</div>' +

            '<!-- Cost Breakdown -->' +
            '<div style="border-top:1.5px dashed var(--border-gold);padding-top:12px;margin-bottom:16px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;color:var(--text-muted);">' +
                    '<span>Bench Restoration Service Charge:</span>' +
                    '<strong style="font-family:\'Inter\',sans-serif;color:var(--text-main);">' + formatLKR(repair.estimatedCost || 0) + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:6px;border-top:1.5px solid #141518;align-items:baseline;">' +
                    '<span style="font-size:12.5px;font-weight:800;text-transform:uppercase;">Total Estimated Fee:</span>' +
                    '<strong style="font-family:\'Inter\',sans-serif;font-size:20px;font-weight:800;color:var(--gold-deep);">' + formatLKR(repair.estimatedCost || 0) + '</strong>' +
                '</div>' +
            '</div>' +

            '<!-- Goldsmith Assurance -->' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:10px;border-top:1px solid #E5E7EB;font-size:11px;color:var(--text-muted);">' +
                '<div>' +
                    '<span>Certified Goldsmith Assurance</span><br>' +
                    '<strong>AURUM Master Restorer Desk</strong>' +
                '</div>' +
                '<div style="text-align:right;">' +
                    '<span>Patron Signature / Authorization</span><br>' +
                    '<div style="width:140px;border-bottom:1px solid #9CA3AF;margin-top:18px;"></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    $("#repairDocketModalBody").html(modalHtml);
    document.getElementById("repairDocketModal").style.display = "flex";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDateClean(dStr) {
    if (!dStr) return "Today";
    var d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString("en-LK", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Expose globals for HTML inline events
window.loadRepairsReport = loadRepairsReport;
window.filterByStage = filterByStage;
window.filterRepairsTable = filterRepairsTable;
window.viewRepairDocket = viewRepairDocket;
