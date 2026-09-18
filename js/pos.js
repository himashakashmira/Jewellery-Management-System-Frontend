// js/pos.js — Live API integration for AURUM Boutique Point of Sale

// ─── State ────────────────────────────────────────────────────────────────────
let posProducts = [];         // All inventory items fetched from API
let currentCategory = 'all'; // Filter state
let cartItems = [];           // Items added to bill: [{id, productId, name, weight, price, qty}]

$(document).ready(function () {
    guardAuth();
    loadProductsToPOS();
    loadCustomerDropdown();
    renderReceipt();
});

// ─── 1. Load Products with Live Calculated Prices ────────────────────────────

function loadProductsToPOS() {
    const grid = $('#pos-item-grid');
    grid.html('<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--gold-primary);"></i><p style="margin-top:12px;">Fetching inventory & calculating prices...</p></div>');

    apiFetch("/inventory/all")
        .done(function (products) {
            if (!products || products.length === 0) {
                grid.html('<p style="color:var(--text-muted);padding:40px;text-align:center;">No items found in inventory.</p>');
                return;
            }

            posProducts = [];
            let priceRequests = products.map(function (item) {
                return apiFetch("/gold-rates/price/" + item.id)
                    .done(function (finalPrice) {
                        posProducts.push({
                            id:        'inv-' + item.id,
                            productId:  item.id,
                            name:       item.name,
                            weight:     item.weight,
                            wastage:    item.wastage,
                            karat:      '22K Gold',
                            price:      finalPrice || 0,
                            type:       'heritage'
                        });
                    })
                    .fail(function () {
                        // Include with 0.00 if price calc fails
                        posProducts.push({
                            id:        'inv-' + item.id,
                            productId:  item.id,
                            name:       item.name,
                            weight:     item.weight,
                            karat:      '22K Gold',
                            price:      0,
                            type:       'heritage'
                        });
                        console.error("Price calculation failed for item ID:", item.id);
                    });
            });

            // Wait for ALL price requests then render
            $.when.apply($, priceRequests).always(function () {
                renderPosGrid();
            });
        })
        .fail(function (err) {
            console.error("Failed to load inventory for POS:", err.status, err.statusText);
            grid.html('<p style="color:#ef4444;padding:40px;text-align:center;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load items. Is the backend running?</p>');
        });
}

// ─── 2. Load Customer Dropdown ────────────────────────────────────────────────

function loadCustomerDropdown() {
    apiFetch("/customers/all")
        .done(function (customers) {
            const select = $('#customer-select');
            select.empty();
            // Add walk-in option first
            select.append('<option value="0">Walk-in Boutique Client</option>');
            customers.forEach(function (c) {
                select.append(`<option value="${c.id}">${c.name}${c.contact ? ' · ' + c.contact : ''}</option>`);
            });
        })
        .fail(function (err) {
            console.error("Failed to load customers:", err.status, err.statusText);
        });
}

// ─── 3. Render Product Grid ───────────────────────────────────────────────────

function renderPosGrid() {
    const grid = $('#pos-item-grid');
    const query = ($('#pos-search-input').val() || '').toLowerCase();
    grid.empty();

    const filtered = posProducts.filter(item => {
        const matchQuery = !query ||
            item.name.toLowerCase().includes(query) ||
            item.karat.toLowerCase().includes(query) ||
            String(item.weight).includes(query);
        return matchQuery;
    });

    if (filtered.length === 0) {
        grid.html('<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No matching jewellery items found.</div>');
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('article');
        card.className = 'pos-item-card';
        card.onclick = () => addToPosBill(item);
        card.innerHTML = `
            <div class="pos-item-thumb">
                <span class="pos-item-badge-corner">${item.karat}</span>
                <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#FAF9F6;">
                    <i class="fa-solid fa-gem" style="font-size:38px;color:var(--gold-primary);opacity:0.4;"></i>
                </div>
            </div>
            <div class="pos-item-details">
                <h4 class="pos-item-name font-serif">${item.name}</h4>
                <p class="pos-item-spec">${item.weight}g · ${item.karat}</p>
                <div class="pos-item-price-row">
                    <div>
                        <span style="font-size:9.5px;text-transform:uppercase;color:var(--text-muted);">Calculated Rate</span>
                        <div class="pos-price-sans">${item.price > 0 ? formatLKR(item.price) : 'N/A'}</div>
                    </div>
                    <button class="header-action-btn" style="width:28px;height:28px;" title="Add to Bill">
                        <i class="fa-solid fa-plus" style="font-size:10px;"></i>
                    </button>
                </div>
            </div>`;
        grid.append(card);
    });
}

