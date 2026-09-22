// js/inventory.js — Full Dual-Tab Inventory & Atelier Catalog Engine
// Supports Heritage Gold Heirlooms (22K/24K) and Lifestyle Imitation (18K PVD Store)

var currentInventoryTab = 'gold'; // 'gold' or 'imitation'
var _allLoadedProducts = [];

// Seed Curated Default Imitation Items (published to public index.html)
var DEFAULT_IMITATION_ITEMS = [
    {
        id: 101,
        name: "Aurelia Double-Layer Solitaire Pendant",
        itemType: "IMITATION",
        category: "necklaces",
        categoryId: 1,
        price: 14500,
        material: "18K PVD Gold • Anti-Tarnish • Zircon",
        image: "assets/prod-necklace.jpg",
        stock: 14,
        rating: 4.9,
        reviews: 84
    },
    {
        id: 102,
        name: "Soleil Hand-Hammered Sculpted Cuff",
        itemType: "IMITATION",
        category: "bracelets",
        categoryId: 2,
        price: 18200,
        material: "Hand-Hammered • Waterproof • Flex-Fit",
        image: "assets/prod-cuff.jpg",
        stock: 8,
        rating: 4.8,
        reviews: 62
    },
    {
        id: 103,
        name: "Celeste Baroque Pearl Cascade Drops",
        itemType: "IMITATION",
        category: "earrings",
        categoryId: 3,
        price: 12800,
        material: "Baroque Pearls • Hypoallergenic • 18K",
        image: "assets/prod-earrings.jpg",
        stock: 19,
        rating: 5.0,
        reviews: 110
    },
    {
        id: 104,
        name: "Elysian Pavé Solitaire Signet Ring",
        itemType: "IMITATION",
        category: "rings",
        categoryId: 4,
        price: 11500,
        material: "Brushed Gold • Brilliant Cut • Comfort-Fit",
        image: "assets/prod-ring.jpg",
        stock: 2,
        rating: 4.9,
        reviews: 54
    },
    {
        id: 105,
        name: "Lumina Sunburst Layered Medallion",
        itemType: "IMITATION",
        category: "necklaces",
        categoryId: 1,
        price: 15900,
        material: "Dual Chain • 18K Micro-Plate • Waterproof",
        image: "assets/prod-necklace.jpg",
        stock: 7,
        rating: 4.8,
        reviews: 41
    },
    {
        id: 106,
        name: "Aura Radiant Hammered Torque",
        itemType: "IMITATION",
        category: "bracelets",
        categoryId: 2,
        price: 16400,
        material: "Solid Sculpt • Anti-Fade • Champagne Shine",
        image: "assets/prod-cuff.jpg",
        stock: 12,
        rating: 4.9,
        reviews: 73
    }
];

// Seed Default Heritage Gold Items
var DEFAULT_GOLD_ITEMS = [
    {
        id: 1,
        name: "Heritage 22K Sovereign Bullion Coin",
        itemType: "GOLD",
        weight: 8.0,
        wastage: 1.5,
        labourCost: 3500,
        categoryId: 1,
        material: "22K Solid Gold"
    },
    {
        id: 2,
        name: "Ceylonese Traditional Filigree Choker",
        itemType: "GOLD",
        weight: 24.5,
        wastage: 3.5,
        labourCost: 18000,
        categoryId: 1,
        material: "22K Heritage Gold"
    },
    {
        id: 3,
        name: "Artisan Crown Sovereign Bangle",
        itemType: "GOLD",
        weight: 16.0,
        wastage: 2.0,
        labourCost: 12000,
        categoryId: 2,
        material: "22K Solid Gold"
    },
    {
        id: 4,
        name: "Grand Sovereign Bridal Heirloom Ensemble",
        itemType: "GOLD",
        weight: 88.0,
        wastage: 4.0,
        labourCost: 65000,
        categoryId: 1,
        material: "22K Sovereign Gold"
    }
];

