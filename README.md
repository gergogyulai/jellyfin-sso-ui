# Jellyfin SSO UI

This script aims to improve the [Jellyfin SSO Auth Plugin](https://github.com/9p4/jellyfin-plugin-sso) user experience within the Jellyfin web interface. 

While the backend SSO plugin is fine, it requires manual HTML/CSS branding for a login button and needs a separate, external-feeling page (`/SSOViews/linking`) to manage account links. This script integrates that functionality directly into the existing Jellyfin Web interface.

## Features
- **SSO Login Button**: Injects a "Sign in with SSO" button on the login page (no need for hacky "Manual Branding" in the Jellyfin settings).
- **Integrated Self-Service**: Implements all functionality of the plugin's dedicated linking page (`/SSOViews/linking`) directly within the **User Profile** settings. Users can link and unlink accounts without ever leaving the main Jellyfin UI.
- **Native Look & Feel**: Uses Jellyfin’s internal components to match the server theme perfectly.

## Installation

### Prerequisites
This script requires a Jellyfin server with the SSO plugin ([jellyfin-plugin-sso](https://github.com/9p4/jellyfin-plugin-sso)) installed and configured.

### Method 1: Injecting using Jellyfin-JavaScript-Injector (Recommended)
1. Install [Jellyfin-JavaScript-Injector](https://github.com/n00bcodr/Jellyfin-JavaScript-Injector).
2. Navigate to **Dashboard > JS Injector** in the Plugins section on the sidebar.
3. Add a new script and name it (e.g., "SSO UI").
5. Review the constants at the top of the script so that they match your setup. ([Check for details](#configuration))
6. Paste the script into the code field.
7. Ensure the script is enabled.
8. Click **Save** at the bottom of the page.

### Method 2: Browser Extension
You can use a browser extension like **Tampermonkey** or **Violentmonkey** to inject the script locally into your browser session.

## Configuration

The script contains a constant at the top to define your primary SSO entry point (used for the login button):

```javascript
const SSO_URL = "/sso/OID/start/authentik";
```

Update this string to match your provider's specific OID or SAML start path as configured in your Jellyfin SSO plugin settings.

## Technical Details

- **API Interaction**: Uses the native `ApiClient` global object to fetch provider names via `sso/OID/GetNames` and `sso/SAML/GetNames`.
- **Dynamic Injection**: Uses a `MutationObserver` to watch for DOM changes, ensuring the SSO buttons and sections appear even when navigating Jellyfin's Single Page Application (SPA) architecture.
- **Theming**: Dynamically references Jellyfin CSS variables like `--theme-primary-color` and `--alert-text-color` to ensure the UI looks correct in Dark, Light, and custom themes.
