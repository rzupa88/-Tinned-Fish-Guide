# Tinned Fish Guide

A mobile-first tasting journal for keeping track of every tin of seafood we try together.

## V1

The first version is intentionally dependency-free and runs entirely in the browser.

### What it does

- Log tins with brand, product, fish type, country, preparation, price, retailer, and tasting date.
- Keep separate ratings for parent and daughter on a 10-point scale.
- Track tasting notes and whether a tin is worth buying again.
- Mark tins as **Tried** or **Wishlist**.
- Search and filter the collection by status and fish type.
- Sort by newest, rating, price, or brand.
- Show quick stats for tins tried, wishlist count, top score, and fish types sampled.
- Save everything locally in browser `localStorage`.
- Include a web app manifest and service worker so the project can evolve into an installable PWA.

## Run locally

No package install is required.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

You can also open `index.html` directly, although the service worker/offline cache requires the app to be served over HTTP or HTTPS.

## Files

- `index.html` — app structure and tasting form
- `styles.css` — responsive mobile-first design
- `app.js` — local data model, ratings, filters, stats, add/edit/delete behavior
- `manifest.webmanifest` — PWA metadata
- `sw.js` — offline app-shell caching
- `icon.svg` — app icon

## Data model

Each tin currently stores:

- brand
- product name
- fish type
- country
- style / sauce
- retailer
- price
- tasting date
- tried / wishlist status
- parent rating
- daughter rating
- tasting notes
- buy-again flag
- created / updated timestamps

## Roadmap

1. Photo capture/upload for the package and opened tin
2. Custom taster profiles and names
3. Cloud database + sign-in so data syncs across devices
4. Shared family collection
5. Barcode / UPC lookup
6. Public tin catalog with brand, species, origin, ingredients, and nutrition data
7. Discovery features: best sardines, best tuna, best value, favorite countries, etc.
8. Export/import and backup

This project starts as a family tasting journal, but the architecture can grow into a broader consumer tinned-seafood guide later.