function getStoredImitationItems() {
    try {
        var raw = localStorage.getItem("aurum_inventory_imitation");
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error("Error reading imitation items:", e);
    }
    localStorage.setItem("aurum_inventory_imitation", JSON.stringify(DEFAULT_IMITATION_ITEMS));
    return DEFAULT_IMITATION_ITEMS;
}

function saveStoredImitationItems(items) {
    localStorage.setItem("aurum_inventory_imitation", JSON.stringify(items));
}

function getStoredGoldItems() {
    try {
        var raw = localStorage.getItem("aurum_inventory_gold");
        if (raw) {
            var parsed = JSON.parse(raw);
            return parsed.filter(function (it) { return it.status !== "SOLD"; });
        }
    } catch (e) {
        console.error("Error reading gold items:", e);
    }
    localStorage.setItem("aurum_inventory_gold", JSON.stringify(DEFAULT_GOLD_ITEMS));
    return DEFAULT_GOLD_ITEMS.filter(function (it) { return it.status !== "SOLD"; });
}

function saveStoredGoldItems(items) {
    localStorage.setItem("aurum_inventory_gold", JSON.stringify(items));
}

$(document).ready(function () {
    // Auth guard
    if (typeof guardAuth === "function") {
        guardAuth();
    }

    // Initialize inventory state and load items
    loadInventory();

    // Check for edit piece query parameter (e.g. from notification alert)
    var urlParams = new URLSearchParams(window.location.search);
    var editId = urlParams.get('edit');
    if (editId) {
        setTimeout(function () {
            var numId = parseInt(editId);
            openEditModal(isNaN(numId) ? editId : numId);
        }, 600);
    }
});

// ─── 1. Load Inventory & Synchronize ──────────────────────────────────────────
function loadInventory() {
    var grid = $("#inventory-grid");
    grid.html('<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:var(--gold-primary);margin-bottom:12px;"></i><br>Loading Atelier Inventory...</div>');

    var token = localStorage.getItem("token") || "";

    $.ajax({
        url: (typeof BASE_URL !== "undefined" ? BASE_URL : "http://localhost:8080/api/v1") + "/inventory/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + token },
        success: function (products) {
            _allLoadedProducts = products || [];

            if (products && products.length > 0) {
                var goldList = [];
                var imtList = [];
                $.each(products, function (i, p) {
                    if (p.itemType === "IMITATION") {
                        imtList.push(p);
                    } else {
                        goldList.push(p);
                    }
                });
                saveStoredGoldItems(goldList);
                saveStoredImitationItems(imtList);
            } else {
                saveStoredGoldItems([]);
                saveStoredImitationItems([]);
            }

            renderInventoryGrid();
            if (typeof refreshHeaderNotifications === 'function') {
                refreshHeaderNotifications();
            }
        },
        error: function () {
            console.warn("[Inventory] Backend unavailable. Loading from Atelier Storage.");
            renderInventoryGrid();
            if (typeof refreshHeaderNotifications === 'function') {
                refreshHeaderNotifications();
            }
        }
    });
}

// ─── 2. Switch Between Gold and Imitation Tabs ───────────────────────────────
function switchInventoryTab(tab) {
    currentInventoryTab = tab;

    if (tab === 'imitation') {
        $("#tabImitationInventory").addClass("active");
        $("#tabGoldInventory").removeClass("active");
    } else {
        $("#tabGoldInventory").addClass("active");
        $("#tabImitationInventory").removeClass("active");
    }

    renderInventoryGrid();
}

// ─── 3. Render Inventory Grid by Active Tab ───────────────────────────────────
function renderInventoryGrid() {
    var grid = $("#inventory-grid");
    grid.empty();

    var goldItems = getStoredGoldItems();
    var imitationItems = getStoredImitationItems();

    // Update Tab Badges
    $("#goldCountBadge").text(goldItems.length + " Pieces");
    $("#imitationCountBadge").text(imitationItems.length + " Pieces");

    var displayItems = (currentInventoryTab === 'imitation') ? imitationItems : goldItems;

    if (displayItems.length === 0) {
        var emptyMsg = currentInventoryTab === 'imitation'
            ? 'No imitation lifestyle pieces added yet. Click "+ Add Piece" to catalog an 18K lifestyle piece for the public store.'
            : 'No heritage gold pieces in the vault yet. Click "+ Add Piece" to catalog a gold heirloom.';
        grid.html('<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);"><i class="fa-solid fa-box-open" style="font-size:36px;color:var(--gold-light);margin-bottom:12px;display:block;"></i>' + emptyMsg + '</div>');
        return;
    }

    $.each(displayItems, function (index, p) {
        grid.append(buildInventoryCard(p));
    });
}

