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

## Security Review

### Vulnerabilities identified
- DOM-Based Cross-Site Scripting (DOM XSS)

### Vulnerable implementation
- **Location:** `client/app.js` (lines 10–24)
- **Source of untrusted data:** URL query parameter via `window.location.search` (`?name=...`)
- **Dangerous sink:** `app.innerHTML`
- **Why insecure:** Untrusted input from the URL parameter is directly interpolated into `innerHTML`. The browser interprets this string as HTML, allowing arbitrary JavaScript execution if an attacker provides a script or event-handler payload.

### Security fixes
- Replaced `app.innerHTML` with safe DOM construction using `document.createElement()`.
- Used `textContent` to render dynamic user input (`username`) and profile fields, ensuring the browser treats the input strictly as plain text instead of executable HTML markup.

### Testing and verification
- **Positive scenario:**
  - Input: `http://localhost:3000/?name=Alice`
  - Result: Application functions normally and displays "Welcome, Alice".
- **Negative scenario:**
  - Input: `http://localhost:3000/?name=<img src=x onerror=alert('XSS')>`
  - Result: No script executes; the payload is safely rendered as harmless plain text.

### Defense-in-depth approach
- Safe DOM APIs (`textContent`) prevent untrusted data from being parsed as markup.
- This will be paired with a Content Security Policy (CSP) to restrict script execution as an additional layer of defense.

## Setup

Install dependencies:

```bash
npm install
```

Start the application::

```bash
npm start
```