// js/pos.js — Point of Sale Engine for AURUM Boutique
// Fully connected to database: Inventory, Live Gold Rates, Customers, and Orders

// ─── State ────────────────────────────────────────────────────────────────────
var posProducts         = [];           // all inventory items from database
var cartItems           = [];           // items added to the active bill: [{id, productId, name, karat, price, qty, image}]
var activePosCategory   = 'heritage';   // 'heritage' (Gold) or 'lifestyle' (Imitation)
var liveRates           = { rate22K: 43375, rate24K: 47125 };
var currentDocketNumber = generateDocketNumber();

$(document).ready(function () {
    // 1. Guard: redirect to login if no token
    if (typeof guardAuth === "function") {
        guardAuth();
    }

    // 2. Initialize dynamic UI elements
    initCashierProfile();
    updateDocketDisplay();

    // 3. Fetch live gold rates, then load products and customer dropdown
    fetchLiveSpotRates(function () {
        loadProductsToPOS();
    });
    loadCustomerDropdown();
    renderReceipt();
});

// ─── Helpers: Invoice Docket & Cashier Profile ───────────────────────────────
function generateDocketNumber() {
    var datePart = new Date().getFullYear();
    var randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return "#AUR-" + datePart + "-" + randomSuffix;
}

function updateDocketDisplay() {
    $("#pos-invoice-docket").text(currentDocketNumber);
}

function initCashierProfile() {
    var username = localStorage.getItem("username") || "Amal Mendis";
    var role = localStorage.getItem("role") || "ROLE_ADMIN";

    var displayName = username.charAt(0).toUpperCase() + username.slice(1);
    var initials = username.substring(0, 2).toUpperCase();
    var roleTitle = (role === "ROLE_ADMIN") ? "Admin • Lead Cashier" : "Staff • Counter Cashier";

    $("#pos-cashier-name").text(displayName);
    $("#pos-cashier-avatar").text(initials);
    $("#pos-cashier-role").html(roleTitle);
}

// ─── 1. Live Market Spot Rates from Database ─────────────────────────────────
function fetchLiveSpotRates(callback) {
    var token = localStorage.getItem("token") || "";

    $.ajax({
        url: BASE_URL + "/gold-rates/latest",
        method: "GET",
        headers: token ? { "Authorization": "Bearer " + token } : {},
        success: function (res) {
            if (res) {
                if (res.rate22K) liveRates.rate22K = res.rate22K;
                if (res.rate24K) liveRates.rate24K = res.rate24K;
            }
            $("#pos-spot-22k").text("Rs. " + Number(liveRates.rate22K).toLocaleString("en-LK") + " / g");
            $("#pos-spot-24k").text("Rs. " + Number(liveRates.rate24K).toLocaleString("en-LK") + " / g");
            console.log("[POS] Live gold rates loaded from DB:", liveRates);
        },
        error: function (err) {
            console.warn("[POS] Using fallback gold spot rates:", err.status);
            $("#pos-spot-22k").text("Rs. " + Number(liveRates.rate22K).toLocaleString("en-LK") + " / g");
            $("#pos-spot-24k").text("Rs. " + Number(liveRates.rate24K).toLocaleString("en-LK") + " / g");
        },
        complete: function () {
            if (typeof callback === "function") callback();
        }
    });
}

