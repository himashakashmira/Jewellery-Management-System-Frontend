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

// ─── Sidebar & Nav ────────────────────────────────────────────────────────────

$(document).ready(function () {
    // Load Sidebar across all pages
    if ($('#sidebar-container').length) {
        $('#sidebar-container').load('sidebar.html', function () {
            highlightActiveLink();
        });
    }
});

function highlightActiveLink() {
    const currentPath = window.location.pathname.split("/").pop();
    $('.nav-link').each(function () {
        if ($(this).attr('href') === currentPath) {
            $(this).addClass('active');
        }
    });
}



$(document).ready(function () {
    // load the all pages check there
    checkPermissions();
});

function checkPermissions() {
    const role = localStorage.getItem("role");

    if (role === "ROLE_STAFF") {
        $('#nav-gold-rates').hide();

        $('#nav-reports').hide();

        $('#btn-adjust-rates').hide();

        console.log("Access restricted for STAFF member.");
    }
}