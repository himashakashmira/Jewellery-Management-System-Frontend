// js/repairs.js — Full Repair Lounge integration for AURUM backend
// Student style: simple jQuery AJAX, one function per action

$(document).ready(function () {
    // guard: redirect to login if no token
    guardAuth();

    // load stats and repairs when page opens
    fetchRepairStats();
    loadRepairs();
});

// ─── 1. Repair Stats (Metric Cards) ──────────────────────────────────────────
function fetchRepairStats() {
    // calling the repair stats api
    $.ajax({
        url: BASE_URL + "/repairs/stats",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (res) {
            // updating each stat card with real backend data
            $("#stat-repairs").text((res.totalRepairs || 0) + " Orders");
            $("#stat-repairs-ready").text((res.readyCount || 0) + " Masterpieces");
            $("#stat-repairs-crafting").text((res.craftingCount || 0) + " on Bench");
            $("#stat-repairs-revenue").text(formatLKR(res.totalRevenue || 0));

            console.log("[Repairs] Stats loaded:", res);
        },
        error: function (err) {
            console.error("[Repairs] Failed to fetch stats:", err.status, err.statusText);
            // show zeros on failure — keep UI stable
            $("#stat-repairs").text("0 Orders");
            $("#stat-repairs-ready").text("0 Masterpieces");
            $("#stat-repairs-crafting").text("0 on Bench");
            $("#stat-repairs-revenue").text("Rs. 0.00");
        }
    });
}

// ─── 2. Load & Render Repair Cards ───────────────────────────────────────────
function loadRepairs() {
    var container = $("#repairs-list-container");

    // remove any existing cards before loading fresh data
    container.find("article.repair-card-horizontal").remove();
    container.find(".repairs-loading").remove();

    // show loading spinner
    container.append('<div class="repairs-loading" style="text-align:center;padding:60px 0;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:var(--gold-primary);margin-bottom:12px;"></i><br>Loading Atelier Repair Dockets...</div>');

    // calling the get all repairs api
    $.ajax({
        url: BASE_URL + "/repairs/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (repairs) {
            // removing spinner after data arrives
            container.find(".repairs-loading").remove();

            if (!repairs || repairs.length === 0) {
                container.append('<div style="text-align:center;padding:60px 0;color:var(--text-muted);">No active repair dockets found. Register a new job.</div>');
                return;
            }

            // loop through and build each repair card
            $.each(repairs, function (index, r) {
                container.append(buildRepairCard(r));
            });

            console.log("[Repairs] Loaded", repairs.length, "active dockets.");
        },
        error: function (err) {
            console.error("[Repairs] Failed to load repairs:", err.status, err.statusText);
            container.find(".repairs-loading").remove();
            container.append('<div style="text-align:center;padding:60px 0;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation" style="font-size:28px;margin-bottom:12px;"></i><br>Failed to load repairs. Is the backend running?</div>');
        }
    });
}

// ─── 3. Build Repair Card HTML ────────────────────────────────────────────────
var STATUS_STAGES = ["Received", "Melting", "Crafting", "Ready"];
var STATUS_ICONS  = {
    "Received": "fa-box-archive",
    "Melting":  "fa-fire-burner",
    "Crafting": "fa-gem",
    "Ready":    "fa-bell-concierge"
};
var STATUS_FILL = {
    "Received": "0%",
    "Melting":  "33%",
    "Crafting": "66%",
    "Ready":    "100%"
};

