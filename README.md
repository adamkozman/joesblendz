# Joesblendz

Barber booking website with a password-protected owner dashboard, service pricing, availability management, cancellation links, and calendar downloads. Booking durations block overlapping appointments automatically.

Instagram: https://www.instagram.com/joesblendz/
Contact: josephaziz023@gmail.com
Address: 278 Rue du Gouverneur J7V 8H9

## Local preview

Install Node.js 22.13 or newer. Double-click START-JOESBLENDZ.cmd. Open http://127.0.0.1:5173/ and /admin.
Run `node scripts/cloudflare.mjs local-password` in this folder to view the local owner password. Keep it private.

Preserve the local database in `.wrangler/state` together with `.runtime/local-migrations.json`. Never share or commit credentials in `.dev.vars`.

## Hosting

Follow CLOUDFLARE-SETUP.md for Cloudflare Workers and D1. Deployment is incomplete. No public launch has been performed. Production data is separate from local preview data.

## Validation

Run `node tests/unit.mjs`, `node tests/auth.mjs`, and `node tests/integration.mjs` (the latter two require the local preview). Build with `node scripts/run-framework.mjs build`.

No payment processing or automatic email/SMS notifications are included. Clients should save their confirmation and cancellation link.