// ─── 2. Load Inventory Products from Database ────────────────────────────────
function loadProductsToPOS() {
    var grid = $("#pos-item-grid");

    // Loading indicator
    grid.html(
        '<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:var(--text-muted);">' +
            '<i class="fa-solid fa-spinner fa-spin" style="font-size:26px;color:var(--gold-primary);margin-bottom:12px;"></i>' +
            '<p style="font-size:13px;">Loading Atelier Inventory from Database...</p>' +
        '</div>'
    );

    var token = localStorage.getItem("token") || "";

    $.ajax({
        url: BASE_URL + "/inventory/all",
        method: "GET",
        headers: token ? { "Authorization": "Bearer " + token } : {},
        success: function (products) {
            posProducts = [];

            if (!products || products.length === 0) {
                grid.html(
                    '<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:var(--text-muted);">' +
                        '<i class="fa-solid fa-box-open" style="font-size:32px;color:var(--gold-primary);opacity:0.5;margin-bottom:12px;display:block;"></i>' +
                        '<p style="font-size:14px;font-weight:600;">No jewellery items found in database.</p>' +
                        '<span style="font-size:12px;">Add pieces via the Jewellery Inventory section first.</span>' +
                    '</div>'
                );
                return;
            }

            // Map each product from DB with accurate pricing
            $.each(products, function (index, item) {
                var isImitation = (item.itemType === "IMITATION");
                var calculatedPrice = 0;
                var karatDisplay = "";

                if (isImitation) {
                    calculatedPrice = (item.price && item.price > 0) ? item.price : 0;
                    karatDisplay = item.material || "18K PVD";
                } else {
                    // Gold item: Weight (g) × 22K Spot Rate × (1 + wastage%) + Labour Cost
                    var weight = item.weight || 0;
                    var wastage = item.wastage || 0;
                    var labour = item.labourCost || 0;
                    var goldValue = weight * liveRates.rate22K;
                    var wastageValue = goldValue * (wastage / 100);
                    calculatedPrice = Math.round(goldValue + wastageValue + labour);
                    karatDisplay = item.material || "22K Gold";
                }

                posProducts.push({
                    id:              "inv-" + item.id,
                    productId:       item.id,
                    name:            item.name,
                    weight:          item.weight || 0,
                    wastage:         item.wastage || 0,
                    labourCost:      item.labourCost || 0,
                    categoryId:      item.categoryId,
                    itemType:        item.itemType || (isImitation ? "IMITATION" : "GOLD"),
                    image:           item.image || "",
                    price:           calculatedPrice,
                    material:        item.material || "",
                    displayKarat:    karatDisplay
                });
            });

            console.log("[POS] Successfully loaded", posProducts.length, "inventory items from database.");
            renderPosGrid();
        },
        error: function (err) {
            console.error("[POS] Failed to fetch inventory from database:", err.status, err.statusText);
            grid.html(
                '<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:#ef4444;">' +
                    '<i class="fa-solid fa-triangle-exclamation" style="font-size:28px;margin-bottom:10px;display:block;"></i>' +
                    '<p style="font-weight:600;">Unable to connect to inventory service.</p>' +
                    '<span style="font-size:12px;color:var(--text-muted);">Please check if backend server is running on port 8080.</span>' +
                '</div>'
            );
        }
    });
}

// ─── 3. Load Customer Dropdown from Database ─────────────────────────────────
function loadCustomerDropdown() {
    var select = $("#customer-select");
    var token = localStorage.getItem("token") || "";

    $.ajax({
        url: BASE_URL + "/customers/all",
        method: "GET",
        headers: token ? { "Authorization": "Bearer " + token } : {},
        success: function (customers) {
            select.empty();

            // Default walk-in client
            select.append('<option value="0">Walk-in Boutique Client</option>');

            if (customers && customers.length > 0) {
                $.each(customers, function (i, c) {
                    var contactStr = c.contact ? " · " + c.contact : "";
                    select.append('<option value="' + c.id + '">' + c.name + contactStr + '</option>');
                });
                console.log("[POS] Customer dropdown populated with", customers.length, "patrons from DB.");
            }
        },
        error: function (err) {
            console.error("[POS] Failed to load patrons from DB:", err.status, err.statusText);
            select.empty();
            select.append('<option value="0">Walk-in Boutique Client</option>');
        }
    });
}

// ─── 4. Category Switching & Search Filtering ────────────────────────────────
function switchPosCategory(cat) {
    activePosCategory = cat;

    if (cat === 'lifestyle') {
        $("#btnToggleLifestyle").addClass("active");
        $("#btnToggleHeritage").removeClass("active");
    } else {
        $("#btnToggleHeritage").addClass("active");
        $("#btnToggleLifestyle").removeClass("active");
    }

    renderPosGrid();
}

function filterPosItems() {
    renderPosGrid();
}