// ─── 4. Build Inventory Card ──────────────────────────────────────────────────
function buildInventoryCard(p) {
    var isImitation = (p.itemType === 'IMITATION' || currentInventoryTab === 'imitation');
    var sku = (isImitation ? "#IMT-" : "#JWL-") + String(p.id).padStart(4, "0");

    var mediaHTML = '';
    if (p.image) {
        mediaHTML = '<img src="' + p.image + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:cover;">';
    } else {
        mediaHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#FAF9F6;"><i class="fa-solid ' + (isImitation ? 'fa-gem' : 'fa-coins') + '" style="font-size:44px;color:var(--gold-primary);opacity:0.4;"></i></div>';
    }

    var badgeHTML = '';
    var specsHTML = '';
    var priceRowHTML = '';

    if (isImitation) {
        var retailPrice = p.price ? formatPrice(p.price) : "Rs. 14,500";
        var material = p.material || "18K PVD Champagne Gold";
        var rawStock = (p.stock !== undefined && p.stock !== null) ? p.stock : 10;
        var stock = parseInt(rawStock);
        if (isNaN(stock)) stock = 0;

        badgeHTML = `
            <div class="inventory-badges-top">
                <span class="status-pill gold">18K PVD</span>
                <span class="public-store-tag"><i class="fa-solid fa-globe"></i> Public Store</span>
            </div>
        `;

        var stockHtml = (stock <= 3)
            ? `<span style="color:#e11d48;font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Stock: <strong>${stock} in store</strong></span>`
            : `<span>Stock: <strong>${stock} in store</strong></span>`;

        specsHTML = `
            <div class="inventory-specs-row">
                <span>Finish: <strong>${material}</strong></span>
                <span>&bull;</span>
                ${stockHtml}
            </div>
        `;

        priceRowHTML = `
            <div>
                <span style="font-size:10px;text-transform:uppercase;color:var(--text-subtle);">Retail Price (Store)</span>
                <div class="inv-price-val" style="color:var(--gold-deep);">${retailPrice}</div>
            </div>
        `;
    } else {
        var weight = p.weight ? p.weight + "g" : "8.00g";
        var labour = p.labourCost ? formatPrice(p.labourCost) : "Rs. 3,500";
        var wastage = (p.wastage || 0) + "%";

        badgeHTML = `
            <div class="inventory-badges-top">
                <span class="status-pill gold">22K Gold</span>
                <span class="stock-badge-live stock-in"><i class="fa-solid fa-check"></i> Vault Certified</span>
            </div>
        `;

        specsHTML = `
            <div class="inventory-specs-row">
                <span>Weight: <strong>${weight}</strong></span>
                <span>&bull;</span>
                <span>Wastage: <strong>${wastage}</strong></span>
            </div>
        `;

        priceRowHTML = `
            <div>
                <span style="font-size:10px;text-transform:uppercase;color:var(--text-subtle);">Labour Cost</span>
                <div class="inv-price-val">${labour}</div>
            </div>
        `;
    }

    return `
        <article class="inventory-card" id="inv-card-${p.id}">
            <div class="inventory-media-wrap">
                ${badgeHTML}
                ${mediaHTML}
            </div>
            <div class="inventory-card-body">
                <div class="inventory-sku-line">
                    <span>${sku}</span>
                    <span>${isImitation ? (p.category || 'Lifestyle') : 'Bullion'}</span>
                </div>
                <h4 class="inventory-piece-title font-serif">${p.name}</h4>
                ${specsHTML}
                <div class="inventory-price-row">
                    ${priceRowHTML}
                    <div style="display:flex;gap:6px;">
                        ${!isImitation ? `
                        <button class="header-action-btn" style="width:32px;height:32px;color:var(--gold-deep);" title="Mark Piece as Sold (Archived into Reports)" onclick="markGoldPieceSold(${p.id})">
                            <i class="fa-solid fa-hand-holding-dollar" style="font-size:11px;"></i>
                        </button>
                        ` : ''}
                        <button class="header-action-btn" style="width:32px;height:32px;" title="Edit" onclick="openEditModal(${p.id})">
                            <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                        </button>
                        <button class="header-action-btn" style="width:32px;height:32px;color:#ef4444;" title="Delete" onclick="deleteItem(${p.id})">
                            <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// ─── 5. Item Type Classification Toggle ───────────────────────────────────────
function onItemTypeChange(mode) {
    var prefix = mode === 'edit' ? '#edit-item-type' : '#item-type';
    var type = $(prefix).val();

    if (mode === 'edit') {
        if (type === 'IMITATION') {
            $("#imitation-fields-edit").show();
            $("#gold-fields-edit").hide();
        } else {
            $("#gold-fields-edit").show();
            $("#imitation-fields-edit").hide();
        }
    } else {
        if (type === 'IMITATION') {
            $("#imitation-fields-add").show();
            $("#gold-fields-add").hide();
        } else {
            $("#gold-fields-add").show();
            $("#imitation-fields-add").hide();
        }
    }
}

// ─── 6. Image Upload & File Handling ──────────────────────────────────────────
function handleImageFileSelect(event, mode) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
        var base64 = e.target.result;
        setPreviewImage(base64, mode);
    };
    reader.readAsDataURL(file);
}

function usePresetImage(url, mode) {
    setPreviewImage(url, mode);
}

function setPreviewImage(src, mode) {
    if (mode === 'edit') {
        $("#item-image-data-edit").val(src);
        $("#item-preview-img-edit").attr("src", src);
        $("#item-preview-wrap-edit").show();
        $("#item-dropzone-edit").hide();
    } else {
        $("#item-image-data-add").val(src);
        $("#item-preview-img-add").attr("src", src);
        $("#item-preview-wrap-add").show();
        $("#item-dropzone-add").hide();
    }
}

function clearUploadedImage(mode) {
    if (mode === 'edit') {
        $("#item-image-data-edit").val("");
        $("#item-preview-img-edit").attr("src", "");
        $("#item-preview-wrap-edit").hide();
        $("#item-dropzone-edit").show();
        $("#edit-item-image-file").val("");
    } else {
        $("#item-image-data-add").val("");
        $("#item-preview-img-add").attr("src", "");
        $("#item-preview-wrap-add").hide();
        $("#item-dropzone-add").show();
        $("#item-image-file").val("");
    }
}

// ─── 7. Save New Piece ────────────────────────────────────────────────────────
function saveItem() {
    var type = $("#item-type").val() || "GOLD";
    var name = $("#item-name").val().trim();
    var image = $("#item-image-data-add").val() || "";

    if (!name) {
        alert("Please enter a piece title.");
        return;
    }

    var isImitation = (type === "IMITATION");
    var newItem = null;

    if (isImitation) {
        var price = parseFloat($("#item-price").val()) || 14500;
        var material = $("#item-material").val().trim() || "18K PVD Champagne Gold";
        var category = $("#item-category-select").val() || "necklaces";
        var stock = parseInt($("#item-stock-qty").val()) || 10;

        // Default image if none uploaded
        if (!image) {
            var presetMap = {
                "necklaces": "assets/prod-necklace.jpg",
                "bracelets": "assets/prod-cuff.jpg",
                "earrings": "assets/prod-earrings.jpg",
                "rings": "assets/prod-ring.jpg"
            };
            image = presetMap[category] || "assets/prod-necklace.jpg";
        }

        newItem = {
            id: Date.now(),
            name: name,
            itemType: "IMITATION",
            category: category,
            categoryId: category === 'necklaces' ? 1 : (category === 'bracelets' ? 2 : (category === 'earrings' ? 3 : 4)),
            price: price,
            material: material,
            image: image,
            stock: stock,
            rating: 5.0,
            reviews: 1
        };

        var imtItems = getStoredImitationItems();
        imtItems.unshift(newItem);
        saveStoredImitationItems(imtItems);

        // Switch to imitation tab to show newly added item
        switchInventoryTab('imitation');
        showInvToast("✓ Imitation piece added & published to Public Store!");
    } else {
        var weight = parseFloat($("#item-weight").val()) || 10.0;
        var wastage = parseFloat($("#item-wastage").val()) || 3.0;
        var labour = parseFloat($("#item-labour").val()) || 5000;

        newItem = {
            id: Date.now(),
            name: name,
            itemType: "GOLD",
            weight: weight,
            wastage: wastage,
            labourCost: labour,
            categoryId: 1,
            material: "22K Solid Gold",
            image: image,
            status: "AVAILABLE"
        };

        var goldItems = getStoredGoldItems();
        goldItems.unshift(newItem);
        saveStoredGoldItems(goldItems);

        switchInventoryTab('gold');
        showInvToast("✓ Gold heirloom registered as Available in vault catalog!");
    }

    // Attempt backend POST /inventory/save
    var token = localStorage.getItem("token") || "";
    var backendDTO = {
        name: newItem.name,
        weight: newItem.weight || 0,
        wastage: newItem.wastage || 0,
        labourCost: newItem.labourCost || 0,
        categoryId: newItem.categoryId || 1,
        itemType: newItem.itemType,
        image: newItem.image,
        price: newItem.price || 0,
        material: newItem.material || "",
        stock: (newItem.stock !== undefined && newItem.stock !== null) ? newItem.stock : 10,
        status: "AVAILABLE"
    };

    $.ajax({
        url: (typeof BASE_URL !== "undefined" ? BASE_URL : "http://localhost:8080/api/v1") + "/inventory/save",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + token },
        data: JSON.stringify(backendDTO),
        complete: function () {
            closeAddPieceModal();
            $("#form-add-item")[0].reset();
            clearUploadedImage('add');
            loadInventory();
        }
    });
}

// ─── 8. Edit Piece ────────────────────────────────────────────────────────────
var _editingItemId = null;

function openEditModal(id) {
    _editingItemId = id;

    // Search in local storage lists
    var goldItems = getStoredGoldItems();
    var imtItems = getStoredImitationItems();

    var p = goldItems.find(function(x) { return x.id === id; }) || imtItems.find(function(x) { return x.id === id; });

    if (!p) {
        alert("Item not found.");
        return;
    }

    $("#edit-item-type").val(p.itemType || "GOLD");
    $("#edit-item-name").val(p.name);
    $("#edit-item-weight").val(p.weight || "");
    $("#edit-item-wastage").val(p.wastage || "");
    $("#edit-item-labour").val(p.labourCost || "");
    $("#edit-item-price").val(p.price || "");
    $("#edit-item-material").val(p.material || "");
    var curStock = (p.stock !== undefined && p.stock !== null) ? p.stock : 10;
    $("#edit-item-stock").val(curStock);

    if (p.image) {
        setPreviewImage(p.image, 'edit');
    } else {
        clearUploadedImage('edit');
    }

    onItemTypeChange('edit');
    document.getElementById("editPieceModal").style.display = "flex";
}

function updateItem() {
    if (!_editingItemId) return;
    var token = localStorage.getItem("token") || "";

    var type = $("#edit-item-type").val();
    var name = $("#edit-item-name").val().trim();
    var image = $("#item-image-data-edit").val() || "";
    var stockVal = parseInt($("#edit-item-stock").val());
    var stock = !isNaN(stockVal) ? stockVal : 10;

    var backendDTO = {
        name: name,
        itemType: type,
        image: image,
        weight: parseFloat($("#edit-item-weight").val()) || 0,
        wastage: parseFloat($("#edit-item-wastage").val()) || 0,
        labourCost: parseFloat($("#edit-item-labour").val()) || 0,
        price: parseFloat($("#edit-item-price").val()) || 0,
        material: $("#edit-item-material").val().trim() || "",
        stock: stock
    };

    // Update local storage imitation items immediately
    var imtItems = getStoredImitationItems();
    var foundImt = imtItems.find(function(x) { return String(x.id) === String(_editingItemId); });
    if (foundImt) {
        foundImt.name = name;
        if (image) foundImt.image = image;
        foundImt.price = backendDTO.price;
        foundImt.material = backendDTO.material;
        foundImt.stock = stock;
        saveStoredImitationItems(imtItems);
    }

    $.ajax({
        url: (typeof BASE_URL !== "undefined" ? BASE_URL : "http://localhost:8080/api/v1") + "/inventory/update/" + _editingItemId,
        method: "PUT",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + token },
        data: JSON.stringify(backendDTO),
        complete: function () {
            document.getElementById("editPieceModal").style.display = "none";
            _editingItemId = null;
            loadInventory();
            showInvToast("✓ Piece updated successfully!");
        }
    });
}

// ─── 9. Delete Piece ──────────────────────────────────────────────────────────
function deleteItem(id) {
    if (!confirm("Remove this piece from the atelier catalog? This cannot be undone.")) return;

    var token = localStorage.getItem("token") || "";

    $.ajax({
        url: (typeof BASE_URL !== "undefined" ? BASE_URL : "http://localhost:8080/api/v1") + "/inventory/delete/" + id,
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token },
        complete: function () {
            loadInventory();
            showInvToast("Piece removed from catalog.");
        }
    });
}

// ─── 9.1 Mark Gold Piece as Sold ──────────────────────────────────────────────
function markGoldPieceSold(id) {
    if (!confirm("Confirm marking this gold piece as SOLD? It will be removed from the active inventory & POS UI, but safely preserved in the database to appear in the Sales & Financial Reports.")) {
        return;
    }

    var token = localStorage.getItem("token") || "";

    // Update in local cache
    try {
        var rawGold = localStorage.getItem("aurum_inventory_gold");
        if (rawGold) {
            var items = JSON.parse(rawGold);
            items.forEach(function (g) {
                if (String(g.id) === String(id)) {
                    g.status = "SOLD";
                }
            });
            localStorage.setItem("aurum_inventory_gold", JSON.stringify(items));
        }
    } catch (e) {}

    // Send PUT /inventory/{id}/sell to backend
    $.ajax({
        url: (typeof BASE_URL !== "undefined" ? BASE_URL : "http://localhost:8080/api/v1") + "/inventory/" + id + "/sell",
        method: "PUT",
        headers: token ? { "Authorization": "Bearer " + token } : {},
        complete: function () {
            loadInventory();
            showInvToast("✓ Gold piece marked as SOLD and recorded in Reports!");
        }
    });
}

// ─── 10. Helpers ──────────────────────────────────────────────────────────────
function formatPrice(num) {
    return "Rs. " + Math.round(num).toLocaleString('en-US');
}

function showInvToast(message) {
    var toast = $('<div style="position:fixed;bottom:30px;right:30px;background:linear-gradient(135deg,#C5A059,#E8C87E);color:#fff;padding:14px 22px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(197,160,89,0.4);z-index:9999;">' + message + '</div>');
    $("body").append(toast);
    setTimeout(function () { toast.fadeOut(400, function () { $(this).remove(); }); }, 3000);
}

// Expose globals for inline event handlers
window.switchInventoryTab = switchInventoryTab;
window.onItemTypeChange = onItemTypeChange;
window.handleImageFileSelect = handleImageFileSelect;
window.usePresetImage = usePresetImage;
window.clearUploadedImage = clearUploadedImage;
window.saveItem = saveItem;
window.openEditModal = openEditModal;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
window.markGoldPieceSold = markGoldPieceSold;