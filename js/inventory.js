// js/inventory.js — Live API integration for AURUM Jewellery Inventory

$(document).ready(function () {
    guardAuth();
    loadInventory();
});

// ─── 1. Load & Render Inventory Grid ─────────────────────────────────────────

function loadInventory() {
    const grid = $('#inventory-grid');
    // Show spinner while loading
    grid.html('<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:var(--gold-primary);margin-bottom:12px;"></i><br>Loading Atelier Catalog...</div>');

    apiFetch("/inventory/all")
        .done(function (products) {
            // Remove static placeholder cards
            grid.empty();
            // Also clear the hidden table body if used by legacy code
            $('#inventory-table-body').empty();

            if (!products || products.length === 0) {
                grid.html('<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);">No pieces in the atelier catalog yet.</div>');
                return;
            }

            products.forEach(function (p) {
                const card = buildInventoryCard(p);
                grid.append(card);
            });
        })
        .fail(function (err) {
            console.error("Failed to load inventory:", err.status, err.statusText);
            grid.html('<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation" style="font-size:28px;margin-bottom:12px;"></i><br>Failed to load inventory. Is the backend running?</div>');
        });
}

// ─── Card Builder ─────────────────────────────────────────────────────────────

function buildInventoryCard(p) {
    const sku = '#JWL-' + String(p.id).padStart(4, '0');
    const weight = p.weight ? p.weight + 'g' : 'N/A';
    const labourFormatted = p.labourCost ? formatLKR(p.labourCost) : 'Rs. 0.00';

    return `
    <article class="inventory-card" id="inv-card-${p.id}">
        <div class="inventory-media-wrap">
            <div class="inventory-badges-top">
                <span class="status-pill gold">22K Gold</span>
                <span class="stock-badge-live stock-in"><i class="fa-solid fa-check"></i> In Stock</span>
            </div>
            <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#FAF9F6;">
                <i class="fa-solid fa-gem" style="font-size:48px;color:var(--gold-primary);opacity:0.4;"></i>
            </div>
        </div>
        <div class="inventory-card-body">
            <div class="inventory-sku-line">
                <span>${sku}</span>
                <span>Cat. #${p.categoryId || '—'}</span>
            </div>
            <h4 class="inventory-piece-title font-serif">${p.name}</h4>
            <div class="inventory-specs-row">
                <span>Weight: <strong>${weight}</strong></span>
                <span>&bull;</span>
                <span>Wastage: <strong>${p.wastage || 0}%</strong></span>
            </div>
            <div class="inventory-price-row">
                <div>
                    <span style="font-size:10px;text-transform:uppercase;color:var(--text-subtle);">Labour Cost</span>
                    <div class="inv-price-val">${labourFormatted}</div>
                </div>
                <div style="display:flex;gap:6px;">
                    <button class="header-action-btn" style="width:32px;height:32px;" title="Edit" onclick="openEditModal(${p.id})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="header-action-btn" style="width:32px;height:32px;color:#ef4444;" title="Delete" onclick="deleteItem(${p.id})">
                        <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                    </button>
                </div>
            </div>
        </div>
    </article>`;
}

// ─── 2. Save New Item (from Modal) ────────────────────────────────────────────

function saveItem() {
    const data = {
        name:       $('#item-name').val().trim(),
        weight:     parseFloat($('#item-weight').val()) || 0,
        wastage:    parseFloat($('#item-wastage').val()) || 0,
        labourCost: parseFloat($('#item-labour').val()) || 0,
        categoryId: parseInt($('#item-category').val()) || 1
    };

    if (!data.name) {
        alert("Please enter a piece title.");
        return;
    }

    apiFetch("/inventory/save", {
        method: "POST",
        data: JSON.stringify(data)
    })
    .done(function () {
        closeAddPieceModal();
        $('#form-add-item')[0].reset();
        loadInventory();
    })
    .fail(function (err) {
        console.error("Failed to save item:", err.status, err.responseText);
        alert("Failed to save piece. Check console for details.");
    });
}

// ─── 3. Edit Item ─────────────────────────────────────────────────────────────

// Holds the ID of the item being edited
let _editingItemId = null;

function openEditModal(id) {
    _editingItemId = id;

    // Fetch the latest data for this item from inventory list
    apiFetch("/inventory/all")
        .done(function (products) {
            const p = products.find(item => item.id === id);
            if (!p) return alert("Item not found.");

            $('#edit-item-name').val(p.name);
            $('#edit-item-weight').val(p.weight);
            $('#edit-item-wastage').val(p.wastage);
            $('#edit-item-labour').val(p.labourCost);
            $('#edit-item-category').val(p.categoryId);

            document.getElementById('editPieceModal').style.display = 'flex';
        })
        .fail(function (err) {
            console.error("Failed to fetch item for edit:", err);
        });
}

function updateItem() {
    if (!_editingItemId) return;

    const data = {
        name:       $('#edit-item-name').val().trim(),
        weight:     parseFloat($('#edit-item-weight').val()) || 0,
        wastage:    parseFloat($('#edit-item-wastage').val()) || 0,
        labourCost: parseFloat($('#edit-item-labour').val()) || 0,
        categoryId: parseInt($('#edit-item-category').val()) || 1
    };

    apiFetch("/inventory/update/" + _editingItemId, {
        method: "PUT",
        data: JSON.stringify(data)
    })
    .done(function () {
        document.getElementById('editPieceModal').style.display = 'none';
        _editingItemId = null;
        loadInventory();
    })
    .fail(function (err) {
        console.error("Failed to update item:", err.status, err.responseText);
        alert("Failed to update. Check console for details.");
    });
}

// ─── 4. Delete Item ───────────────────────────────────────────────────────────

function deleteItem(id) {
    if (!confirm("Remove this piece from the atelier catalog? This cannot be undone.")) return;

    apiFetch("/inventory/delete/" + id, { method: "DELETE" })
        .done(function () {
            $('#inv-card-' + id).fadeOut(300, function () {
                $(this).remove();
            });
        })
        .fail(function (err) {
            console.error("Failed to delete item:", err.status, err.responseText);
            alert("Failed to delete piece. It may be referenced in an existing order.");
        });
}