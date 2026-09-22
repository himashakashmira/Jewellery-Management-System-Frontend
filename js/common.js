// js/common.js — Shared API utilities for AURUM Jewels Frontend

const BASE_URL = "http://localhost:8080/api/v1";

// ─── Auth Utilities ───────────────────────────────────────────────────────────

/** Returns jQuery AJAX headers object with JWT Bearer token */
function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": "Bearer " + token } : {};
}

/**
 * Central AJAX helper. Automatically attaches JWT header.
 * @param {string} url - relative path e.g. "/gold-rates/latest"
 * @param {Object} options - jQuery AJAX options override
 * @returns {jqXHR} jQuery deferred promise
 */
function apiFetch(url, options = {}) {
    return $.ajax(Object.assign({
        url: BASE_URL + url,
        method: "GET",
        headers: authHeaders(),
        contentType: "application/json"
    }, options));
}

/** Format a number as Sri Lankan Rupees */
function formatLKR(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return "Rs. 0.00";
    return "Rs. " + Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Redirect to login if no token is present */
function guardAuth() {
    if (!localStorage.getItem("token")) {
        window.location.href = "index.html";
    }
}

// Sidebar & Nav

$(document).ready(function () {
    // Load Sidebar across all pages
    if ($('#sidebar-container').length) {
        $('#sidebar-container').load('sidebar.html', function () {
            highlightActiveLink();
            applyRoleSecurity();
        });
    }
    applyRoleSecurity();
});

function highlightActiveLink() {
    const currentPath = window.location.pathname.split("/").pop();
    $('.nav-link').each(function () {
        if ($(this).attr('href') === currentPath) {
            $(this).addClass('active');
        }
    });
}

function applyRoleSecurity() {
    const role = localStorage.getItem("role");

    if (role === "ROLE_STAFF") {
        // hide admin features for staff
        $('#nav-gold-rates').hide();
        $('#nav-reports').hide();
        $('.btn-admin-only').hide();
        $('.staff-approval-action').show();
    } else if (role === "ROLE_ADMIN") {
        // The admin panel does not need the approve section
        $('.staff-approval-action').hide();
        $('.btn-approve-order').hide();
    }
}

// ─── 3. Atelier Low-Stock Notification Engine ────────────────────────────────
var _lowStockNotifications = [];

$(document).ready(function () {
    initNotificationSystem();
});

function initNotificationSystem() {
    // Locate notification bell buttons on any page
    var bellBtn = $("#headerNotificationBtn");
    if (!bellBtn.length) {
        bellBtn = $(".header-action-btn:has(.fa-bell)");
        if (bellBtn.length) {
            bellBtn.attr("id", "headerNotificationBtn");
            bellBtn.attr("onclick", "toggleNotificationDropdown(event)");
            if (!bellBtn.parent().hasClass("notification-dropdown-wrapper")) {
                bellBtn.wrap('<div class="notification-dropdown-wrapper" style="position:relative;display:inline-block;"></div>');
            }
            if (!$("#headerNotificationPanel").length) {
                bellBtn.parent().append(`
                    <span class="header-badge-count" id="headerNotificationCount" style="display:none; position:absolute; top:-4px; right:-4px; background:#e11d48; color:#fff; font-size:10px; font-weight:800; border-radius:10px; padding:1px 5px; line-height:1.2; box-shadow:0 2px 6px rgba(225,29,72,0.4); z-index:5;">0</span>
                    <div class="notification-dropdown-panel" id="headerNotificationPanel" style="display:none; position:absolute; top:calc(100% + 12px); right:0; width:360px; max-width:92vw; background:rgba(255,255,255,0.98); backdrop-filter:blur(24px); border:1.5px solid rgba(197,160,89,0.35); border-radius:16px; box-shadow:0 20px 48px rgba(0,0,0,0.18); z-index:1000; overflow:hidden;"></div>
                `);
            }
        }
    }

    // Refresh stock alerts
    refreshHeaderNotifications();

    // Close dropdown on outside click
    $(document).on("click", function (e) {
        if (!$(e.target).closest(".notification-dropdown-wrapper").length) {
            $("#headerNotificationPanel").fadeOut(150);
        }
    });
}

function refreshHeaderNotifications() {
    // 1. Check local storage inventory
    var imtItems = [];
    try {
        var raw = localStorage.getItem("aurum_inventory_imitation");
        if (raw) imtItems = JSON.parse(raw);
    } catch (e) {}

    // Attempt backend fetch if available, else calculate from stored
    $.ajax({
        url: BASE_URL + "/inventory/low-stock?threshold=3",
        method: "GET",
        headers: authHeaders(),
        success: function (data) {
            if (data && Array.isArray(data)) {
                processLowStockList(data);
            } else {
                calculateFromLocal();
            }
        },
        error: function () {
            calculateFromLocal();
        }
    });

    function calculateFromLocal() {
        var lowList = imtItems.filter(function (item) {
            var st = parseInt(item.stock !== undefined ? item.stock : 10);
            return !isNaN(st) && st <= 3;
        });
        processLowStockList(lowList);
    }
}

function processLowStockList(list) {
    _lowStockNotifications = list || [];
    var count = _lowStockNotifications.length;

    var badge = $("#headerNotificationBadge");
    var countBadge = $("#headerNotificationCount");

    if (count > 0) {
        if (badge.length) badge.show().css({ "background": "#e11d48", "animation": "pulse 1.5s infinite" });
        if (countBadge.length) {
            countBadge.text(count).show();
        }
    } else {
        if (badge.length) badge.hide();
        if (countBadge.length) countBadge.hide();
    }

    renderNotificationDropdownPanel();
}

function toggleNotificationDropdown(event) {
    if (event) event.stopPropagation();
    var panel = $("#headerNotificationPanel");
    if (!panel.length) return;

    if (panel.is(":visible")) {
        panel.fadeOut(150);
    } else {
        refreshHeaderNotifications();
        panel.fadeIn(200);
    }
}

function renderNotificationDropdownPanel() {
    var panel = $("#headerNotificationPanel");
    if (!panel.length) return;

    var count = _lowStockNotifications.length;

    var html = `
        <div style="padding:16px 20px; background:linear-gradient(135deg, #1C1917 0%, #292524 100%); color:#FFF; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(197,160,89,0.3);">
            <div>
                <div style="font-family:'Playfair Display', serif; font-size:16px; font-weight:700; color:#F5E6BE; display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-bell" style="color:var(--gold-primary);"></i> Atelier Alerts
                </div>
                <div style="font-size:11px; color:#A8A29E; margin-top:2px;">Real-time low-stock inventory telemetry</div>
            </div>
            <span style="font-size:11px; font-weight:700; background:${count > 0 ? '#e11d48' : '#10b981'}; color:#FFF; padding:3px 9px; border-radius:12px;">
                ${count} Shortage${count === 1 ? '' : 's'}
            </span>
        </div>
        <div style="max-height:340px; overflow-y:auto; padding:8px 0; background:#FFF;">
    `;

    if (count === 0) {
        html += `
            <div style="text-align:center; padding:36px 20px; color:var(--text-muted);">
                <i class="fa-solid fa-circle-check" style="font-size:32px; color:#10b981; margin-bottom:10px; display:block;"></i>
                <div style="font-weight:700; font-size:13px; color:var(--text-main); margin-bottom:4px;">Vault Stock Healthy</div>
                <div style="font-size:11.5px;">All imitation and gold pieces exceed safety stock thresholds.</div>
            </div>
        `;
    } else {
        $.each(_lowStockNotifications, function (idx, item) {
            var st = parseInt(item.stock !== undefined ? item.stock : 0);
            var isOut = st <= 0;
            var sku = (item.itemType === 'IMITATION' || !item.weight ? '#IMT-' : '#JWL-') + String(item.id).padStart(4, '0');
            var imgHtml = item.image
                ? `<img src="${item.image}" alt="${item.name}" style="width:44px; height:44px; border-radius:8px; object-fit:cover; border:1px solid rgba(197,160,89,0.3);">`
                : `<div style="width:44px; height:44px; border-radius:8px; background:#FAF9F6; display:flex; align-items:center; justify-content:center; border:1px solid rgba(197,160,89,0.3);"><i class="fa-solid fa-gem" style="color:var(--gold-primary);"></i></div>`;

            var statusBadge = isOut
                ? `<span style="display:inline-block; font-size:10px; font-weight:700; background:#fee2e2; color:#b91c1c; padding:2px 7px; border-radius:6px;"><i class="fa-solid fa-circle-xmark"></i> OUT OF STOCK</span>`
                : `<span style="display:inline-block; font-size:10px; font-weight:700; background:#fef3c7; color:#92400e; padding:2px 7px; border-radius:6px;"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL: Only ${st} left</span>`;

            html += `
                <div style="padding:12px 18px; display:flex; gap:12px; align-items:center; border-bottom:1px solid #F3F4F6; transition:background 0.2s;" onmouseover="this.style.background='#FAF9F6'" onmouseout="this.style.background='#FFF'">
                    ${imgHtml}
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:10px; font-weight:700; color:var(--gold-deep); letter-spacing:0.04em;">${sku}</div>
                        <div style="font-size:12.5px; font-weight:600; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
                        <div style="margin-top:4px;">${statusBadge}</div>
                    </div>
                    <button type="button" onclick="handleNotificationStockClick('${item.id}')" style="background:var(--gold-primary); color:#FFF; border:none; border-radius:8px; padding:6px 10px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px; flex-shrink:0; box-shadow:0 2px 6px rgba(197,160,89,0.3);">
                        <i class="fa-solid fa-pen-to-square"></i> Restock
                    </button>
                </div>
            `;
        });
    }

    html += `
        </div>
        <div style="padding:10px 18px; background:#FAF9F6; border-top:1px solid #E5E7EB; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:var(--text-muted);"><i class="fa-solid fa-shield-halved"></i> Automated Atelier Sentry</span>
            <button type="button" onclick="$('#headerNotificationPanel').fadeOut(150)" style="background:none; border:none; color:var(--text-main); font-size:11px; font-weight:600; cursor:pointer;">Dismiss</button>
        </div>
    `;

    panel.html(html);
}

function handleNotificationStockClick(itemId) {
    $("#headerNotificationPanel").fadeOut(100);
    // If currently on inventory.html and openEditModal is defined
    if (typeof openEditModal === "function") {
        var numId = parseInt(itemId);
        openEditModal(isNaN(numId) ? itemId : numId);
    } else {
        // Navigate to inventory.html with edit query param
        window.location.href = "inventory.html?edit=" + encodeURIComponent(itemId);
    }
}