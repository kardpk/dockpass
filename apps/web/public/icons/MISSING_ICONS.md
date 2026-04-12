# Required Push Notification Icons

The following icon files are needed for push notifications and PWA functionality.

## Required Files

| File | Size | Purpose |
|------|------|---------|
| `icon-192.png` | 192×192 | Standard PWA icon / notification icon |
| `icon-512.png` | 512×512 | PWA splash screen / install banner |
| `badge-72.png` | 72×72 | Notification badge (monochrome recommended) |

## Design Guidelines

- Use the BoatCheckin anchor logo on brand blue (`#0C447C`) background
- `badge-72.png` should be **monochrome** (single color on transparent) — Android uses it as the small status bar icon
- Export as **PNG** with transparent background where applicable
- Ensure icons are legible at small sizes

## Usage

- `icon-192.png` — referenced in `manifest.json` and `sw.js` push handler
- `icon-512.png` — referenced in `manifest.json`
- `badge-72.png` — referenced in `sw.js` push notification badge