// ─── 5. Render Product Grid ───────────────────────────────────────────────────
function renderPosGrid() {
    var grid  = $("#pos-item-grid");
    var query = ($("#pos-search-input").val() || "").trim().toLowerCase();
    grid.empty();

    // Filter by active category (Heritage Gold vs Lifestyle Imitation)
    var filtered = posProducts.filter(function (item) {
        var isImt = (item.itemType === "IMITATION");
        var matchesCat = (activePosCategory === "lifestyle") ? isImt : !isImt;

        if (!matchesCat) return false;

        if (query) {
            var matchName = item.name && item.name.toLowerCase().indexOf(query) !== -1;
            var matchKarat = item.displayKarat && item.displayKarat.toLowerCase().indexOf(query) !== -1;
            var matchWeight = String(item.weight).indexOf(query) !== -1;
            var matchMaterial = item.material && item.material.toLowerCase().indexOf(query) !== -1;
            return matchName || matchKarat || matchWeight || matchMaterial;
        }

        return true;
    });

    if (filtered.length === 0) {
        var emptyNotice = (activePosCategory === "lifestyle")
            ? "No lifestyle imitation pieces found matching your criteria."
            : "No heritage gold heirlooms found matching your criteria.";

        grid.html(
            '<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:var(--text-muted);">' +
                '<i class="fa-solid ' + (activePosCategory === "lifestyle" ? "fa-gem" : "fa-coins") + '" style="font-size:32px;color:var(--gold-primary);opacity:0.4;margin-bottom:12px;display:block;"></i>' +
                '<p style="font-size:14px;font-weight:600;">' + emptyNotice + '</p>' +
                '<span style="font-size:12px;">Add new pieces in the Jewellery Inventory tab.</span>' +
            '</div>'
        );
        return;
    }

    // Render cards
    $.each(filtered, function (i, item) {
        var priceDisplay = item.price > 0 ? formatLKR(item.price) : "Price N/A";
        var isImt = (item.itemType === "IMITATION");

        var mediaContent = '';
        if (item.image) {
            mediaContent = '<img src="' + item.image + '" alt="' + item.name + '" style="width:100%;height:100%;object-fit:cover;">';
        } else {
            mediaContent =
                '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#FAF9F6;">' +
                    '<i class="fa-solid ' + (isImt ? 'fa-gem' : 'fa-coins') + '" style="font-size:36px;color:var(--gold-primary);opacity:0.4;"></i>' +
                '</div>';
        }

        var specText = isImt
            ? (item.material || "18K PVD Anti-Tarnish")
            : (item.weight ? item.weight + "g &bull; " + item.displayKarat : item.displayKarat);

        var card = $('<article class="pos-item-card" style="cursor:pointer;" title="Click to add to bill"></article>');

        card.on("click", function () {
            addToPosBill(item);
        });

        card.html(
            '<div class="pos-item-thumb">' +
                '<span class="pos-item-badge-corner">' + item.displayKarat + '</span>' +
                mediaContent +
            '</div>' +
            '<div class="pos-item-details">' +
                '<h4 class="pos-item-name font-serif">' + item.name + '</h4>' +
                '<p class="pos-item-spec">' + specText + '</p>' +
                '<div class="pos-item-price-row">' +
                    '<div>' +
                        '<span style="font-size:9.5px;text-transform:uppercase;color:var(--text-muted);">' + (isImt ? 'Store Price' : 'Calculated Rate') + '</span>' +
                        '<div class="pos-price-sans">' + priceDisplay + '</div>' +
                    '</div>' +
                    '<button type="button" class="header-action-btn" style="width:30px;height:30px;" title="Add to Bill">' +
                        '<i class="fa-solid fa-plus" style="font-size:11px;"></i>' +
                    '</button>' +
                '</div>' +
            '</div>'
        );

        grid.append(card);
    });
}

// ─── 6. Cart Management ───────────────────────────────────────────────────────
function addToPosBill(item) {
    var existingItem = null;

    $.each(cartItems, function (i, ci) {
        if (ci.productId === item.productId) {
            existingItem = ci;
            return false;
        }
    });

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cartItems.push({
            id:        item.id,
            productId: item.productId,
            name:      item.name,
            karat:     item.displayKarat,
            price:     item.price,
            qty:       1,
            image:     item.image
        });
    }

    renderReceipt();

    // Auto-scroll cart list to bottom so the user immediately sees the added item
    var listContainer = $("#pos-cart-items");
    if (listContainer.length) {
        listContainer.animate({ scrollTop: listContainer[0].scrollHeight }, 200);
    }
}

function updateQty(index, delta) {
    if (!cartItems[index]) return;
    cartItems[index].qty += delta;
    if (cartItems[index].qty <= 0) {
        cartItems.splice(index, 1);
    }
    renderReceipt();
}

function removeItem(index) {
    if (cartItems[index]) {
        cartItems.splice(index, 1);
    }
    renderReceipt();
}

// ─── 7. Render Receipt / Floating Invoice ─────────────────────────────────────
function renderReceipt() {
    var listContainer = $("#pos-cart-items");
    listContainer.empty();

    if (cartItems.length === 0) {
        listContainer.html(
            '<div style="text-align:center;padding:36px 12px;color:var(--text-muted);">' +
                '<i class="fa-solid fa-cart-arrow-down" style="font-size:26px;color:var(--border-gold);opacity:0.6;margin-bottom:8px;display:block;"></i>' +
                '<p style="font-size:13px;font-weight:600;margin-bottom:2px;">Boutique bag is empty.</p>' +
                '<span style="font-size:11px;">Click pieces on the left to add to sale.</span>' +
            '</div>'
        );
        updateTotals(0);
        return;
    }

    var grossSubtotal = 0;

    $.each(cartItems, function (index, item) {
        var lineTotal = item.price * item.qty;
        grossSubtotal += lineTotal;

        var row = $('<div class="receipt-item-line"></div>');
        row.html(
            '<div class="receipt-item-info">' +
                '<span class="receipt-item-title" title="' + item.name + '">' + item.name + '</span>' +
                '<span class="receipt-item-sub">' + item.karat + ' &bull; ' + formatLKR(item.price) + '</span>' +
            '</div>' +
            '<div class="receipt-item-qty-ctrl">' +
                '<button type="button" class="receipt-qty-btn" onclick="updateQty(' + index + ', -1)" title="Decrease">&minus;</button>' +
                '<span class="receipt-qty-count">' + item.qty + '</span>' +
                '<button type="button" class="receipt-qty-btn" onclick="updateQty(' + index + ', 1)" title="Increase">&plus;</button>' +
            '</div>' +
            '<span class="receipt-item-price-sans">' + formatLKR(lineTotal) + '</span>' +
            '<button type="button" class="receipt-remove-btn" onclick="removeItem(' + index + ')" title="Remove piece">' +
                '<i class="fa-solid fa-xmark"></i>' +
            '</button>'
        );

        listContainer.append(row);
    });

    updateTotals(grossSubtotal);
}

