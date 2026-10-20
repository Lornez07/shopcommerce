# Deploy: ShopCommerce

Target: Vercel (production), Supabase project `gnqvyzqrudvmgpjzefrz`, Stripe **test mode**.
No custom domain — the `*.vercel.app` URL is the production URL.

---

## 0. Pre-flight (run locally, must all be green)

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Also confirm the secrets are the secrets, not lookalikes:

- `SUPABASE_SERVICE_ROLE_KEY` — decode the JWT and check `"role":"service_role"`. It is
  easy to paste the anon key here by accident; the visible symptom is an order insert
  failing RLS inside the webhook while everything else looks fine.
- `STRIPE_SECRET_KEY` starts `sk_test_`.
- `STRIPE_WEBHOOK_SECRET` here is the **CLI** secret. It will be replaced in step 4.

---

## 1. Git + GitHub

The repo is initialised **inside `ecommerce/`**, so Vercel needs no root-directory setting.

```powershell
cd C:\AllaboutProgrammingHere\ecommerce
git init
git add .
git status          # confirm .env.local, .next, node_modules, .trash are absent
git commit -m "ShopCommerce: catalogue, checkout, admin, order webhook"
```

Create the empty private repo `shopcommerce` on GitHub, then:

```powershell
git remote add origin https://github.com/<you>/shopcommerce.git
git branch -M main
git push -u origin main
```

If `gh` is installed, this does the same in one step:

```powershell
gh repo create shopcommerce --private --source=. --remote=origin --push
```

**Check before pushing:** `.gitignore` excludes `.env*.local`, `/.next`, `/node_modules`,
`/test-results`, `/.trash` and `*.report.html`. `.env.local` holds live test keys and the
service-role key — it must never appear in `git status`.

---

## 2. Vercel

1. **vercel.com/new** → import `shopcommerce`. Framework preset: Next.js. Root directory:
   `./` (default). Build command and output are auto-detected.
2. Add environment variables (Production **and** Preview):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gnqvyzqrudvmgpjzefrz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key |
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | placeholder for now — step 4 fills it |
| `NEXT_PUBLIC_APP_URL` | the production URL, e.g. `https://shopcommerce.vercel.app` |

`NEXT_PUBLIC_*` values are inlined at build time. Changing one requires a redeploy, not
just a restart.

3. Deploy. Note the production domain.

---

## 3. Supabase auth redirects

Authentication → URL Configuration:

- **Site URL**: `https://<project>.vercel.app`
- **Redirect URLs**: add `https://<project>.vercel.app/**`

Without the wildcard entry, magic links send the user to the Site URL root and drop the
session. Preview deployments each have a different hostname; add `https://*-<team>.vercel.app/**`
if you want sign-in to work on previews too.

The built-in SMTP is rate limited to a handful of messages per hour. If sign-in silently
stops working during testing, that is usually why — wait, or configure real SMTP.

---

## 4. Stripe webhook

Developers → Webhooks → **Add endpoint**:

- URL: `https://<project>.vercel.app/api/webhook/stripe`
- Events: **only** `payment_intent.succeeded`

This flow uses PaymentIntents, not Checkout Sessions — subscribing to
`checkout.session.completed` will produce an endpoint that never fires.

Copy the endpoint's signing secret (`whsec_…`), set it as `STRIPE_WEBHOOK_SECRET` in
Vercel, and **redeploy** so the new value is picked up.

---

## 5. Production verification

Run through this with a signed-in account, Stripe test mode:

- [ ] `/` loads with all five category images (proves the `images.unsplash.com` remote pattern survived the build)
- [ ] Magic link arrives and lands on the app signed in
- [ ] Add to cart → `/cart` shows the item with correct totals
- [ ] `/checkout` → card `4242 4242 4242 4242`, any future expiry, any CVC → success page shows an order number
- [ ] Stripe dashboard → the endpoint → the delivery returned **200**, not 400/500
- [ ] `/account` lists the order with a `Paid` badge
- [ ] `/admin` lists it; changing the status persists after a reload
- [ ] `/category/does-not-exist` returns a real 404 status, not 200
- [ ] Browser console clean on `/`, `/category/ceramics`, a product page

400 from the webhook means a signature mismatch (wrong `whsec_` for this endpoint).
500 means the handler ran and failed — check the Vercel function logs; the usual cause is
the service-role key being wrong or missing.

---

## 6. After deploy

- Rotate the Stripe **test** keys if they were ever shared, and the Supabase service-role
  key if it appeared anywhere public.
- The seed contains demo photography and demo order data. If this becomes a real shop,
  replace both, and drop `*.supabase.co` image patterns you no longer need.
- Rollback is Vercel → Deployments → promote the previous build. Environment variables are
  not rolled back with it, so revert those separately if the change was in config.
