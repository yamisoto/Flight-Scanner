# Decision Log

| Date | Decision | Status |
|---|---|---|
| — | Flight data provider: Duffel/Amadeus deprioritised (no confirmed Nigerian domestic coverage found). Wakanow and Travelstart outreach in progress in parallel. Direct airline relationships are the fallback. | **Open — intentionally unresolved.** Phase 1A was built entirely against `MockFlightProvider` so this does not block foundation work. See `docs/PHASE_0_5_VALIDATION.md`, `docs/PARTNER_OUTREACH_PLAN.md`, `docs/PROVIDER_SCORECARD.md`, `docs/PHASE_0_5_DECISION.md` (Conditional Go) for the full evidence trail. |
| — | Commercial model: affiliate/referral commission recommended as the initial model. | Open — depends on outreach outcomes above. |
| — | Auth provider (Clerk vs Auth.js vs Supabase Auth) | Open — not needed unless price alerts get pulled into MVP scope. |
| — | Final MVP route list | Using the brief's original list (validated as directionally reasonable — Lagos-Abuja confirmed busiest corridor per FAAN) pending real per-route demand data. |
| This build | Prisma pinned to v5 (stable) rather than the v8 release-candidate that installs by default | Resolved — avoids an unfamiliar CLI surface for a foundational schema file. |
| This build | Vitest pinned to v2 to avoid `@types/node` peer conflicts in this environment | Resolved. |
| This build | Dropped next/font/google (Geist) in favor of a system font stack | Resolved — avoids a build-time network dependency and is a more deliberate design choice per `docs/DEVELOPMENT.md`. |
| This build | `prisma generate`/`migrate` not run — blocked by network access to `binaries.prisma.sh` in this sandbox | Open — needs to be run in a normal dev/CI environment before the app connects to a real database. Schema itself is complete in `prisma/schema.prisma`. |
| This build | Dark-mode logo color changed from the originally specified `#294A7F` to `#4A73B8` | Resolved — the original value had low contrast against the charcoal background (~11 percentage points of luminance difference), flagged in a site audit. Lightened for legibility; flag if you'd rather keep the exact original value and accept the contrast tradeoff. |
