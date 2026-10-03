# Database Provider Comparison

Prepared 3 October 2026 for the decision on Phase 1 task 1 (database live). **Status: awaiting owner decision.**

## What Skyfare needs from a database

| Need | Detail |
|---|---|
| **PostgreSQL** | The schema is already written for Postgres with Prisma (`prisma/schema.prisma`). Any Postgres host works without code changes. |
| Small data, steady writes | Nigerian domestic aviation is about 8,000 flights a month (NCAA, August 2026). Storing every flight's status is roughly 2 to 3 MB a month, a few hundred MB over several years. Free tiers are big enough for the whole of Phase 1. |
| A daily background job | The status collector runs every day. A database that **pauses when idle** must reliably wake for it. |
| Serverless-friendly connections | The app runs on Vercel functions, which open many short-lived connections. Needs a pooler or HTTP driver. |
| Close to the app servers | Every search waits on the database, so it should sit in the **same region as the Vercel functions**. |
| Preview deployments | Each PR gets a Vercel preview. Ideally each preview gets its own copy of the database (branching). |
| Later: user accounts and price alerts | Phase 1.5+. Built-in auth would help then, but isn't needed now. |

**A note on regions.** Most users will be in Nigeria. No mainstream managed Postgres offers a West African region, and Lagos traffic to Cape Town often routes through Europe, so Cape Town isn't automatically faster. **London** (Vercel `lhr1`, AWS `eu-west-2`) is usually the best-connected major region for West Africa. Whichever database we choose, move the Vercel functions to the same region (they currently default to Washington, `iad1`). Before committing, measure real latency from Lagos to each candidate region.

## The options

| | **Neon** | **Supabase** | **Prisma Postgres** | **PlanetScale Postgres** | **AWS RDS (Cape Town)** |
|---|---|---|---|---|---|
| What it is | Serverless Postgres (owned by Databricks since May 2025) | Postgres plus auth, storage, realtime and APIs | Serverless Postgres from the makers of Prisma | Managed Postgres on dedicated nodes | Classic managed Postgres on AWS |
| Free tier | Yes: 100 compute-hours per project per month, about 0.5 GB storage per project, scale-to-zero | Yes: 500 MB database, 2 active projects | Yes: 200,000 operations and 500 MB a month, hard cap, no card | **No** (free tier removed April 2024) | Only for eligible new AWS accounts, time-limited |
| First paid step | Launch plan: pay as you go, $0.106 per compute-hour plus $0.35 per GB-month | Pro: $25/month per project (includes $10 compute credit), 8 GB | Starter: $10/month, 1M operations, 10 GB | $5/month single node (not highly available); $15 for a 3-node cluster | About $15/month on demand (db.t4g.micro), less if reserved |
| Pausing | Scales to zero after 5 minutes idle and wakes automatically on the next query (short delay) | **Free projects pause after 1 week of inactivity** and need a manual restore | Serverless, no pausing to manage | Always on | Always on |
| Vercel integration | **Vercel Marketplace**: one-click setup, billing through Vercel, env vars added automatically, a database branch per preview deployment | Vercel integration available; env vars synced | **Vercel Marketplace**: one-click setup, billing through Vercel | Manual connection string | Manual setup and networking |
| Works with our Prisma schema | Yes | Yes | Yes (made for it) | Yes | Yes |
| Branching for previews | **Yes, built in**, instant copies | Yes on paid plans | Not confirmed; check before choosing | Branching available (check Postgres support) | No |
| Extras | Point-in-time restore | Auth, file storage, realtime, edge functions (useful for price alerts later) | Built-in query caching and connection pooling | High performance, NVMe "Metal" tier | Full control, any extension |
| Africa region | No (London available) | **No**, declined for Cape Town; London available | No African region | Check before choosing | **Yes, Cape Town** |
| Ops effort | Very low | Low | Very low | Low | **Highest**: backups, upgrades, networking, monitoring are yours |
| Billing model risk | Usage-based: costs scale with active compute hours | Per-project flat fee plus compute | **Per operation**: every query counts, including the daily job's writes; harder to predict as traffic grows | Flat per node | Flat per instance |

## Pros and cons for Skyfare

