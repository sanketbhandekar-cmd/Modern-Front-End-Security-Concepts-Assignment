const express = require("express");
const path = require("path");
const crypto = require("crypto");

const { user, defaultSettings } = require("./data");

const app = express();
const PORT = 3000;

app.use(express.json());

// Middleware: Configure Content Security Policy (CSP)
app.use((req, res, next) => {
    const nonce = crypto.randomBytes(16).toString("base64");
    res.locals.nonce = nonce;

    res.setHeader(
        "Content-Security-Policy",
        `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self';`
    );
    next();
});

// Data Transfer Object (DTO) for data minimization across server-browser boundary
function getUserDTO(userData) {
    return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
    };
}

/*
 * Home page
 */
app.get("/", (req, res) => {
    const initialUserData = JSON.stringify(getUserDTO(user));

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >
            <title>User Security Dashboard</title>
            <link rel="stylesheet" href="/styles.css">
        </head>

        <body>
            <header class="header">
                <h1>User Security Dashboard</h1>
                <nav>
                    <a href="/">Dashboard</a>
                    <a href="/account">Account Settings</a>
                </nav>
            </header>

            <main class="container">
                <div id="app"></div>

                <section class="settings">
                    <h2>User Settings</h2>

                    <label>
                        Theme:
                        <select id="theme">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </label>

                    <label>
                        Language:
                        <select id="language">
                            <option value="en">English</option>
                            <option value="fr">French</option>
                        </select>
                    </label>

                    <label>
                        Font Size:
                        <select id="fontSize">
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </label>

                    <button id="save-settings">
                        Save Settings
                    </button>

                    <p id="settings-status"></p>
                </section>
            </main>

            <script nonce="${res.locals.nonce}">
                window.initialUser = ${initialUserData};
            </script>

            <script src="/app.js"></script>
        </body>
        </html>
    `);
});

/*
 * Profile API
 */
app.get("/api/profile", (req, res) => {
    res.json(getUserDTO(user));
});

/*
 * Settings API
 */
app.get("/api/settings", (req, res) => {
    res.json(defaultSettings);
});

const ALLOWED_SETTINGS = new Set(["theme", "language", "fontSize"]);

app.post("/api/settings", (req, res) => {
    const incomingSettings = req.body || {};

    const settings = {};

    for (const key of Object.keys(incomingSettings)) {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
            continue;
        }
        if (ALLOWED_SETTINGS.has(key)) {
            settings[key] = incomingSettings[key];
        }
    }

    res.json({
        message: "Settings saved successfully.",
        settings
    });
});

/*
 * Account page
 */
app.get("/account", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >
            <title>Account Settings</title>

            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f4f4f4;
                    margin: 0;
                    padding: 40px;
                }

                .account-card {
                    max-width: 600px;
                    margin: auto;
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                }

                .danger {
                    background: #c62828;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    cursor: pointer;
                    border-radius: 4px;
                }
            </style>
        </head>

        <body>
            <div class="account-card">
                <h1>Account Settings</h1>

                <p>
                    <strong>Name:</strong>
                    ${user.name}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${user.email}
                </p>

                <p>
                    <strong>Role:</strong>
                    ${user.role}
                </p>

                <button
                    id="delete-account"
                    class="danger"
                >
                    Delete Account
                </button>

                <p id="status"></p>
            </div>

            <script nonce="${res.locals.nonce}">
                document
                    .getElementById("delete-account")
                    .addEventListener("click", () => {
                        document.getElementById("status").textContent =
                            "Account deletion action triggered.";
                    });
            </script>
        </body>
        </html>
    `);
});

app.use(express.static(path.join(__dirname, "..", "client")));

app.listen(PORT, () => {
    console.log(`Application running at http://localhost:${PORT}`);
});