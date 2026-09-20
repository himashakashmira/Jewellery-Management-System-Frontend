// js/pos.js — Point of Sale Engine for AURUM Boutique
// Student style: simple jQuery AJAX, one function per action

// ─── State ────────────────────────────────────────────────────────────────────
var posProducts     = [];     // all inventory items with calculated prices from backend
var cartItems       = [];     // items added to the active bill: [{id, productId, name, price, qty}]

$(document).ready(function () {
    // guard: redirect to login if no token
    guardAuth();

    // load inventory items and customer dropdown on page open
    loadProductsToPOS();
    loadCustomerDropdown();
    renderReceipt();
});

// ─── 1. Load Products & Fetch Live Prices ────────────────────────────────────
function loadProductsToPOS() {
    var grid = $("#pos-item-grid");

    // show loading state
    grid.html('<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--gold-primary);"></i><p style="margin-top:12px;">Fetching inventory &amp; calculating live prices...</p></div>');

    // step 1: calling the get all inventory api
    $.ajax({
        url: BASE_URL + "/inventory/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (products) {
            if (!products || products.length === 0) {
                grid.html('<p style="color:var(--text-muted);padding:40px;text-align:center;">No items found in inventory. Add pieces first.</p>');
                return;
            }

            posProducts = [];
            var pending = products.length;

            // step 2: for each product, call the price calculation api
            $.each(products, function (index, item) {
                $.ajax({
                    url: BASE_URL + "/gold-rates/price/" + item.id,
                    method: "GET",
                    headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
                    success: function (finalPrice) {
                        // adding item with live calculated price to posProducts array
                        posProducts.push({
                            id:        "inv-" + item.id,
                            productId:  item.id,
                            name:       item.name,
                            weight:     item.weight,
                            wastage:    item.wastage || 0,
                            karat:      "22K Gold",
                            price:      finalPrice || 0
                        });
                    },
                    error: function () {
                        // if price api fails, include item with 0 price
                        console.error("[POS] Price calculation failed for item ID:", item.id);
                        posProducts.push({
                            id:        "inv-" + item.id,
                            productId:  item.id,
                            name:       item.name,
                            weight:     item.weight,
                            karat:      "22K Gold",
                            price:      0
                        });
                    },
                    complete: function () {
                        // when all price requests are done, render the grid
                        pending--;
                        if (pending <= 0) {
                            renderPosGrid();
                            console.log("[POS] Loaded", posProducts.length, "items with live prices.");
                        }
                    }
                });
            });
        },
        error: function (err) {
            console.error("[POS] Failed to load inventory:", err.status, err.statusText);
            grid.html('<p style="color:#ef4444;padding:40px;text-align:center;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load items. Is the backend running?</p>');
        }
    });
}

// ─── 2. Load Customer Dropdown ────────────────────────────────────────────────
function loadCustomerDropdown() {
    // calling the get all customers api
    $.ajax({
        url: BASE_URL + "/customers/all",
        method: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        success: function (customers) {
            var select = $("#customer-select");
            select.empty();

            // always add walk-in as first option
            select.append('<option value="0">Walk-in Boutique Client</option>');

            // add each registered customer
            $.each(customers, function (i, c) {
                select.append('<option value="' + c.id + '">' + c.name + (c.contact ? " · " + c.contact : "") + '</option>');
            });

            console.log("[POS] Customer dropdown loaded:", customers.length, "patrons.");
        },
        error: function (err) {
            console.error("[POS] Failed to load customers:", err.status, err.statusText);
        }
    });
}

