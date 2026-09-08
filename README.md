# Temple Pooja Booking Website

## Files
- `index.html`, `style.css`, `script.js`, `config.js` — the public customer site
- `admin/index.html`, `admin/style.css`, `admin/script.js` — the admin portal (separate, password-protected)

## How to publish this for free on GitHub Pages

1. Go to your GitHub repository (the one you created earlier).
2. Click "Add file" > "Upload files".
3. Drag in `index.html`, `style.css`, `script.js`, and `config.js` — these go in the **root** of the repo.
4. Create a folder named `admin` in the repo (you can do this while uploading by typing `admin/index.html` as the filename) and upload `admin/index.html`, `admin/style.css`, `admin/script.js` into it.
5. Commit the changes.
6. Go to Settings > Pages, confirm the source is set to your `main` branch, root folder.
7. Wait 1–2 minutes, then visit `https://yourusername.github.io/temple-booking-site/` — your site is live.
8. The admin portal is at `https://yourusername.github.io/temple-booking-site/admin/`.

## Testing before you publish
Open `index.html` directly in your browser (double-click it) to test locally first —
it already talks to your live Google Sheet backend, so bookings will actually be saved.

## Notes
- No payment gateway — every booking says "pay at temple."
- No data is stored in the browser (no localStorage) — everything lives in your Google Sheet.
- The admin login token is kept only in `sessionStorage` for that browser tab, and is
  never exposed to or shared with the customer-facing pages.
