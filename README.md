# Modern Front-End Security – Vulnerable Starter Project

## Overview

This project is a deliberately vulnerable User Security Dashboard
created for the Modern Front-End Security Concepts training assignment.

## Technologies

- HTML
- CSS
- Vanilla JavaScript
- Node.js
- Express

## Setup

Install dependencies:

```bash
npm install
```

Start the application::

```bash
npm start
```

## Security Review

### 1. DOM-Based Cross-Site Scripting (DOM XSS)

* **Vulnerabilities identified:**
  * DOM-Based Cross-Site Scripting (DOM XSS)
* **Vulnerable implementation:**
  * **Location:** `client/app.js` (lines 10–24)
  * **Source of untrusted data:** URL query parameter via `window.location.search` (`?name=...`)
  * **Dangerous sink:** `app.innerHTML`
  * **Why insecure:** Untrusted input from the URL parameter is directly interpolated into `innerHTML`. The browser interprets this string as HTML, allowing arbitrary JavaScript execution if an attacker provides a script or event-handler payload.
* **Security fixes:**
  * Replaced `app.innerHTML` with safe DOM construction using `document.createElement()`.
  * Used `textContent` to render dynamic user input (`username`) and profile fields, ensuring the browser treats the input strictly as plain text instead of executable HTML markup.
* **Testing and verification:**
  * **Positive scenario:**
    * Input: `http://localhost:3000/?name=Alice`
    * Result: Application functions normally and displays "Welcome, Alice".
  * **Negative scenario:**
    * Input: `http://localhost:3000/?name=<img src=x onerror=alert('XSS')>`
    * Result: No script executes; the payload is safely rendered as harmless plain text.
* **Defense-in-depth approach:**
  * Safe DOM APIs (`textContent`) prevent untrusted data from being parsed as markup.
  * This will be paired with a Content Security Policy (CSP) to restrict script execution as an additional layer of defense.

### 2. Prototype Pollution

* **Vulnerabilities identified:**
  * Prototype Pollution & Unsafe Dynamic Property Assignment
* **Vulnerable implementation:**
  * **Location:** `client/app.js` (`prepareSettings`) and `server/server.js` (`POST /api/settings`)
  * **Source of untrusted data:** User-controlled JSON payload in settings submission
  * **Why insecure:** The application dynamically copied arbitrary property names using `settings[key] = incomingSettings[key]` without an allowlist. Attackers could inject dangerous properties (`__proto__`, `constructor`, `prototype`) to pollute object prototypes or inject unauthorized fields like `role` or `isAdmin`.
* **Security fixes:**
  * Implemented an allowlist of permitted keys (`ALLOWED_SETTINGS = new Set(["theme", "language", "fontSize"])`) on both client and server.
  * Explicitly blocked dangerous prototype keys (`__proto__`, `constructor`, `prototype`).
  * Only allowlisted properties are copied to the settings object.
* **Testing and verification:**
  * **Positive scenario:**
    * Input: Valid settings via UI (Theme: "Dark", Language: "French", Font Size: "Large") and save.
    * Result: Settings save successfully and status displays "Settings saved successfully.".
  * **Negative scenario:**
    * Input: Submitting `{ "__proto__": { "polluted": true }, "isAdmin": true, "theme": "dark" }`.
    * Result: `__proto__` and `isAdmin` are rejected and filtered out. `({}).polluted` remains `undefined`, and unauthorized properties are discarded.
* **Defense-in-depth approach:**
  * Client-side validation in `prepareSettings` sanitizes data before sending.
  * Server-side validation in `POST /api/settings` ensures untrusted requests from any client cannot pollute objects.
  * Strict allowlisting rejects all unexpected properties instead of relying only on blocklists.

### 3. SSR Token Leakage

* **Vulnerabilities identified:**
  * SSR Token Leakage & Excessive Data Exposure
* **Vulnerable implementation:**
  * **Location:** `server/server.js` (`GET /` and `GET /api/profile`)
  * **Source of untrusted data / Security boundary:** Server-to-client serialization boundary
  * **Why insecure:** The server directly serialized the entire `user` object—including secret authentication tokens (`sessionToken` and `refreshToken`)—into the initial HTML payload (`window.initialUser = ...`) and API response. This violates the principle of data minimization and exposes sensitive credentials to client-side scripts, browser extensions, and potential XSS exploits.
* **Security fixes:**
  * Implemented a Data Transfer Object (DTO) pattern via `getUserDTO(userData)` on the server.
  * Only safe user attributes required for UI display (`id`, `name`, `email`, `role`) are serialized across the server-to-browser boundary.
  * Sensitive tokens (`sessionToken`, `refreshToken`) remain strictly on the server and are never sent to the browser.
* **Testing and verification:**
  * **Positive scenario:**
    * Input: Navigating to `http://localhost:3000/`.
    * Result: The dashboard renders all user details correctly (Name: "John Doe", Email: "john@example.com", Role: "Administrator").
  * **Negative scenario:**
    * Input: Inspecting `window.initialUser` in DevTools Console or checking response of `GET /api/profile`.
    * Result: `window.initialUser.sessionToken` and `window.initialUser.refreshToken` are both `undefined`. Sensitive tokens are completely hidden from the browser.
* **Defense-in-depth approach:**
  * Data Minimization / DTO ensures only required non-sensitive fields leave the server.
  * Where authentication tokens are needed by the browser, they should be stored in secure, `HttpOnly`, `SameSite` cookies rather than readable JavaScript properties.

### 4. Content Security Policy (CSP)

* **Vulnerabilities identified:**
  * Missing Content Security Policy (CSP) Header
* **Vulnerable implementation:**
  * **Location:** `server/server.js` (HTTP response handling)
  * **Source of untrusted data / Security boundary:** Browser execution environment & resource loading
  * **Why insecure:** The server sent no `Content-Security-Policy` header. Without a restrictive CSP, the browser has no security policy to restrict the origin of scripts, styles, objects, or network connections. If any injection vulnerability exists, the browser executes unauthorized scripts without restriction.
* **Security fixes:**
  * Configured a robust HTTP response header for `Content-Security-Policy` using Express middleware:
    `default-src 'self'; script-src 'self' 'nonce-<random>'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self';`
  * Implemented per-request cryptographic nonces (`crypto.randomBytes(16).toString("base64")`) attached to legitimate inline scripts (`<script nonce="...">`).
  * Disabled Flash/plugins via `object-src 'none'` and restricted document base URIs via `base-uri 'self'`.
* **Testing and verification:**
  * **Positive scenario:**
    * Input: Navigating to `http://localhost:3000/` and `http://localhost:3000/account`.
    * Result: Legitimate scripts (`app.js`, inline bootstrap scripts with nonce) and styles load and execute without any console errors.
  * **Negative scenario:**
    * Input: Injecting an unauthorized external or non-nonced inline script in DevTools:
      `const s = document.createElement('script'); s.textContent = "alert('CSP Blocked')"; document.body.appendChild(s);`
    * Result: The browser blocks execution and logs a CSP violation in the DevTools console: *"Refused to execute inline script because it violates the following Content Security Policy directive: 'script-src 'self' 'nonce-...'""*.
* **Defense-in-depth approach:**
  * CSP acts as a crucial second line of defense; even if an input sanitization or DOM construction flaw is introduced, the browser refuses to execute untrusted scripts or connect to attacker origins.