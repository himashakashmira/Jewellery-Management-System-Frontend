// js/customers.js — Full CRUD for AURUM VIP Patron Registry
// Student style: simple jQuery AJAX, one function per action

$(document).ready(function () {
    // guard: redirect to login if no token
    guardAuth();

    // load page data on startup
    fetchPatronCount();
    loadCustomers();
});

// ─── 1. Load Patron Count (Stat Card) ────────────────────────────────────────
function fetchPatronCount() {
    // calling the count api
    $.ajax({
        url: BASE_URL + "/customers/count",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (count) {
            // updating the patron count stat card
            $("#stat-patrons-count").text(Number(count).toLocaleString("en-LK") + " Patrons");
        },
        error: function (err) {
            console.error("Failed to get patron count:", err.status, err.statusText);
        }
    });
}

// ─── 2. Load All Customers into Table ────────────────────────────────────────
function loadCustomers() {
    var tbody = $("#customer-table-body");

    // show loading state while fetching
    tbody.html('<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="color:var(--gold-primary);margin-right:8px;font-size:18px;"></i>Loading patrons...</td></tr>');

    // calling the get all customers api
    $.ajax({
        url: BASE_URL + "/customers/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (customers) {
            // clearing loading row before adding real data
            tbody.empty();

            if (!customers || customers.length === 0) {
                tbody.html('<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No patrons registered yet. Enroll your first VIP.</td></tr>');
                return;
            }

            // loop through and build each table row
            $.each(customers, function (index, c) {
                tbody.append(buildPatronRow(c, index));
            });
        },
        error: function (err) {
            console.error("Failed to load customers:", err.status, err.statusText);
            tbody.html('<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load patrons. Is the backend running?</td></tr>');
        }
    });
}

