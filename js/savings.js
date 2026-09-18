// js/savings.js — Wire Gold Wallet deposit form to the backend API
// Student style: simple jQuery AJAX, one function per action

// hold the live gold spot rate for conversion preview
var liveSpotRate22K = 0;

$(document).ready(function () {
    // guard: redirect to login if no token
    guardAuth();

    // load the live rate and wallet balance when page opens
    loadLiveSpotRate();
    loadWalletBalance();

    // wire deposit amount input to update gold preview in real time
    $(document).on("input", "#deposit-amount", function () {
        updateGoldPreview();
    });
});

// ─── 1. Load Live 22K Spot Rate from Backend ─────────────────────────────────
function loadLiveSpotRate() {
    // calling the get latest gold rate api to get live spot rate
    $.ajax({
        url: BASE_URL + "/gold-rates/latest",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (res) {
            liveSpotRate22K = res.rate22K || 0;

            // update the spot rate display in the deposit modal
            $("#live-spot-rate-display").text("Rs. " + liveSpotRate22K.toLocaleString("en-LK") + " / gram");

            console.log("[Savings] Live spot rate loaded:", liveSpotRate22K);

            // refresh the gold preview with new rate
            updateGoldPreview();
        },
        error: function (err) {
            console.error("[Savings] Failed to load spot rate:", err.status, err.statusText);
            $("#live-spot-rate-display").text("Rate not available");
        }
    });
}

// ─── 2. Load Customer Wallet Balance ─────────────────────────────────────────
function loadWalletBalance() {
    // get customer id from local storage (set at login time)
    var customerId = localStorage.getItem("customerId");

    if (!customerId) {
        // if no customer id saved, skip (admin/staff accounts don't have wallets)
        console.log("[Savings] No customerId in localStorage - skipping balance load.");
        return;
    }

    // calling the get balance api for this customer
    $.ajax({
        url: BASE_URL + "/savings/balance/" + customerId,
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (grams) {
            var sovereigns = (grams / 8).toFixed(2);

            // updating the gold wallet stat card with real balance
            $("#stat-wallet-grams").text(parseFloat(grams).toFixed(3) + " g");
            $("#stat-wallet-sovereigns").text(sovereigns);

            console.log("[Savings] Wallet balance:", grams, "grams");
        },
        error: function (err) {
            console.error("[Savings] Failed to load wallet balance:", err.status, err.statusText);
        }
    });
}

// ─── 3. Live Gold Conversion Preview in Deposit Modal ────────────────────────
function updateGoldPreview() {
    var amount = parseFloat($("#deposit-amount").val()) || 0;

    if (liveSpotRate22K <= 0) {
        $("#calcGoldGrams").text("Rate not set");
        return;
    }

    // convert cash to grams using the live spot rate
    var grams = (amount / liveSpotRate22K).toFixed(3);

    // updating the gold credited preview in deposit modal
    $("#calcGoldGrams").text("+ " + grams + " Grams");
}

// ─── 4. Submit Deposit — POST to Backend ─────────────────────────────────────
function submitDeposit() {
    var customerId = parseInt(localStorage.getItem("customerId")) || 0;
    var amount     = parseFloat($("#deposit-amount").val()) || 0;

    if (amount < 5000) {
        alert("Minimum deposit is Rs. 5,000.");
        return;
    }

    if (!customerId) {
        alert("No customer ID found. Please log in as a customer to deposit.");
        return;
    }

    var payload = {
        customerId: customerId,
        amount:     amount
    };

    // disable button while calling api
    $("#btn-deposit-gold").prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> <span>Processing...</span>');

    // calling the savings deposit api
    $.ajax({
        url: BASE_URL + "/savings/deposit",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("[Savings] Deposit success:", response);

            // close modal and refresh the wallet balance
            closeDepositModal();
            loadWalletBalance();

            // add the new transaction row to the savings table UI
            addDepositToTable(amount, response);

            showSavingsToast("Deposit complete! " + $("#calcGoldGrams").text() + " added to Gold Wallet.");
        },
        error: function (err) {
            console.error("[Savings] Deposit failed:", err.status, err.responseText);
            if (err.status === 0) {
                alert("Cannot reach the server. Is the backend running?");
            } else {
                alert("Deposit failed (" + err.status + "). " + (err.responseText || "Check console."));
            }
        },
        complete: function () {
            // re-enable button after api call finishes
            $("#btn-deposit-gold").prop("disabled", false).html('<i class="fa-solid fa-lock"></i> <span>Confirm &amp; Vault Gold</span>');
        }
    });
}

// ─── 5. Add New Row to Savings Transaction Table ──────────────────────────────
function addDepositToTable(amount, message) {
    var tbody = $("#savings-table-body");
    var today = new Date().toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" });
    var grams = parseFloat($("#calcGoldGrams").text()) || 0;

    // prepend new transaction row to top of table
    var newRow =
        '<tr style="border-bottom:1px solid var(--border-subtle);">' +
            '<td style="padding:18px 20px;"><strong style="color:var(--gold-deep);font-family:monospace;">#DEP-' + Date.now().toString().slice(-6) + '</strong></td>' +
            '<td style="padding:18px 20px;">' + today + '</td>' +
            '<td style="padding:18px 20px;font-weight:700;color:var(--text-main);">Rs. ' + amount.toLocaleString("en-LK") + '</td>' +
            '<td style="padding:18px 20px;font-weight:700;color:var(--gold-deep);">' + $("#calcGoldGrams").text() + '</td>' +
            '<td style="padding:18px 20px;font-size:11px;color:var(--text-muted);">Rs. ' + liveSpotRate22K.toLocaleString("en-LK") + '/g</td>' +
            '<td style="padding:18px 20px;"><span class="status-pill gold" style="font-size:11px;padding:4px 10px;">Vaulted</span></td>' +
            '<td style="padding:18px 20px;text-align:right;"><button class="btn-white-outline" style="font-size:11.5px;padding:5px 12px;" title="Download Vault Certificate"><i class="fa-solid fa-file-certificate"></i></button></td>' +
        '</tr>';

    tbody.prepend(newRow);
}

// ─── 6. Modal Toggle Functions ────────────────────────────────────────────────
function openDepositModal() {
    // reload live rate when modal opens to ensure freshest data
    loadLiveSpotRate();
    document.getElementById("depositModal").style.display = "flex";
}

function closeDepositModal() {
    document.getElementById("depositModal").style.display = "none";
}

// ─── 7. Toast Notification ───────────────────────────────────────────────────
function showSavingsToast(message) {
    var toast = $('<div style="position:fixed;bottom:30px;right:30px;background:linear-gradient(135deg,#C5A059,#E8C87E);color:#fff;padding:14px 22px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(197,160,89,0.4);z-index:9999;">' + message + '</div>');
    $("body").append(toast);
    setTimeout(function () { toast.fadeOut(400, function () { $(this).remove(); }); }, 3500);
}
