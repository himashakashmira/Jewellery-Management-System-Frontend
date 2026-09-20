// js/savings.js — Gold Wallet Deposit for Admin use
// Student style: simple jQuery AJAX, one function per action

// hold the live gold spot rate for conversion preview
var liveSpotRate22K = 0;

$(document).ready(function () {
    // guard: redirect to login if no token
    guardAuth();

    // load the live rate when the page opens
    loadLiveSpotRate();

    // load all customers into the patron selector on page load (not just modal open)
    loadPatronSelector();

    // wire deposit amount input to update gold preview in real time
    $(document).on("input", "#deposit-amount", function () {
        updateGoldPreview();
    });

    // when admin selects a patron, load that patron's wallet balance
    $(document).on("change", "#patron-selector", function () {
        var selectedId = parseInt($(this).val()) || 0;
        if (selectedId > 0) {
            loadWalletBalance(selectedId);
        }
    });
});

// ─── 1. Populate #patron-selector from GET /customers/all ─────────────────────
// Called on page load AND again each time the modal opens (to stay fresh)
function loadPatronSelector() {
    var sel = $("#patron-selector");

    // show a loading state while fetching the patron list
    sel.empty().append('<option value="" disabled selected>Loading patrons...</option>');

    // calling the get all customers api
    $.ajax({
        url: BASE_URL + "/customers/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (customers) {
            // reset with placeholder first, then add each customer as an option
            sel.empty().append('<option value="" disabled selected>Choose a registered patron...</option>');

            if (!customers || customers.length === 0) {
                sel.append('<option value="" disabled>No patrons registered yet</option>');
                console.log("[Savings] No customers found in the system.");
                return;
            }

            // loop through each customer and build an option: Name · Phone
            $.each(customers, function (i, c) {
                var label = c.name + (c.contact ? "  ·  " + c.contact : "");
                sel.append('<option value="' + c.id + '">' + label + '</option>');
            });

            console.log("[Savings] Patron selector populated:", customers.length, "patrons.");
        },
        error: function (err) {
            console.error("[Savings] Failed to load patron list:", err.status, err.statusText);
            sel.empty().append('<option value="" disabled selected>Failed to load — try again</option>');
        }
    });
}

// ─── 2. Load Live 22K Spot Rate from Backend ──────────────────────────────────
function loadLiveSpotRate() {
    // calling the get latest gold rate api
    $.ajax({
        url: BASE_URL + "/gold-rates/latest",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (res) {
            liveSpotRate22K = res.rate22K || 0;

            // update the spot rate display in the deposit modal
            $("#live-spot-rate-display").text("Rs. " + liveSpotRate22K.toLocaleString("en-LK") + " / gram");

            // update the header ticker on the savings page
            $("#ticker-rate-22k-savings").text("Rs. " + liveSpotRate22K.toLocaleString("en-LK") + "/g");

            console.log("[Savings] Live spot rate loaded:", liveSpotRate22K);

            // refresh the gold preview with the new rate
            updateGoldPreview();
        },
        error: function (err) {
            console.error("[Savings] Failed to load spot rate:", err.status, err.statusText);
            $("#live-spot-rate-display").text("Rate not available");
        }
    });
}

