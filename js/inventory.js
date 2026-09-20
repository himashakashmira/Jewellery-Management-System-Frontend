// js/inventory.js — Full CRUD for AURUM Atelier Inventory
// Student style: simple jQuery AJAX, one function per action

$(document).ready(function () {
    // guard: redirect to login if no token
    guardAuth();

    // load all inventory items when page opens
    loadInventory();
});

// ─── 1. Load & Render Inventory Grid ─────────────────────────────────────────
function loadInventory() {
    var grid = $("#inventory-grid");

    // show spinner while loading real data
    grid.html('<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:var(--gold-primary);margin-bottom:12px;"></i><br>Loading Atelier Catalog...</div>');

    // calling the get all inventory api
    $.ajax({
        url: BASE_URL + "/inventory/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (products) {
            // clearing spinner before rendering real data
            grid.empty();
            $("#inventory-table-body").empty();

            if (!products || products.length === 0) {
                grid.html('<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);">No pieces in the atelier catalog yet. Add your first piece.</div>');
                return;
            }

            // loop through each product and build a card
            $.each(products, function (index, p) {
                grid.append(buildInventoryCard(p));
            });

            console.log("[Inventory] Loaded", products.length, "pieces.");
        },
        error: function (err) {
            console.error("[Inventory] Failed to load:", err.status, err.statusText);
            grid.html('<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation" style="font-size:28px;margin-bottom:12px;"></i><br>Failed to load inventory. Is the backend running on port 8080?</div>');
        }
    });
}

// ─── 2. Build a Single Inventory Card ────────────────────────────────────────
function buildInventoryCard(p) {
    var sku     = "#JWL-" + String(p.id).padStart(4, "0");
    var weight  = p.weight ? p.weight + "g" : "N/A";
    var labour  = p.labourCost ? formatLKR(p.labourCost) : "Rs. 0.00";

    return '<article class="inventory-card" id="inv-card-' + p.id + '">' +
        '<div class="inventory-media-wrap">' +
            '<div class="inventory-badges-top">' +
                '<span class="status-pill gold">22K Gold</span>' +
                '<span class="stock-badge-live stock-in"><i class="fa-solid fa-check"></i> In Stock</span>' +
            '</div>' +
            '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#FAF9F6;">' +
                '<i class="fa-solid fa-gem" style="font-size:48px;color:var(--gold-primary);opacity:0.4;"></i>' +
            '</div>' +
        '</div>' +
        '<div class="inventory-card-body">' +
            '<div class="inventory-sku-line">' +
                '<span>' + sku + '</span>' +
                '<span>Cat. #' + (p.categoryId || "—") + '</span>' +
            '</div>' +
            '<h4 class="inventory-piece-title font-serif">' + p.name + '</h4>' +
            '<div class="inventory-specs-row">' +
                '<span>Weight: <strong>' + weight + '</strong></span>' +
                '<span>&bull;</span>' +
                '<span>Wastage: <strong>' + (p.wastage || 0) + '%</strong></span>' +
            '</div>' +
            '<div class="inventory-price-row">' +
                '<div>' +
                    '<span style="font-size:10px;text-transform:uppercase;color:var(--text-subtle);">Labour Cost</span>' +
                    '<div class="inv-price-val">' + labour + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:6px;">' +
                    '<button class="header-action-btn" style="width:32px;height:32px;" title="Edit" onclick="openEditModal(' + p.id + ')">' +
                        '<i class="fa-solid fa-pen" style="font-size:11px;"></i>' +
                    '</button>' +
                    '<button class="header-action-btn" style="width:32px;height:32px;color:#ef4444;" title="Delete" onclick="deleteItem(' + p.id + ')">' +
                        '<i class="fa-solid fa-trash" style="font-size:11px;"></i>' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</article>';
}

