// js/gold-rates.js — Wire the Gold Rate fixation form to the backend API
// Student style: simple jQuery AJAX, one function per action

$(document).ready(function () {
    // guard: redirect to login if no token
    guardAuth();

    // load the latest rates from backend when page opens
    loadLatestRates();
});

// ─── 1. Load Latest Rates (populate hero cards) ───────────────────────────────
function loadLatestRates() {
    // calling the get latest rate api
    $.ajax({
        url: BASE_URL + "/gold-rates/latest",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (res) {
            // updating hero display cards with real values from backend
            var gram22 = res.rate22K || 0;
            var gram24 = res.rate24K || 0;
            var sov22  = gram22 * 8;
            var sov24  = gram24 * 8;

            $("#rate-22k").text("Rs. " + sov22.toLocaleString("en-LK"));
            $("#rate-22k-gram").text("Rs. " + gram22.toLocaleString("en-LK") + " / gram");
            $("#rate-24k").text("Rs. " + sov24.toLocaleString("en-LK"));
            $("#rate-24k-gram").text("Rs. " + gram24.toLocaleString("en-LK") + " / gram");

            // update header ticker with live per-gram rate
            $("#headerTicker22K").text("Rs. " + gram22.toLocaleString("en-LK") + "/g");

            // also pre-fill the fixation modal input boxes with current values
            $("#rate-22k-input").val(gram22);
            $("#rate-24k-input").val(gram24);

            // recalculate the sovereign amounts shown in modal
            calculateSovereignRates();

            console.log("[Gold Rates] Loaded: 22K =", gram22, "| 24K =", gram24);
        },
        error: function (err) {
            // if no rates set yet, show a placeholder
            console.error("[Gold Rates] Failed to load latest rates:", err.status, err.statusText);
            $("#rate-22k, #rate-24k").text("Not Set");
        }
    });
}

// ─── 2. Live Auto-Calculation of Sovereign Rates in Modal ────────────────────
function calculateSovereignRates() {
    var gram22 = parseFloat($("#rate-22k-input").val()) || 0;
    var gram24 = parseFloat($("#rate-24k-input").val()) || 0;

    // 8 grams = 1 sovereign
    var sov22 = gram22 * 8;
    var sov24 = gram24 * 8;

    // updating the calculated sovereign display in modal
    $("#calc22KSovereign").text("Rs. " + sov22.toLocaleString("en-LK"));
    $("#calc24KSovereign").text("Rs. " + sov24.toLocaleString("en-LK"));
}

// ─── 3. Handle Fixation Submit — POST to Backend ──────────────────────────────
function handleFixationSubmit(e) {
    e.preventDefault();

    var gram22 = parseFloat($("#rate-22k-input").val()) || 0;
    var gram24 = parseFloat($("#rate-24k-input").val()) || 0;

    if (gram22 <= 0 || gram24 <= 0) {
        alert("Please enter valid rates for both 22K and 24K.");
        return;
    }

    var payload = {
        rate22K: gram22,
        rate24K: gram24
    };

    // disable submit button to prevent double click
    $("#btn-publish-fixation").prop("disabled", true).text("Publishing...");

    // calling the update gold rate api
    $.ajax({
        url: BASE_URL + "/gold-rates/update",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("[Gold Rates] Rate published:", response);

            // updating the hero cards on the page instantly after save
            var sov22 = gram22 * 8;
            var sov24 = gram24 * 8;

            $("#rate-22k").text("Rs. " + sov22.toLocaleString("en-LK"));
            $("#rate-22k-gram").text("Rs. " + gram22.toLocaleString("en-LK") + " / gram");
            $("#rate-24k").text("Rs. " + sov24.toLocaleString("en-LK"));
            $("#rate-24k-gram").text("Rs. " + gram24.toLocaleString("en-LK") + " / gram");

            // update header ticker instantly after publish
            $("#headerTicker22K").text("Rs. " + gram22.toLocaleString("en-LK") + "/g");

            // add new row to the fixation log table
            addRateToLogTable(gram22, gram24);

            // close modal and show confirmation
            closeFixationModal();
            showGoldToast("Official Bullion Fixation published successfully!");
        },
        error: function (err) {
            console.error("[Gold Rates] Failed to publish rate:", err.status, err.responseText);
            if (err.status === 0) {
                alert("Cannot reach the backend server. Is Spring Boot running on port 8080?");
            } else {
                alert("Failed to publish rate (" + err.status + "). Check console.");
            }
        },
        complete: function () {
            // re-enable submit button after request finishes
            $("#btn-publish-fixation").prop("disabled", false).html('<i class="fa-solid fa-bolt"></i> <span>Commit Changes</span>');
        }
    });
}