// ─── 3. Render Product Grid ───────────────────────────────────────────────────
function renderPosGrid() {
    var grid  = $("#pos-item-grid");
    var query = ($("#pos-search-input").val() || "").toLowerCase();
    grid.empty();

    // filter by search query if user typed something
    var filtered = [];
    $.each(posProducts, function (i, item) {
        var matchQuery = !query ||
            item.name.toLowerCase().indexOf(query) !== -1 ||
            item.karat.toLowerCase().indexOf(query) !== -1 ||
            String(item.weight).indexOf(query) !== -1;

        if (matchQuery) filtered.push(item);
    });

    if (filtered.length === 0) {
        grid.html('<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No matching jewellery items found.</div>');
        return;
    }

    // building a card for each item
    $.each(filtered, function (i, item) {
        var priceDisplay = item.price > 0 ? formatLKR(item.price) : "Price N/A";
        var card = $('<article class="pos-item-card" style="cursor:pointer;"></article>');

        // clicking the card adds it to the bill
        card.on("click", function () { addToPosBill(item); });

        card.html(
            '<div class="pos-item-thumb">' +
                '<span class="pos-item-badge-corner">' + item.karat + '</span>' +
                '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#FAF9F6;">' +
                    '<i class="fa-solid fa-gem" style="font-size:38px;color:var(--gold-primary);opacity:0.4;"></i>' +
                '</div>' +
            '</div>' +
            '<div class="pos-item-details">' +
                '<h4 class="pos-item-name font-serif">' + item.name + '</h4>' +
                '<p class="pos-item-spec">' + item.weight + 'g &bull; ' + item.karat + '</p>' +
                '<div class="pos-item-price-row">' +
                    '<div>' +
                        '<span style="font-size:9.5px;text-transform:uppercase;color:var(--text-muted);">Calculated Rate</span>' +
                        '<div class="pos-price-sans">' + priceDisplay + '</div>' +
                    '</div>' +
                    '<button class="header-action-btn" style="width:28px;height:28px;" title="Add to Bill">' +
                        '<i class="fa-solid fa-plus" style="font-size:10px;"></i>' +
                    '</button>' +
                '</div>' +
            '</div>'
        );

        grid.append(card);
    });
}

function filterPosItems() {
    renderPosGrid();
}

function switchPosCategory(cat) {
    $(".pos-toggle-tab").removeClass("active");
    $("#btnToggle" + cat.charAt(0).toUpperCase() + cat.slice(1)).addClass("active");
    renderPosGrid();
}

// ─── 4. Cart Management ───────────────────────────────────────────────────────
function addToPosBill(item) {
    // check if item already in cart — if so, increase qty
    var found = false;
    $.each(cartItems, function (i, ci) {
        if (ci.id === item.id) {
            ci.qty += 1;
            found = true;
            return false;
        }
    });

    if (!found) {
        cartItems.push({
            id:        item.id,
            productId: item.productId,
            name:      item.name,
            karat:     item.karat,
            price:     item.price,
            qty:       1
        });
    }

    renderReceipt();
}

function updateQty(index, delta) {
    if (!cartItems[index]) return;
    cartItems[index].qty += delta;
    if (cartItems[index].qty <= 0) cartItems.splice(index, 1);
    renderReceipt();
}

function removeItem(index) {
    cartItems.splice(index, 1);
    renderReceipt();
}

