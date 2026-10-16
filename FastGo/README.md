# FastGo — Go anywhere, faster.

A responsive, multi-page ride-booking frontend prototype built with HTML5, CSS3, vanilla JavaScript (ES6+) and Bootstrap 5. It uses simulated data and browser `localStorage`; there is no backend and no real ride dispatch.

## Features

- Responsive landing page with ride types, process steps, safety features, animated demo metrics, testimonials, driver CTA, app placeholders and FAQ.
- Booking page with Leaflet + OpenStreetMap, suggested locations, illustrative route line, distance/time estimates and ride fares.
- Fare formula: `(base fare + per-km rate × distance + per-minute rate × duration) × ride multiplier`; optional simulated 1.35× surge.
- Driver matching animation and dummy driver data loaded from `data/drivers.json` using `fetch()`.
- Driver card with portrait, rating, vehicle, plate, OTP and ETA; Call, Chat and Cancel are UI-only.
- Signup/login validation, Indian mobile number validation, password strength meter and show/hide password control.
- Ride history stored in `localStorage`; driver application and demo account details also remain local to the browser.
- Persistent dark mode, toast notifications, scroll-reveal animation, keyboard-friendly controls and reduced-motion support.
- Bootstrap Icons, Google Fonts and Unsplash portrait images.

## Tech stack

- HTML5 semantic elements
- CSS3 custom properties, responsive grid/flex layouts and media queries
- JavaScript ES6+
- Bootstrap 5.3
- Bootstrap Icons
- Leaflet 1.9 + OpenStreetMap tiles
- `localStorage` and local JSON

## Folder structure

```text
FastGo/
├── index.html
├── booking.html
├── login.html
├── history.html
├── driver.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── booking.js
│   └── auth.js
├── data/
│   └── drivers.json
├── images/
└── README.md
```

## Run locally

`fetch("data/drivers.json")` is blocked by many browsers when pages are opened as `file://`. Start a local web server from the project folder.

### Option A — VS Code Live Server

1. Extract the project ZIP.
2. Open the `FastGo` folder in Visual Studio Code.
3. Install the **Live Server** extension if needed.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Open `booking.html` from the navbar and test the booking flow.

### Option B — Python

1. Install Python if it is not already available.
2. Open a terminal in the `FastGo` folder.
3. Run:

   ```bash
   python -m http.server 8000
   ```

4. Visit `http://localhost:8000` in your browser.

### Option C — Node.js

If Node.js is installed, you can run `npx serve .` in the project directory and open the local URL printed in the terminal.

## How to test

1. On Home, enter pickup and drop locations and click **See prices**.
2. On Booking, select a ride type, toggle peak-hour pricing, or swap locations.
3. Click **Confirm booking** and wait for the simulated driver match.
4. Use **Call**, **Chat** and **Cancel** to see the demo feedback.
5. Visit **Ride history** to see bookings stored in localStorage.
6. Test login/signup validation and the driver registration form.
7. Toggle dark mode; the preference persists across pages.
8. Resize the browser to mobile widths (including 360px) and tablet/desktop.

## Screenshots

Add screenshots here after running the site locally. Suggested files:

- `screenshots/home-desktop.png`
- `screenshots/booking-mobile.png`
- `screenshots/login-validation.png`
- `screenshots/ride-history.png`

## Important demo notes

- This is a frontend-only prototype. Login is not secure authentication; passwords are stored locally for demonstration and must **never** be used for real accounts.
- Booking, fares, routes, ETA, driver assignment and trip statuses are simulated. Distances/routes are illustrative and do not represent live routing.
- OpenStreetMap tiles, Google Fonts, Bootstrap CDN assets and Unsplash photos require an internet connection.
- The app does not collect or transmit personal data to a server.