function filterPosItems() {
    renderPosGrid();
}

// ─── 4. Cart Management ───────────────────────────────────────────────────────

function addToPosBill(item) {
    const existing = cartItems.find(i => i.id === item.id);
    if (existing) {
        existing.qty += 1;
    } else {
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
    const listContainer = $('#pos-cart-items');
    listContainer.empty();

    if (cartItems.length === 0) {
        listContainer.html(`
            <div style="text-align:center;padding:40px 10px;color:var(--text-muted);">
                <i class="fa-solid fa-cart-arrow-down" style="font-size:26px;color:var(--border-gold);margin-bottom:10px;"></i>
                <p style="font-size:13px;">Boutique bag is empty.</p>
                <span style="font-size:11px;">Click pieces on the left to add.</span>
            </div>`);
        updateTotals(0);
        return;
    }

    let grossSubtotal = 0;
    cartItems.forEach((item, index) => {
        const lineTotal = item.price * item.qty;
        grossSubtotal += lineTotal;
        const row = document.createElement('div');
        row.className = 'receipt-item-row';
        row.innerHTML = `
            <div class="receipt-item-info">
                <span class="receipt-item-title">${item.name}</span>
                <span class="receipt-item-sub">${item.karat} &bull; ${formatLKR(item.price)}</span>
            </div>
            <div class="receipt-qty-ctrl">
                <button class="receipt-qty-btn" onclick="updateQty(${index}, -1)" title="Decrease">&minus;</button>
                <span class="receipt-qty-count">${item.qty}</span>
                <button class="receipt-qty-btn" onclick="updateQty(${index}, 1)" title="Increase">&plus;</button>
            </div>
            <span class="receipt-line-total">${formatLKR(lineTotal)}</span>
            <button class="receipt-remove-btn" onclick="removeItem(${index})" title="Remove">
                <i class="fa-solid fa-xmark"></i>
            </button>`;
        listContainer.append(row);
    });

    updateTotals(grossSubtotal);
}

function updateTotals(subtotal) {
    const makingCharges = Math.round(subtotal * 0.08);
    const discount = 0; // Discount is applied on order placement via OrderDTO.discount
    const grandTotal = subtotal + makingCharges - discount;

    $('#bill-subtotal').text(formatLKR(subtotal));
    $('#bill-making-charges').text(formatLKR(makingCharges));
    $('#bill-discount').text('- ' + formatLKR(discount));
    $('#grand-total').text(formatLKR(grandTotal));
}

function applyPatronDiscount() {
    renderReceipt();
}

// ─── 6. Complete Sale — POST to Backend ──────────────────────────────────────

function processSaleInvoice() {
    if (cartItems.length === 0) {
        alert('Cannot invoice an empty cart. Please add items.');
        return;
    }

    const customerId = parseInt($('#customer-select').val()) || 0;
    const patronName = $('#customer-select option:selected').text();

    const orderPayload = {
        customerId: customerId,
        discount:   0.0,
        items: cartItems.map(item => ({
            productId: item.productId,
            qty:       item.qty
        }))
    };

    // Disable button to prevent double submission
    $('#btn-complete-sale').prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Processing...');

    apiFetch("/orders/place", {
        method: "POST",
        data:   JSON.stringify(orderPayload)
    })
    .done(function (response) {
        const grandTotal = $('#grand-total').text();
        document.getElementById('receiptModalContent').innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:var(--text-muted);">Patron:</span>
                <strong style="color:var(--text-main);">${patronName.split('·')[0].trim()}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:var(--text-muted);">Total Pieces:</span>
                <strong>${cartItems.reduce((a, b) => a + b.qty, 0)} Items</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border-light);">
                <span style="font-weight:800;text-transform:uppercase;">Amount Paid:</span>
                <strong style="font-family:'Inter',sans-serif;font-size:18px;font-weight:800;color:var(--gold-deep);">${grandTotal}</strong>
            </div>`;
        document.getElementById('receiptModal').style.display = 'flex';
    })
    .fail(function (err) {
        console.error("Failed to place order:", err.status, err.responseText);
        // If walk-in (customerId=0), backend will fail — inform user
        if (customerId === 0) {
            alert("Walk-in clients must be registered as patrons before completing an order. Please register the customer first.");
        } else {
            alert("Sale could not be completed. Please check console for details.");
        }
    })
    .always(function () {
        $('#btn-complete-sale').prop('disabled', false).html('<i class="fa-solid fa-file-invoice-dollar"></i> <span>Generate Invoice & Complete Sale</span>');
    });
}

function resetPosBill() {
    cartItems = [];
    renderReceipt();
}