// ─── 3. Save New Item ─────────────────────────────────────────────────────────
function saveItem() {
    var data = {
        name:       $("#item-name").val().trim(),
        weight:     parseFloat($("#item-weight").val()) || 0,
        wastage:    parseFloat($("#item-wastage").val()) || 0,
        labourCost: parseFloat($("#item-labour").val()) || 0,
        categoryId: parseInt($("#item-category").val()) || 1
    };

    if (!data.name) {
        alert("Please enter a piece title.");
        return;
    }

    // disable button to prevent double submit
    $("#btn-save-item").prop("disabled", true).text("Saving...");

    // calling the save inventory api
    $.ajax({
        url: BASE_URL + "/inventory/save",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        data: JSON.stringify(data),
        success: function () {
            // closing modal and refreshing grid after save
            closeAddPieceModal();
            $("#form-add-item")[0].reset();
            loadInventory();
            showInvToast("✓ Piece added to the atelier catalog!");
            console.log("[Inventory] Saved new piece:", data.name);
        },
        error: function (err) {
            console.error("[Inventory] Failed to save piece:", err.status, err.responseText);
            alert("Failed to save piece. Check console for details.");
        },
        complete: function () {
            // re-enable button after api call finishes
            $("#btn-save-item").prop("disabled", false).html('<i class="fa-solid fa-plus"></i> <span>Add to Catalog</span>');
        }
    });
}

// ─── 4. Open Edit Modal & Pre-fill Fields ────────────────────────────────────
var _editingItemId = null;

function openEditModal(id) {
    _editingItemId = id;

    // calling the get all api to find the item data for pre-filling edit form
    $.ajax({
        url: BASE_URL + "/inventory/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (products) {
            var p = null;
            $.each(products, function (i, item) {
                if (item.id === id) { p = item; return false; }
            });

            if (!p) { alert("Item not found."); return; }

            // pre-filling edit form with existing item data
            $("#edit-item-name").val(p.name);
            $("#edit-item-weight").val(p.weight);
            $("#edit-item-wastage").val(p.wastage);
            $("#edit-item-labour").val(p.labourCost);
            $("#edit-item-category").val(p.categoryId);

            document.getElementById("editPieceModal").style.display = "flex";
        },
        error: function (err) {
            console.error("[Inventory] Failed to fetch item for edit:", err.status, err.statusText);
        }
    });
}

// ─── 5. Update Existing Item ─────────────────────────────────────────────────
function updateItem() {
    if (!_editingItemId) return;

    var data = {
        name:       $("#edit-item-name").val().trim(),
        weight:     parseFloat($("#edit-item-weight").val()) || 0,
        wastage:    parseFloat($("#edit-item-wastage").val()) || 0,
        labourCost: parseFloat($("#edit-item-labour").val()) || 0,
        categoryId: parseInt($("#edit-item-category").val()) || 1
    };

    // calling the update inventory api
    $.ajax({
        url: BASE_URL + "/inventory/update/" + _editingItemId,
        method: "PUT",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        data: JSON.stringify(data),
        success: function () {
            // closing modal and refreshing grid after update
            document.getElementById("editPieceModal").style.display = "none";
            _editingItemId = null;
            loadInventory();
            showInvToast("✓ Piece updated successfully!");
            console.log("[Inventory] Updated piece ID:", _editingItemId);
        },
        error: function (err) {
            console.error("[Inventory] Failed to update piece:", err.status, err.responseText);
            alert("Failed to update. Check console for details.");
        }
    });
}

// ─── 6. Delete Item ───────────────────────────────────────────────────────────
function deleteItem(id) {
    if (!confirm("Remove this piece from the atelier catalog? This cannot be undone.")) return;

    // calling the delete inventory api
    $.ajax({
        url: BASE_URL + "/inventory/delete/" + id,
        method: "DELETE",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function () {
            // fade out the deleted card in the UI
            $("#inv-card-" + id).fadeOut(300, function () { $(this).remove(); });
            showInvToast("Piece removed from the catalog.");
            console.log("[Inventory] Deleted piece ID:", id);
        },
        error: function (err) {
            console.error("[Inventory] Failed to delete piece:", err.status, err.responseText);
            alert("Failed to delete piece. It may be referenced in an existing order.");
        }
    });
}

// ─── 7. Toast Notification ───────────────────────────────────────────────────
function showInvToast(message) {
    var toast = $('<div style="position:fixed;bottom:30px;right:30px;background:linear-gradient(135deg,#C5A059,#E8C87E);color:#fff;padding:14px 22px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(197,160,89,0.4);z-index:9999;">' + message + '</div>');
    $("body").append(toast);
    setTimeout(function () { toast.fadeOut(400, function () { $(this).remove(); }); }, 3000);
}