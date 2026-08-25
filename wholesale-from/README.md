# Carry n Go — Wholesale Inquiry Form

A standalone, multi-step wholesale inquiry form built to match the Carry n Go
brand (carryngonow.com). No build step, no dependencies beyond two Google
Fonts — just static HTML/CSS/JS, so it deploys straight to GitHub Pages.

## What's in the flow

1. **Items** — buyer checks off everything they want a quote for (or checks
   "not sure yet, send me a general bulk quote").
2. **Quantities** — one range dropdown per selected item. Wholesale minimum
   is 12 units/item; picking the "1–11 units" range shows an inline error
   and blocks continuing until it's corrected.
3. **Your details** — name, business, contact info, delivery/pickup
   location, timeline, notes.
4. **Review & send** — a receipt-style summary of everything entered, then
   a "Send wholesale inquiry" button.

## Current state (demo / v1)

There's no backend yet. Submitting the form opens a pre-filled `mailto:`
draft (to `wholesale@carryngonow.com` — update this address in
`js/script.js`) so the form is genuinely usable today without any server.

Search `js/script.js` for `NEXT VERSION` — every planned upgrade is called
out inline at the exact point it plugs in:

- **Email notifications** — a confirmation to the customer + an alert to
  the internal wholesale inbox, sent from a small serverless function
  (e.g. Cloudflare Worker / Netlify Function) via an email API such as
  Postmark, Resend, or SendGrid.
- **Admin panel** — a view to sort and manage incoming wholesale requests
  (by status, date, or value).
- **ClickUp-backed workflow** — on submit, POST to the ClickUp API
  (`POST /api/v2/list/{list_id}/task`) so every inquiry becomes a task in a
  ClickUp list, with the form fields mapped to custom fields. That same
  list is what the admin panel above would read from.
- **Live inventory** — `js/inventory-data.js` is deliberately isolated from
  the rest of the app. Right now it's a hard-coded array transcribed from
  the "CNG Master Inventory" spreadsheet; swap it for a fetch against a
  published Google Sheet (e.g. via PapaParse) or the ClickUp List API and
  nothing else in the app needs to change, as long as each item keeps the
  same `{ sku, name, description, category }` shape.

## File structure

```
carry-n-go-wholesale/
├── index.html            All four form panels + step indicator
├── css/
│   └── style.css         Full visual identity (see design notes below)
├── js/
│   ├── inventory-data.js Item list + quantity range config (swap this later)
│   └── script.js         Step navigation, validation, review, submission
└── README.md
```

## Design notes

The visual concept is a "packing ledger" — Carry n Go's whole promise is
getting familiar ingredients to your door, so the form borrows the
vocabulary of shipping labels, market receipts, and packing lists:

- A torn paper-tape stripe across the top of the page.
- Step tabs styled like ledger tabs, with SKUs shown in monospace like
  price tags throughout.
- The Step 4 review renders as a running receipt with a dashed
  ledger-line background.
- Palette drawn from the goods themselves rather than a generic
  food-site look: palm-oil rust, garri cream, forest green, warm gold.
- Type pairing: **Fraunces** for headings (warm, a little hand-set),
  **Work Sans** for body copy, **IBM Plex Mono** for SKUs and receipt-style
  data.

## Editing the inventory

Open `js/inventory-data.js`. Each item looks like:

```js
{
  sku: "A-001",
  name: "Egusi (Melon Seeds)",
  description: "Ground melon seeds for thickening Nigerian soups",
  category: "Staples & Grains",
},
```

Add, remove, or edit entries directly — the item grid, quantity step, and
review receipt all rebuild themselves from this array automatically. The
`QUANTITY_RANGES` array and `WHOLESALE_MINIMUM_UNITS` constant just below
it control the dropdown options and which one triggers the "below minimum"
error.

## Deploying to GitHub Pages

1. Create a new GitHub repository (or use an existing one) and push this
   folder's contents to it:

   ```bash
   git init
   git add .
   git commit -m "Wholesale inquiry form"
   git branch -M main
   git remote add origin https://github.com/<your-org>/<repo-name>.git
   git push -u origin main
   ```

2. In the repo on GitHub: **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a
   branch`, branch `main`, folder `/ (root)`. Save.
4. GitHub will publish the site at
   `https://<your-org>.github.io/<repo-name>/` within a minute or two.
5. Optional: to use a custom subdomain like `wholesale.carryngonow.com`,
   add a `CNAME` file to the repo root containing that domain, then point
   a CNAME DNS record at `<your-org>.github.io`.

The included `.nojekyll` file tells GitHub Pages to skip Jekyll
processing, which isn't needed for a plain static site like this one.