// ─── 5. Render Receipt ────────────────────────────────────────────────────────
function renderReceipt() {
    var listContainer = $("#pos-cart-items");
    listContainer.empty();

    if (cartItems.length === 0) {
        listContainer.html(
            '<div style="text-align:center;padding:40px 10px;color:var(--text-muted);">' +
                '<i class="fa-solid fa-cart-arrow-down" style="font-size:26px;color:var(--border-gold);margin-bottom:10px;"></i>' +
                '<p style="font-size:13px;">Boutique bag is empty.</p>' +
                '<span style="font-size:11px;">Click pieces on the left to add.</span>' +
            '</div>'
        );
        updateTotals(0);
        return;
    }

    var grossSubtotal = 0;

    $.each(cartItems, function (index, item) {
        var lineTotal = item.price * item.qty;
        grossSubtotal += lineTotal;

        var row = $('<div class="receipt-item-row"></div>');
        row.html(
            '<div class="receipt-item-info">' +
                '<span class="receipt-item-title">' + item.name + '</span>' +
                '<span class="receipt-item-sub">' + item.karat + ' &bull; ' + formatLKR(item.price) + '</span>' +
            '</div>' +
            '<div class="receipt-qty-ctrl">' +
                '<button class="receipt-qty-btn" onclick="updateQty(' + index + ', -1)" title="Decrease">&minus;</button>' +
                '<span class="receipt-qty-count">' + item.qty + '</span>' +
                '<button class="receipt-qty-btn" onclick="updateQty(' + index + ', 1)" title="Increase">&plus;</button>' +
            '</div>' +
            '<span class="receipt-line-total">' + formatLKR(lineTotal) + '</span>' +
            '<button class="receipt-remove-btn" onclick="removeItem(' + index + ')" title="Remove">' +
                '<i class="fa-solid fa-xmark"></i>' +
            '</button>'
        );

        listContainer.append(row);
    });

    updateTotals(grossSubtotal);
}

function updateTotals(subtotal) {
    // making charges = 8% of subtotal (standard atelier charge)
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

// ─── 6. Complete Sale — POST to Backend ──────────────────────────────────────
function processSaleInvoice() {
    if (cartItems.length === 0) {
        alert("Cannot invoice an empty cart. Please add items first.");
        return;
    }

    var customerId = parseInt($("#customer-select").val()) || 0;
    var patronName = $("#customer-select option:selected").text();
    var grandTotalText = $("#grand-total").text();

    var orderPayload = {
        customerId: customerId,
        discount:   0.0,
        items: (function () {
            var arr = [];
            $.each(cartItems, function (i, item) {
                arr.push({ productId: item.productId, qty: item.qty });
            });
            return arr;
        })()
    };

    // disable button to prevent double submission
    $("#btn-complete-sale").prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Processing...');

    // calling the place order api
    $.ajax({
        url: BASE_URL + "/orders/place",
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
        data: JSON.stringify(orderPayload),
        success: function (response) {
            var totalItems = 0;
            $.each(cartItems, function (i, ci) { totalItems += ci.qty; });

            // build and show success receipt modal
            document.getElementById("receiptModalContent").innerHTML =
                '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                    '<span style="color:var(--text-muted);">Patron:</span>' +
                    '<strong style="color:var(--text-main);">' + patronName.split("·")[0].trim() + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                    '<span style="color:var(--text-muted);">Total Pieces:</span>' +
                    '<strong>' + totalItems + ' Items</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border-light);">' +
                    '<span style="font-weight:800;text-transform:uppercase;">Amount Paid:</span>' +
                    '<strong style="font-family:\'Inter\',sans-serif;font-size:18px;font-weight:800;color:var(--gold-deep);">' + grandTotalText + '</strong>' +
                '</div>';

            document.getElementById("receiptModal").style.display = "flex";

            console.log("[POS] Sale completed. Customer:", patronName, "| Total:", grandTotalText);
        },
        error: function (err) {
            console.error("[POS] Failed to place order:", err.status, err.responseText);
            if (customerId === 0) {
                alert("Walk-in clients must be registered as patrons before completing an order. Please register the customer first.");
            } else {
                alert("Sale could not be completed (" + err.status + "). Check console for details.");
            }
        },
        complete: function () {
            // re-enable button after api call finishes
            $("#btn-complete-sale").prop("disabled", false).html('<i class="fa-solid fa-file-invoice-dollar"></i> <span>Generate Invoice &amp; Complete Sale</span>');
        }
    });
}

// ─── 7. Reset POS Bill After Sale ─────────────────────────────────────────────
function resetPosBill() {
    // clear the cart and re-render empty receipt after a sale is confirmed
    cartItems = [];
    renderReceipt();
    console.log("[POS] Bill reset. Ready for next customer.");
}