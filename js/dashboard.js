// dashboard.js

$(document).ready(function () {
    fetchLatestRates();
});

function fetchLatestRates() {
    $.ajax({
        url: "http://localhost:8080/api/v1/gold-rates/latest",
        method: "GET",
        success: function (res) {
            // update cards with animation effect
            if (res) {
                $('#rate-22k').text("Rs. " + res.rate22K.toLocaleString());
                $('#rate-24k').text("Rs. " + res.rate24K.toLocaleString());

                // update updated time
                const date = new Date(res.updatedAt);
                $('#last-update-time').text("Updated " + date.toLocaleTimeString());
                $('#dateDisplay').text(date.toLocaleDateString());
            }
        }
    });
}