function updateTotals(subtotal) {
    // 8% Wastage & Atelier Crafting fee on gross subtotal
    var makingCharges = Math.round(subtotal * 0.08);
    var discount      = 0;
    var grandTotal    = subtotal + makingCharges - discount;

    $("#bill-subtotal").text(formatLKR(subtotal));
    $("#bill-making-charges").text(formatLKR(makingCharges));
    $("#bill-discount").text("- " + formatLKR(discount));
    $("#grand-total").text(formatLKR(grandTotal));
}

function applyPatronDiscount() {
    renderReceipt();
}

// ─── 8. Complete Sale & Place Order in Database ───────────────────────────────
function processSaleInvoice() {
    if (cartItems.length === 0) {
        alert("Cannot generate an invoice for an empty cart. Please add items first.");
        return;
    }

    var customerIdVal = parseInt($("#customer-select").val()) || 0;
    var patronName = $("#customer-select option:selected").text();
    var grandTotalText = $("#grand-total").text();
    var docketCode = currentDocketNumber;

    var orderPayload = {
        customerId: customerIdVal,
        discount:   0.0,
        items: cartItems.map(function (item) {
            return {
                productId: item.productId,
                qty:       item.qty
            };
        })
    };

    var btn = $("#btn-complete-sale");
    btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> <span>Processing Invoice...</span>');

    $.ajax({
        url: BASE_URL + "/orders/place",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + (localStorage.getItem("token") || "") },
        data: JSON.stringify(orderPayload),
        success: function (response) {
            var totalPieces = 0;
            $.each(cartItems, function (i, ci) { totalPieces += ci.qty; });

            // Populate receipt modal
            document.getElementById("receiptModalSubtext").innerText = "Invoice " + docketCode + " issued and audited";
            document.getElementById("receiptModalContent").innerHTML =
                '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                    '<span style="color:var(--text-muted);">Invoice Docket:</span>' +
                    '<strong style="color:var(--gold-deep);font-family:monospace;">' + docketCode + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                    '<span style="color:var(--text-muted);">Patron:</span>' +
                    '<strong style="color:var(--text-main);">' + patronName.split("·")[0].trim() + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                    '<span style="color:var(--text-muted);">Purchased:</span>' +
                    '<strong>' + totalPieces + ' Pieces</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:6px;border-top:1px solid var(--border-light);">' +
                    '<span style="font-weight:800;text-transform:uppercase;">Amount Paid:</span>' +
                    '<strong style="font-family:\'Inter\',sans-serif;font-size:18px;font-weight:800;color:var(--gold-deep);">' + grandTotalText + '</strong>' +
                '</div>';

            document.getElementById("receiptModal").style.display = "flex";

            // Prepare next transaction docket
            currentDocketNumber = generateDocketNumber();
            updateDocketDisplay();

            console.log("[POS] Order recorded in database:", response, "| Docket:", docketCode);
        },
        error: function (err) {
            console.error("[POS] Failed to place order:", err.status, err.responseText);
            alert("Sale could not be finalized (" + err.status + "). Please check console for details.");
        },
        complete: function () {
            btn.prop("disabled", false).html('<i class="fa-solid fa-file-invoice-dollar"></i> <span>Generate Invoice &amp; Complete Sale</span>');
        }
    });
}

// ─── 9. Reset POS Bill ────────────────────────────────────────────────────────
function resetPosBill() {
    cartItems = [];
    renderReceipt();
    console.log("[POS] Transaction completed. Ready for next patron.");
}

// Expose functions globally for inline HTML events
window.loadProductsToPOS   = loadProductsToPOS;
window.switchPosCategory   = switchPosCategory;
window.filterPosItems      = filterPosItems;
window.addToPosBill        = addToPosBill;
window.updateQty           = updateQty;
window.removeItem          = removeItem;
window.applyPatronDiscount = applyPatronDiscount;
window.processSaleInvoice  = processSaleInvoice;
window.resetPosBill        = resetPosBill;