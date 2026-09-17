$.ajaxSetup({
    beforeSend: function(xhr) {
        const token = localStorage.getItem("token");
        if (token) {
            // Automatically add Bearer token to every request
            xhr.setRequestHeader("Authorization", "Bearer " + token);
        }
    },
    error: function(xhr) {
        if (xhr.status === 403 || xhr.status === 401) {
            // If token is expired or missing, send user back to login
            alert("Session expired. Please login again.");
            localStorage.removeItem("token");
            window.location.href = "index.html";
        }
    }
});