// ─── 3. Load Patron's Wallet Balance ──────────────────────────────────────────
// No role check — admin can view any patron's balance by passing their ID
function loadWalletBalance(customerId) {
    if (!customerId) {
        console.log("[Savings] loadWalletBalance: no customerId provided, skipping.");
        return;
    }

    // calling the get balance api for the selected patron
    $.ajax({
        url: BASE_URL + "/savings/balance/" + customerId,
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (grams) {
            var sovereigns = (grams / 8).toFixed(2);
            var marketWorth = (grams * liveSpotRate22K);

            // updating the gold wallet stat card with real patron balance
            $("#stat-wallet-grams").text(parseFloat(grams).toFixed(3) + " g");
            $("#stat-wallet-sovereigns").text(sovereigns);

            // show live market worth: balance grams × current 22K spot rate
            if (marketWorth > 0) {
                $("#stat-wallet-worth").text("Rs. " + marketWorth.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            } else {
                $("#stat-wallet-worth").text("Rs. 0.00");
            }

            console.log("[Savings] Patron wallet balance:", grams, "grams for customer ID:", customerId);
        },
        error: function (err) {
            console.error("[Savings] Failed to load wallet balance:", err.status, err.statusText);
            // show zero on failure so no dummy data stays on screen
            $("#stat-wallet-grams").text("0.000 g");
            $("#stat-wallet-sovereigns").text("0.00");
            $("#stat-wallet-worth").text("Rs. 0.00");
        }
    });
}

// ─── 4. Live Gold Conversion Preview in Deposit Modal ─────────────────────────
function updateGoldPreview() {
    var amount = parseFloat($("#deposit-amount").val()) || 0;

    if (liveSpotRate22K <= 0) {
        $("#calcGoldGrams").text("Rate not set");
        return;
    }

    // convert cash to grams using the live spot rate
    var grams = (amount / liveSpotRate22K).toFixed(3);

    // updating the gold credited preview label in the deposit modal
    $("#calcGoldGrams").text("+ " + grams + " Grams");
}

// ─── 5. Confirm Vault Deposit — POST to Backend ───────────────────────────────
// Main deposit function. Also aliased as submitDeposit() below for the form's onsubmit.
function confirmVaultDeposit() {
    // read the selected patron ID from the dropdown — no localStorage lookup
    var customerId = parseInt($("#patron-selector").val()) || 0;
    var patronName = $("#patron-selector option:selected").text();
    var amount = parseFloat($("#deposit-amount").val()) || 0;
    var goldPreview = $("#calcGoldGrams").text();

    // validation: patron must be selected first
    if (!customerId) {
        alert("Please select a patron first.");
        $("#patron-selector").focus();
        return;
    }

    if (amount < 5000) {
        alert("Minimum deposit is Rs. 5,000.");
        return;
    }

    var payload = {
        customerId: customerId,
        amount: amount
    };

    // disable button while calling api to prevent double submit
    $("#btn-deposit-gold").prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> <span>Processing...</span>');

    console.log("[Savings] Sending deposit for patron:", patronName, "| Amount: Rs.", amount);

    // calling the savings deposit api
    $.ajax({
        url: BASE_URL + "/savings/deposit",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("[Savings] Deposit success:", response);

            // close modal and reload wallet balance for the selected patron
            closeDepositModal();
            loadWalletBalance(customerId);

            // add the new transaction to the savings table UI
            addDepositToTable(amount, patronName, goldPreview);

            showSavingsToast("✓ Deposit complete! " + goldPreview + " vaulted for " + patronName.split("·")[0].trim() + ".");
        },
        error: function (err) {
            console.error("[Savings] Deposit failed:", err.status, err.responseText);
            if (err.status === 0) {
                alert("Cannot reach the server. Is the backend running on port 8080?");
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

// alias: savings.html form uses onsubmit="submitDeposit()"
function submitDeposit() {
    confirmVaultDeposit();
}

// ─── 6. Add New Row to Savings Transaction Table ──────────────────────────────
function addDepositToTable(amount, patronName, goldPreview) {
    var tbody = $("#savings-table-body");
    var today = new Date().toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" });
    var shortName = patronName ? patronName.split("·")[0].trim() : "Patron";

    // remove the empty-state placeholder row on first deposit
    $("#savings-empty-row").remove();

    // prepend the new transaction row to the top of the table
    var newRow =
        '<tr style="border-bottom:1px solid var(--border-subtle);">' +
        '<td style="padding:18px 20px;"><strong style="color:var(--gold-deep);font-family:monospace;">#DEP-' + Date.now().toString().slice(-6) + '</strong></td>' +
        '<td style="padding:18px 20px;">' + today + '</td>' +
        '<td style="padding:18px 20px;font-weight:600;color:var(--text-muted);font-size:12px;">' + shortName + '</td>' +
        '<td style="padding:18px 20px;font-weight:700;color:var(--text-main);">Rs. ' + amount.toLocaleString("en-LK") + '</td>' +
        '<td style="padding:18px 20px;font-weight:700;color:var(--gold-deep);">' + goldPreview + '</td>' +
        '<td style="padding:18px 20px;font-size:11px;color:var(--text-muted);">Rs. ' + liveSpotRate22K.toLocaleString("en-LK") + '/g</td>' +
        '<td style="padding:18px 20px;"><span class="status-pill gold" style="font-size:11px;padding:4px 10px;">Vaulted</span></td>' +
        '<td style="padding:18px 20px;text-align:right;"><button class="btn-white-outline" style="font-size:11.5px;padding:5px 12px;" title="Download Vault Certificate"><i class="fa-solid fa-file-certificate"></i></button></td>' +
        '</tr>';

    tbody.prepend(newRow);
}

// ─── 7. Modal Toggle Functions ─────────────────────────────────────────────────
function openDepositModal() {
    // reload the live rate and refresh the patron list when modal opens
    loadLiveSpotRate();
    loadPatronSelector();
    document.getElementById("depositModal").style.display = "flex";
}

function closeDepositModal() {
    document.getElementById("depositModal").style.display = "none";
}

// ─── 8. Toast Notification ────────────────────────────────────────────────────
function showSavingsToast(message) {
    var toast = $('<div style="position:fixed;bottom:30px;right:30px;background:linear-gradient(135deg,#C5A059,#E8C87E);color:#fff;padding:14px 22px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(197,160,89,0.4);z-index:9999;">' + message + '</div>');
    $("body").append(toast);
    setTimeout(function () { toast.fadeOut(400, function () { $(this).remove(); }); }, 3500);
}


function toggleSchemeModal() {
    const modal = document.getElementById('schemeModal');
    const body = document.body;

    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        body.classList.add('modal-open'); // scroll lock on
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        body.classList.remove('modal-open'); // scroll lock off
    }
}