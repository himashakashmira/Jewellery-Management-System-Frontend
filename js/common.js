const BASE_URL = "http://localhost:8080/api/v1";

$(document).ready(function() {
    // 1. Load Sidebar across all pages
    if ($('#sidebar-container').length) {
        $('#sidebar-container').load('sidebar.html', function() {
            highlightActiveLink();
        });
    }
});

function highlightActiveLink() {
    const currentPath = window.location.pathname.split("/").pop();
    $('.nav-link').each(function() {
        if ($(this).attr('href') === currentPath) {
            $(this).addClass('active');
        }
    });
}