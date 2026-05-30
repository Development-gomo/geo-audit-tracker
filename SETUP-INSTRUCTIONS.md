# GEO Audit Tracker — Setup Guide

## What You're Getting

1. **`geo-audit-tracker.html`** — The campaign page (dark, premium design with live progress ring, agency cards, leaderboard, and CEO input form)
2. **`google-apps-script-backend.js`** — The backend code that connects the page to a Google Sheet for shared, live data

---

## Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → create a new spreadsheet
2. Name the first tab **Data**
3. Set up headers and rows like this:

| id         | name        | goal | sold | lastUpdated |
|------------|-------------|------|------|-------------|
| genero     | Genero      | 20   | 0    |             |
| gomogroup  | GO MO Group | 12   | 0    |             |
| wgp        | WGP         | 7    | 0    |             |
| innosearch | Innosearch  | 7    | 0    |             |
| garfield   | Garfield    | 6    | 0    |             |
| semway     | Semway      | 6    | 0    |             |
| densou     | Densou      | 0    | 0    |             |

---

## Step 2: Deploy the Backend

1. In your Google Sheet → **Extensions → Apps Script**
2. Delete any default code in the editor
3. Paste the entire contents of `google-apps-script-backend.js`
4. Click **Deploy → New deployment**
5. Type = **Web app**
6. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** → authorize when prompted
8. **Copy the Web App URL** (looks like `https://script.google.com/macros/s/.../exec`)

---

## Step 3: Host the Campaign Page

**Option A — Simplest (local file):**
- Just open `geo-audit-tracker.html` in a browser and share it via Google Drive / email

**Option B — Free hosting (recommended for sharing):**
1. Go to [Netlify Drop](https://app.netlify.com/drop) or [Vercel](https://vercel.com)
2. Drag & drop the `geo-audit-tracker.html` file
3. Get a shareable URL instantly — share it with all CEOs

**Option C — Google Sites:**
1. Create a Google Site
2. Embed the HTML page using an embed block

---

## Step 4: Connect

1. Open the campaign page in a browser
2. In the top config bar, paste the Google Apps Script Web App URL
3. Click **Connect**
4. Status should show "Connected ✓"
5. The URL is saved in browser storage — CEOs only need to do this once

---

## How It Works

- Each CEO visits the page, selects their agency from the dropdown, enters their total audits sold, and clicks Submit
- The data is saved to your Google Sheet in real time
- Anyone who opens/refreshes the page sees the latest numbers
- You can also manually edit the Google Sheet directly if needed

---

## Notes

- **The committed goals total 58**, slightly above your 56 target — the page uses 56 as the overall target as you specified. You can adjust the `TOTAL_TARGET` value in the HTML if needed.
- **Densou** appears as a "Bonus Agency" with no fixed goal — every sale counts toward the total but doesn't have a progress bar against a target.
- The countdown timer auto-calculates days remaining until July 1, 2026.
