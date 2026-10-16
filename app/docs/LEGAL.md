# Legal pages (`/legal`)

**Status: draft for legal review, not in force.** Four pages share one frame (`src/components/legal/LegalShell.tsx`): `/legal` (key points in plain English), `/legal/terms` (terms of use, how we make money and rank results, complaints), `/legal/privacy` and `/legal/cookies`. All are noindexed, left out of the sitemap, and show a draft banner. Before launch a Nigerian lawyer must review them, the placeholders below must be filled, and the banner and `LEGAL_ROBOTS` noindex removed (then add the four pages to `src/app/sitemap.ts`). Keep the key points on `/legal` consistent with the full documents.

Structure follows Skyscanner and Google Flights (separate terms, privacy and cookie pages): we're a comparison service, not the seller; prices come from partners and the seller's price applies; how results are ranked and how we're paid.

## Laws the page addresses

| Law | Where on the page | Notes |
|---|---|---|
| Nigeria Data Protection Act 2023 (NDPA) | `/legal/privacy` | Controller identity, purposes and lawful bases (legitimate interests may not override data subject rights), sharing, transfers outside Nigeria, retention, data subject rights, breach notification to the NDPC within 72 hours, children. Section numbers deliberately left out of the page: secondary sources disagreed on them; lawyer to confirm against the Act |
| NDPC General Application and Implementation Directive 2025 (GAID) | `/legal/privacy`, `/legal/cookies` | In force from 19 Sep 2025, replaced the NDPR 2019. Requires clear privacy and cookie notices on the website. Consent records where consent is the basis |
| NDPC registration as a data controller of major importance | Not on the page; **action for the owner** | Guidance Notice (Feb 2024): more than 200 data subjects in six months can trigger registration and annual compliance audit returns. Skyfare processes IP addresses of every visitor, so **ask the lawyer whether registration applies at launch** |
| Federal Competition and Consumer Protection Act 2018 (FCCPA) | `/legal/terms` 2.1, 2.7, 4 | Bans false or misleading representations, including about price (s.123 as applied by the FCCPC); consumer rights can't be excluded. Drives "show the full price", "the seller's price applies" and the non-exclusion clause |
| Nigeria Civil Aviation Regulations 2023, Part 19 (Consumer Protection) | `/legal/terms` 2.3, 4 | Passenger rights on delays, cancellations, denied boarding, baggage; enforced by the NCAA. Airlines' duties, not ours; we point users to them |
| Cybercrimes (Prohibition, Prevention, etc.) Act 2015, amended 2024 | `/legal/terms` 2.4 | Unlawful use clause. Also supports the anti-scraping rules |
| ARCON Act 2022 (Advertising Regulatory Council of Nigeria) | `/legal/terms` 3 ("clearly labelled") | Ads aimed at Nigeria need vetting by the Advertising Standards Panel. Relevant once Skyfare runs ads or sponsored listings, and for Skyfare's own marketing |

## Placeholders to fill (highlighted on the page)

Company name; CAC RC number; registered address; domain; courts for disputes (e.g. Lagos State); server log retention period (check Vercel plan); retention for messages; privacy email; support email; response times; Data Protection Officer name and email.

## Keep in step with the code

The privacy and cookie sections describe what the app does today. Update them when any of these change:

- **No cookies** are set by Skyfare. Adding analytics, ads or affiliate tracking that sets cookies needs a consent banner first (GAID), with reject as easy as accept.
- **Local storage**: only `skyfare-theme` (`src/components/v2/Header.tsx`).
- **IP addresses**: used in memory for rate limiting only (`src/lib/rateLimit.ts`), about one minute. Error logs (`src/instrumentation.ts`) leave out headers.
- **Searches are not stored.** The `FlightSearch` table in the schema is unused; writing to it would need a privacy notice update.
- **Processors**: Vercel (hosting, Web Analytics, Speed Insights), Neon (database, London). Add any new provider (e.g. Sentry, a booking partner API) to "Who we share it with" on `/legal/privacy`.
- **Commitments**: independence (scores can't be bought; commission never affects scores, the Pick or Best) must match `docs/DECISIONS.md` and `/how-we-score`.

## Sources

- [GAID 2025 overview (Mondaq)](https://www.mondaq.com/nigeria/privacy-protection/1606106/the-nigeria-data-protection-commission-issues-the-general-application-and-implementation-directive-2025-gaid), [Templars on the GAID](https://templars-law.com/app/uploads/2025/04/NDPC-Issues-the-Nigeria-Data-Protection-Act-General-Application-and-Implementation-Directive-2025.pdf)
- [NDPA 2023 enforcement framework (Templars)](https://www.templars-law.com/app/uploads/2023/11/Navigating-the-Enforcement-Framework-under-the-Data-Protection-Act-2023.pdf), [NDPA key provisions (Mondaq)](https://www.mondaq.com/nigeria/data-protection/1366934/the-nigerias-data-protection-act-2023-a-look-at-key-provisions)
- [NDPC registration guidance notice (KPMG)](https://kpmg.com/ng/en/home/insights/2024/03/nigeria-data-protection-commissions-guidance-notice-on-registration-of-data-processors-controllers-of-major-importance.html)
- [Nig.CARs 2023 Part 19 Consumer Protection (NCAA)](https://ncaa.gov.ng/documents/regulations/nig-cars-2023/part-19-consumer-protection/), [Passenger rights guide (Templars)](https://www.templars-law.com/app/uploads/2025/10/A-Guide-to-Passenger-Rights-and-Airline-Obligations-.pdf)
- FCCPC enforcement under ss.114, 116, 123, 125: [Sahara Reporters, Aug 2026](https://saharareporters.com/2026/08/19/nigerian-commission-fccpc-orders-manufacturers-importers-withdraw-misleading-poorly), [VON](https://von.gov.ng/fccpc-clamps-down-on-textile-distributors-violating-consumer-rights/)
- [Cybercrimes Act amendment 2024 (Mondaq)](https://webiis08.mondaq.com/nigeria/security/1466724/the-national-assembly-amends-the-cybercrimes-prohibition-prevention-etc-act), [ARCON and digital advertising (Templars)](https://templars-law.com/app/uploads/2024/07/Client-Alert-ARCON-Suit-and-FCCPC-Order.pdf)
- References: [Skyscanner terms of service](https://www.skyscanner.com/terms-of-service), [Google Flights: how results are ranked](https://support.google.com/travel/answer/7664728?hl=en)
