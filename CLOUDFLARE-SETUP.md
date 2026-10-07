# Deploy Joesblendz

Use PowerShell in this project folder. Install Node.js 22.13 or newer. If dependencies are missing, run `npm ci` first.

1. Sign in: `node scripts/cloudflare.mjs login`
2. Create the database: `node scripts/cloudflare.mjs create-db`
3. Copy the returned database_id into: `node scripts/cloudflare.mjs bind YOUR_DATABASE_ID`
4. Deploy behind the owner login: `node scripts/cloudflare.mjs deploy-private`
5. Generate an owner password: `node scripts/cloudflare.mjs password`. Save it privately in a password manager.
6. Store it: `node scripts/cloudflare.mjs secret`. Paste that generated password at the terminal prompt, never in chat.
7. Open the printed workers.dev URL with `/admin` at the end. Sign in, initialize services, confirm pricing/contact details and add real availability. Test a booking from the homepage while signed in, then cancel it. Anonymous visitors remain behind the owner login.

When Joe is ready for clients, run `node scripts/cloudflare.mjs publish`. This makes the booking homepage public; the dashboard still requires the owner password. Test booking and cancellation in a signed-out browser before sharing the link on Instagram.

Use the Cloudflare Free plan and review current usage limits in its dashboard. A workers.dev address does not require buying a domain. These commands do not enable a paid plan.

Local passwords and data are separate from production. To rotate the production password, generate a new one and run the secret command again; existing sessions become invalid. There is no email password reset. Keep control of the Cloudflare account.
