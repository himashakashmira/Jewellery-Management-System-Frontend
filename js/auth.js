// js/auth.js — AURUM Login Authentication Handler

function handleLogin() {
    // ─── 1. Clear any stale session data ───────────────────────────────────────
    localStorage.clear();
    console.log("[AURUM Auth] Cleared localStorage. Starting fresh login.");

    // ─── 2. Read credentials from form ─────────────────────────────────────────
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        alert("Please enter both your username and password.");
        return;
    }

    // ─── 3. Disable button to prevent double-submit ─────────────────────────────
    const btn = document.getElementById('btn-login-submit');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Authenticating...</span>';
    }

    console.log("[AURUM Auth] Sending credentials for username:", username);

    // ─── 4. POST to backend /authenticate ──────────────────────────────────────
    $.ajax({
        url: "http://localhost:8080/api/v1/auth/authenticate",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            username: username,
            password: password
        }),

        // ─── SUCCESS: Token received ───────────────────────────────────────────
        success: function (response) {
            if (response && response.token) {
                console.log("[AURUM Auth] ✅ Token received successfully.");
                console.log("[AURUM Auth] Token (first 20 chars):", response.token.substring(0, 20) + "...");

                // Save token and username
                localStorage.setItem("token", response.token);
                localStorage.setItem("username", username);

                console.log("[AURUM Auth] Token saved to localStorage. Redirecting to dashboard...");

                // Redirect only AFTER token is saved
                window.location.href = "dashboard.html";

            } else {
                // Response came back but token was missing — should not happen
                console.error("[AURUM Auth] ❌ Response received but token is missing:", response);
                alert("Authentication error: no token received from server. Please contact support.");
                _resetLoginButton(btn);
            }
        },

        // ─── ERROR: Wrong credentials or server error ──────────────────────────
        error: function (xhr, status, errorThrown) {
            console.error("[AURUM Auth] ❌ Login failed.");
            console.error("[AURUM Auth] Status:", xhr.status, "—", xhr.statusText);
            console.error("[AURUM Auth] Response:", xhr.responseText);

            // Stay on the page — show a clear error message
            if (xhr.status === 401 || xhr.status === 403) {
                alert("⚠ Wrong username or password. Please try again.");
            } else if (xhr.status === 0) {
                alert("⚠ Cannot reach the server. Is the Spring Boot backend running on port 8080?");
            } else {
                alert("⚠ Login failed (" + xhr.status + "). Please try again.");
            }

            // Re-enable login button so user can retry
            _resetLoginButton(btn);
        }
    });
}

// ─── Helper: Restore Login Button ─────────────────────────────────────────────
function _resetLoginButton(btn) {
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> <span>Access Private Vault</span>';
    }
}