// ─── 3. Build a Single Table Row ─────────────────────────────────────────────
function buildPatronRow(c, index) {
    var patronId = "#AUR-VIP-" + String(c.id).padStart(3, "0");
    var initials  = (c.name || "UN").split(" ").map(function(n) { return n[0]; }).join("").substring(0, 2).toUpperCase();

    // simple tier assignment based on position in list
    var tierBadge;
    if (index < 2) {
        tierBadge = '<span class="patron-tier-badge tier-sovereign">Sovereign Elite</span>';
    } else if (index < 5) {
        tierBadge = '<span class="patron-tier-badge tier-heritage">Gold Sovereign</span>';
    } else {
        tierBadge = '<span class="patron-tier-badge">Heritage Member</span>';
    }

    return '<tr id="patron-row-' + c.id + '">' +
        '<td><strong style="color:var(--gold-deep);font-family:monospace;font-size:13.5px;">' + patronId + '</strong></td>' +
        '<td>' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
                '<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#FAF5EC,#F5EBD7);border:1px solid var(--border-gold);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--gold-deep);">' + initials + '</div>' +
                '<div>' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<h4 style="font-size:14px;font-weight:700;color:var(--text-main);">' + (c.name || "—") + '</h4>' +
                        tierBadge +
                    '</div>' +
                    '<span style="font-size:11.5px;color:var(--text-muted);">' + (c.address || "Address not provided") + '</span>' +
                '</div>' +
            '</div>' +
        '</td>' +
        '<td>' +
            '<span style="font-size:12.5px;font-weight:600;color:var(--text-main);">' + (c.contact || "—") + '</span>' +
            '<span style="display:block;font-size:11px;color:var(--text-muted);">' + (c.email || "—") + '</span>' +
        '</td>' +
        '<td><div class="patron-spend-bold">—</div><span style="font-size:10.5px;color:var(--text-muted);">No spend data</span></td>' +
        '<td><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></td>' +
        '<td style="text-align:right;">' +
            '<div style="display:inline-flex;gap:6px;">' +
                '<button class="header-action-btn" style="width:32px;height:32px;" title="Edit Patron" onclick="openEditPatronModal(' + c.id + ', \'' + (c.name||"").replace(/'/g,"") + '\', \'' + (c.contact||"") + '\', \'' + (c.email||"") + '\', \'' + (c.address||"").replace(/'/g,"") + '\')">' +
                    '<i class="fa-solid fa-pen" style="font-size:11px;"></i>' +
                '</button>' +
                '<button class="header-action-btn" style="width:32px;height:32px;color:#ef4444;" title="Remove Patron" onclick="deleteCustomer(' + c.id + ')">' +
                    '<i class="fa-solid fa-trash" style="font-size:11px;"></i>' +
                '</button>' +
            '</div>' +
        '</td>' +
    '</tr>';
}

// ─── 4. Save New Customer ─────────────────────────────────────────────────────
function saveCustomer() {
    var data = {
        name:    $("#customer-name").val().trim(),
        contact: $("#customer-phone").val().trim(),
        email:   $("#customer-email").val().trim(),
        address: $("#customer-address").val().trim()
    };

    if (!data.name) {
        alert("Please enter the patron's full name.");
        return;
    }

    // disable button to prevent double submit
    $("#btn-save-customer").prop("disabled", true).text("Enrolling...");

    // calling the save customer api
    $.ajax({
        url: BASE_URL + "/customers/save",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        data: JSON.stringify(data),
        success: function () {
            // refresh table UI after saving
            closePatronModal();
            $("#form-register-customer")[0].reset();
            loadCustomers();
            fetchPatronCount();
            showToast("✓ Patron enrolled successfully!");
            console.log("[Customers] Saved new patron:", data.name);
        },
        error: function (err) {
            console.error("Failed to save customer:", err.status, err.responseText);
            alert("Failed to register patron. Check console for details.");
        },
        complete: function () {
            // re-enable button after api call finishes
            $("#btn-save-customer").prop("disabled", false).html('<i class="fa-solid fa-award"></i> <span>Enroll VIP Patron</span>');
        }
    });
}

// ─── 5. Open Edit Modal & Pre-fill Fields ────────────────────────────────────
var _editingCustomerId = null;

function openEditPatronModal(id, name, contact, email, address) {
    _editingCustomerId = id;

    // pre-fill edit form with existing data
    $("#edit-customer-name").val(name);
    $("#edit-customer-phone").val(contact);
    $("#edit-customer-email").val(email);
    $("#edit-customer-address").val(address);

    // show the edit modal
    document.getElementById("editPatronModal").style.display = "flex";
}

// ─── 6. Update Customer ───────────────────────────────────────────────────────
function updateCustomer() {
    if (!_editingCustomerId) return;

    var data = {
        name:    $("#edit-customer-name").val().trim(),
        contact: $("#edit-customer-phone").val().trim(),
        email:   $("#edit-customer-email").val().trim(),
        address: $("#edit-customer-address").val().trim()
    };

    // calling the update customer api
    $.ajax({
        url: BASE_URL + "/customers/update/" + _editingCustomerId,
        method: "PUT",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        data: JSON.stringify(data),
        success: function () {
            // updating table UI after edit
            document.getElementById("editPatronModal").style.display = "none";
            _editingCustomerId = null;
            loadCustomers();
            showToast("Patron record updated!");
        },
        error: function (err) {
            console.error("Failed to update customer:", err.status, err.responseText);
            alert("Failed to update patron. Check console for details.");
        }
    });
}

// ─── 7. Delete Customer ───────────────────────────────────────────────────────
function deleteCustomer(id) {
    if (!confirm("Remove this VIP patron from the registry? This cannot be undone.")) return;

    // calling the delete customer api
    $.ajax({
        url: BASE_URL + "/customers/delete/" + id,
        method: "DELETE",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function () {
            // fade out the deleted row in the UI
            $("#patron-row-" + id).fadeOut(300, function () { $(this).remove(); });
            fetchPatronCount();
            showToast("Patron removed from registry.");
        },
        error: function (err) {
            console.error("Failed to delete customer:", err.status, err.responseText);
            alert("Failed to remove patron.");
        }
    });
}

// ─── 8. Simple Toast Notification ────────────────────────────────────────────
function showToast(message) {
    var toast = $('<div style="position:fixed;bottom:30px;right:30px;background:linear-gradient(135deg,#C5A059,#E8C87E);color:#fff;padding:14px 22px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(197,160,89,0.4);z-index:9999;">' + message + '</div>');
    $("body").append(toast);
    setTimeout(function () { toast.fadeOut(400, function () { $(this).remove(); }); }, 3000);
}
