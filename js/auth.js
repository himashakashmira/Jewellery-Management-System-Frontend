function handleLogin() {
    // 1. Get credentials from input fields
    const username = $('#login-username').val();
    const password = $('#login-password').val();

    if (!username || !password) {
        alert("Please enter both username and password");
        return;
    }

    // 2. AJAX call to Backend
    $.ajax({
        url: "http://localhost:8080/api/v1/auth/authenticate",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            username: username,
            password: password
        }),
        success: function(response) {
            // 3. SUCCESS: Save Token to LocalStorage
            localStorage.setItem("token", response.token);
            
            // Optional: Save username for display
            localStorage.setItem("username", username);

            alert("Login Successful! Welcome to AURUM.");
            
            // Redirect to Dashboard
            window.location.href = "dashboard.html";
        },
        error: function(err) {
            console.error("Login Error:", err);
            alert("Login Failed! Please check your username and password.");
        }
    });
}