// ─── 4. Add New Row to Rate Log Table ────────────────────────────────────────
function addRateToLogTable(gram22, gram24) {
    var sov22 = gram22 * 8;
    var sov24 = gram24 * 8;

    var today   = new Date();
    var options = { day: "2-digit", month: "short", year: "numeric" };
    var formattedDate = today.toLocaleDateString("en-LK", options);

    // get the table body to update UI
    var tableBody = $("#gold-rates-table-body");

    // mark previous current row as Previous
    tableBody.find(".status-pill.gold").each(function () {
        $(this).removeClass("gold").text("Previous").css({ "background": "#F3F4F6", "color": "var(--text-muted)" });
    });

    // prepend the new row at the top of the log table
    var newRow =
        '<tr style="border-bottom:1px solid var(--border-subtle);">' +
            '<td style="padding:18px 20px;">' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:var(--gold-subtle-bg);border:1px solid var(--border-gold);display:flex;align-items:center;justify-content:center;color:var(--gold-primary);font-size:12px;"><i class="fa-solid fa-certificate"></i></div>' +
                    '<div><span style="font-weight:700;color:var(--text-main);font-size:13.5px;display:block;">' + formattedDate + '</span><span style="font-size:11px;color:var(--gold-deep);font-weight:600;">AM Fix</span></div>' +
                '</div>' +
            '</td>' +
            '<td style="padding:18px 20px;"><span class="bullion-table-num-bold" style="color:var(--gold-deep);">Rs. ' + gram22.toLocaleString("en-LK") + '</span><span style="display:block;font-size:10.5px;color:#059669;font-weight:600;">Published</span></td>' +
            '<td style="padding:18px 20px;"><span class="bullion-table-num-bold">Rs. ' + sov22.toLocaleString("en-LK") + '</span></td>' +
            '<td style="padding:18px 20px;"><span class="bullion-table-num-bold" style="color:var(--gold-deep);">Rs. ' + gram24.toLocaleString("en-LK") + '</span><span style="display:block;font-size:10.5px;color:#059669;font-weight:600;">Published</span></td>' +
            '<td style="padding:18px 20px;"><span class="bullion-table-num-bold">Rs. ' + sov24.toLocaleString("en-LK") + '</span></td>' +
            '<td style="padding:18px 20px;text-align:center;"><span class="status-pill gold" style="font-size:11px;padding:4px 12px;font-weight:700;"><i class="fa-solid fa-bolt"></i> Current</span></td>' +
            '<td style="padding:18px 20px;text-align:right;"><button class="header-action-btn" style="width:32px;height:32px;" title="View Certificate"><i class="fa-solid fa-file-invoice" style="font-size:12px;color:var(--gold-deep);"></i></button></td>' +
        '</tr>';

    tableBody.prepend(newRow);
}

// ─── 5. Modal Toggle Functions ────────────────────────────────────────────────
function openFixationModal() {
    document.getElementById("fixationModal").style.display = "flex";
}

function closeFixationModal() {
    document.getElementById("fixationModal").style.display = "none";
}

// ─── 6. Toast Notification ───────────────────────────────────────────────────
function showGoldToast(message) {
    var toast = $('<div style="position:fixed;bottom:30px;right:30px;background:linear-gradient(135deg,#C5A059,#E8C87E);color:#fff;padding:14px 22px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(197,160,89,0.4);z-index:9999;">' + message + '</div>');
    $("body").append(toast);
    setTimeout(function () { toast.fadeOut(400, function () { $(this).remove(); }); }, 3500);
}