**Neon**
- Pros: free tier covers Phase 1 comfortably; the Vercel Marketplace setup gives a separate database branch for every PR preview, so test data never touches production; Postgres with nothing proprietary, so leaving is easy.
- Cons: scale-to-zero adds a short wake-up delay to the first search after a quiet spell (can be switched off on a paid plan); usage billing needs a spending cap; no African region.

**Supabase**
- Pros: the most complete platform; built-in auth and storage would save work for user accounts and price alerts later; good dashboard for browsing data.
- Cons: **free projects pause after a week without activity**, which is risky for a background job and a pre-launch site, so in practice it means the $25/month Pro plan from day one; more platform than we need right now; explicitly no Cape Town region.

**Prisma Postgres**
- Pros: built by the makers of the ORM we already use; one-click on Vercel; hard-capped free tier, so no surprise bills.
- Cons: billing per operation is the least predictable as search traffic grows; per-preview branching not confirmed; younger product.

**PlanetScale Postgres**
- Pros: fast and always on; $5/month is cheap for a production database; strong engineering reputation.
- Cons: no free tier; the $5 single node isn't highly available; no Vercel Marketplace billing.

**AWS RDS in Cape Town**
- Pros: the only option with an African region; full control.
- Cons: highest setup and maintenance effort for a small team; Cape Town may not actually be faster from Lagos than London; no branching; you manage backups, upgrades and security patches.

## Recommendation

**Neon via the Vercel Marketplace, in London (`eu-west-2`), with Vercel functions moved to London (`lhr1`) at the same time.**

It's free for all of Phase 1, it's plain Postgres (no lock-in), and per-preview database branches fit how we're already working with PR previews. Set a spending limit when moving to a paid plan.

**Choose Supabase instead** if you want user accounts and price alerts early (Phase 1.5) and are happy to pay $25/month from launch: its built-in auth would save a week or two of work then. **Avoid** RDS for now (too much maintenance) and Prisma Postgres (pricing harder to predict at scale).

## Data protection note

Phase 1 stores flight schedules, flight statuses and anonymous search logs: no personal data, so where it's hosted doesn't raise data-protection issues. Once user accounts or price alerts store names, emails or phone numbers, the Nigeria Data Protection Act 2023 rules on transferring personal data abroad apply to any non-Nigerian host. Take legal advice before that phase.

## Next steps once you decide

1. Create the database from Vercel → Storage → the chosen provider (London region). Vercel adds `DATABASE_URL` automatically.
2. Set the Vercel Functions region to London (`lhr1`) under Project Settings → Functions.
3. I'll then run the Prisma migrations, seed airports and airlines, and connect the flight-status store.

## Sources

Pricing and limits are as reported in September/October 2026 and should be rechecked on each provider's pricing page before committing.

- [Neon free plan limits](https://neon.com/faqs/free-plan-limits-and-quotas), [Neon after Databricks](https://www.buildmvpfast.com/blog/neon-serverless-postgres-databricks-comparison-pricing-2026), [Neon 2026 pricing breakdown](https://vela.run/articles/neon-serverless-postgres-pricing-2026/)
- [Supabase pricing 2026](https://uibakery.io/blog/supabase-pricing), [Supabase pricing breakdown](https://flexprice.io/blog/supabase-pricing-breakdown), [Supabase Cape Town region request](https://github.com/orgs/supabase/discussions/34614)
- [Prisma Postgres pricing review](https://www.saas4that.com/tools/prisma-postgres), [Prisma on the Vercel Marketplace](https://vercel.com/changelog/prisma-joins-the-vercel-marketplace)
- [PlanetScale pricing](https://planetscale.com/pricing), [$5 PlanetScale](https://planetscale.com/blog/5-dollar-planetscale-is-here)
- [RDS db.t4g.micro pricing](https://www.bytebase.com/dbcost/rds/instance/db.t4g.micro/), [AWS af-south-1](https://awsfundamentals.com/regions/af-south-1)
- [Vercel regions](https://vercel.com/docs/regions), [Vercel Cape Town region](https://vercel.com/changelog/cape-town-south-africa-is-now-available-on-the-edge-network)
- [Postgres hosting options compared (Bytebase)](https://www.bytebase.com/blog/postgres-hosting-options-pricing-comparison/)
