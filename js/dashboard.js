// js/dashboard.js
$(document).ready(function() {
    fetchLatestRates();
});

function fetchLatestRates() {
    $.ajax({
        url: BASE_URL + "/gold-rates/latest",
        method: "GET",
        success: function(res) {
            // IDs must match your HTML
            $('#rate-22k').text("Rs. " + res.rate22K.toLocaleString());
            $('#rate-24k').text("Rs. " + res.rate24K.toLocaleString());
            $('#market-date').text(new Date(res.updatedAt).toLocaleDateString());
        }
    });
}