function buildRepairCard(r) {
    var currentStageIndex = STATUS_STAGES.indexOf(r.status);
    var fillPct           = STATUS_FILL[r.status] || "0%";

    // build each pipeline step node
    var stepsHtml = "";
    $.each(STATUS_STAGES, function (i, stage) {
        var nodeClass, nodeContent;

        if (i < currentStageIndex) {
            // completed stages show a tick
            nodeClass   = "step-node completed";
            nodeContent = '<i class="fa-solid fa-check"></i>';
        } else if (i === currentStageIndex) {
            // current active stage glows
            nodeClass   = "step-node active-glow";
            nodeContent = '<i class="fa-solid ' + (STATUS_ICONS[stage] || "fa-circle") + '"></i>';
        } else {
            // pending stages show step number
            nodeClass   = "step-node";
            nodeContent = (i + 1).toString();
        }

        var labelClass = (i === currentStageIndex) ? "step-label active" : "step-label";
        var subStyle   = (i === currentStageIndex) ? 'style="color:var(--gold-deep);font-weight:700;"' : "";
        var subText    = (i === currentStageIndex) ? r.status : (i < currentStageIndex ? "✓" : "Pending");

        stepsHtml +=
            '<div class="pipeline-step-col">' +
                '<div class="' + nodeClass + '">' + nodeContent + '</div>' +
                '<span class="' + labelClass + '">' + stage + '</span>' +
                '<span class="step-subtext" ' + subStyle + '>' + subText + '</span>' +
            '</div>';
    });

    // determine next stage for the Advance button
    var nextStage = STATUS_STAGES[currentStageIndex + 1];
    var actionBtn = nextStage
        ? '<button class="btn-white-outline" style="font-size:11.5px;padding:7px 14px;" onclick="advanceRepairStatus(' + r.id + ', \'' + nextStage + '\')">' +
              '<i class="fa-solid fa-forward"></i> Advance to ' + nextStage +
          '</button>'
        : '<button class="btn-gold-primary" style="font-size:11.5px;padding:7px 14px;" onclick="notifyCustomer(' + r.id + ')">' +
              '<i class="fa-solid fa-paper-plane"></i> Notify' +
          '</button>';

    var receivedDate = r.receivedDate ? new Date(r.receivedDate).toLocaleDateString("en-LK", { day: "numeric", month: "short" }) : "—";
    var docketTag    = "#REP-" + String(r.id).padStart(4, "0") + " &bull; " + r.status.toUpperCase();

    return '<article class="repair-card-horizontal" id="repair-card-' + r.id + '">' +
        '<div class="repair-item-meta">' +
            '<div class="repair-thumb-box" style="display:flex;align-items:center;justify-content:center;background:#FAF9F6;">' +
                '<i class="fa-solid fa-screwdriver-wrench" style="font-size:28px;color:var(--gold-primary);opacity:0.5;"></i>' +
            '</div>' +
            '<div>' +
                '<div class="repair-docket-tag">' + docketTag + '</div>' +
                '<h4 class="repair-piece-name font-serif">' + (r.itemName || "Unnamed Item") + '</h4>' +
                '<p class="repair-client-sub">' +
                    '<i class="fa-regular fa-user" style="color:var(--gold-primary);"></i>' +
                    ' Customer #' + r.customerId + ' &bull; Received: ' + receivedDate +
                '</p>' +
                (r.description ? '<span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block;">' + r.description + '</span>' : '') +
            '</div>' +
        '</div>' +
        '<div class="repair-pipeline-wrapper">' +
            '<div class="pipeline-track">' +
                '<div class="pipeline-track-fill" style="width:' + fillPct + ';"></div>' +
            '</div>' +
            '<div class="pipeline-steps-row">' + stepsHtml + '</div>' +
        '</div>' +
        '<div class="repair-actions-col">' +
            '<span style="font-size:10.5px;text-transform:uppercase;color:var(--text-muted);font-weight:600;">Service Cost</span>' +
            '<div class="repair-cost-bold">' + formatLKR(r.estimatedCost || 0) + '</div>' +
            '<div style="display:flex;gap:8px;margin-top:4px;">' +
                actionBtn +
                '<button class="btn-white-outline" style="font-size:11.5px;padding:7px 12px;" title="Print Docket" onclick="window.print()">' +
                    '<i class="fa-solid fa-print"></i>' +
                '</button>' +
            '</div>' +
        '</div>' +
    '</article>';
}

// ─── 4. Advance Repair Status (PATCH) ────────────────────────────────────────
function advanceRepairStatus(id, newStatus) {
    // calling the patch update-status api to move repair to next stage
    $.ajax({
        url: BASE_URL + "/repairs/update-status/" + id + "?status=" + encodeURIComponent(newStatus),
        method: "PATCH",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function () {
            // reload the repairs list and stats after status update
            loadRepairs();
            fetchRepairStats();
            showRepairToast("Status updated to: " + newStatus);
            console.log("[Repairs] Advanced ID", id, "to", newStatus);
        },
        error: function (err) {
            console.error("[Repairs] Failed to update status:", err.status, err.responseText);
            alert("Could not update status. Please try again.");
        }
    });
}

// ─── 5. Notify Customer ───────────────────────────────────────────────────────
function notifyCustomer(id) {
    alert("Customer notified: Piece #REP-" + String(id).padStart(4, "0") + " is ready for collection!");
}

// ─── 6. Register New Repair Docket ───────────────────────────────────────────
function registerRepair() {
    var data = {
        itemName:      $("#item-name").val().trim(),
        description:   $("#repair-description").length ? $("#repair-description").val().trim() : "",
        estimatedCost: parseFloat($("#service-fee").val()) || 0,
        customerId:    parseInt($("#repair-customer-id").val()) || null
    };

    if (!data.itemName) {
        alert("Please enter an item description.");
        return;
    }
    if (!data.customerId) {
        alert("Please provide a valid Customer ID.");
        return;
    }

    // disable submit button while calling api
    $("#btn-register-repair").prop("disabled", true).text("Registering...");

    // calling the register repair api
    $.ajax({
        url: BASE_URL + "/repairs/register",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        data: JSON.stringify(data),
        success: function () {
            // closing modal and refreshing repairs list after register
            closeNewRepairModal();
            $("#form-repair-docket")[0].reset();
            loadRepairs();
            fetchRepairStats();
            showRepairToast("✓ Repair docket #" + data.itemName + " registered!");
            console.log("[Repairs] Registered repair for customer ID:", data.customerId);
        },
        error: function (err) {
            console.error("[Repairs] Failed to register repair:", err.status, err.responseText);
            alert("Failed to register repair. Ensure the Customer ID exists in the system.");
        },
        complete: function () {
            // re-enable button after api call finishes
            $("#btn-register-repair").prop("disabled", false).html('<i class="fa-solid fa-plus"></i> <span>Register Repair</span>');
        }
    });
}

// ─── 7. Modal Toggle Functions ────────────────────────────────────────────────
function openNewRepairModal() {
    document.getElementById("repairModal").style.display = "flex";
}

function closeNewRepairModal() {
    document.getElementById("repairModal").style.display = "none";
}

// ─── 8. Toast Notification ───────────────────────────────────────────────────
function showRepairToast(message) {
    var toast = $('<div style="position:fixed;bottom:30px;right:30px;background:linear-gradient(135deg,#C5A059,#E8C87E);color:#fff;padding:14px 22px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(197,160,89,0.4);z-index:9999;">' + message + '</div>');
    $("body").append(toast);
    setTimeout(function () { toast.fadeOut(400, function () { $(this).remove(); }); }, 3000);
}