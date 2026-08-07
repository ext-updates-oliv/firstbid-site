# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: sellers/boosters on Eldorado.gg (starting with Fortnite rank boosting) who
run their own seller account and want to win more boosting orders. The visitor to
firstbid.xyz is a booster evaluating whether to buy the bot for their own account, not
the end buyer of a boost. Each install is licensed to one seller, one machine.

## Product Purpose

FirstBid watches a seller's Eldorado.gg account for new boosting orders and sends the
first price offer automatically, in seconds: it reads the mode, group size (solo/duo),
current rank, and desired rank, matches them against a price table and rank ranges the
seller configured themselves, and sends the offer plus a personalized opening message.
It does not negotiate — once the first message is sent, the seller takes the
conversation over manually. Success = winning more orders by being the fastest seller to
respond, without the seller having to watch the marketplace constantly.

## Positioning

The bot other sellers can't copy-paste: 100% dynamic configuration (ranks, modes, group
sizes, price matrix — nothing hardcoded) built multi-game from day one, so the same
architecture that ships Fortnite today can add another game without a rewrite. No AI
pretends to be the seller past the opening message — that's a deliberate constraint, not
a missing feature, aimed at sellers who don't trust "AI negotiators" with their buyer
relationships.

## Operating Context

Sold and distributed to multiple independent sellers, each with their own Eldorado
seller account, protected by a per-machine license key. The seller configures their own
ranks/modes/price matrix from a local dashboard before the bot does anything (a fresh
install starts at zero ranges/prices = AUTO-SKIP on everything until configured). The bot
runs via Eldorado's official Seller API when the seller's account has it enabled,
falling back to browser automation (Playwright) otherwise — invisible to the seller
either way. firstbid.xyz is the pre-purchase marketing surface; the dashboard (a
separate project) is the post-purchase operating surface. Sale/support currently happens
over Discord DM (no storefront/checkout flow on the site itself).

## Capabilities and Constraints

- No AI negotiation of any kind, at any point after the opening message — this is a
  trust commitment, not a current-version limitation.
- Fully dynamic: ranks, modes, party sizes, price matrix, and message templates are all
  seller-configured, nothing hardcoded per game.
- Multi-game architecture already built; Fortnite is the only game live today, more are
  planned but undated.
- License-locked per machine; license revalidates periodically and needs internet.
- Undecided/not yet public: pricing of the bot itself, a self-serve checkout flow.

## Brand Commitments

- Name: FirstBid.
- The accent gold (`#ffc950`) is deliberately the same color as Eldorado.gg's own "Buy
  now" button, copied live from eldorado.gg — a trust/familiarity link to the
  marketplace the product operates on. This is a binding choice, confirmed again in this
  session (the user chose to keep the dark+gold palette even while asking for a much
  bolder layout/composition).
- Same accent already shared across firstbid.xyz and the local dashboard (separate repo)
  on purpose — keep them visually related, not identical page-for-page.

## Evidence on Hand

No real testimonials yet — `reviews.json` in this repo is an empty array by design (the
"What sellers say" section only renders once at least one real review exists; never
populate it with invented reviews). No measured metrics exist yet (no public user count,
no measured response-time numbers) — the current pitch rests on the mechanism itself
(speed + full dynamic config), not on stats. Do not invent numbers, customer counts, or
quotes.

## Product Principles

1. Prove speed and dynamism through the mechanism itself (show the pipeline: detect →
   read → price → send), not through invented stats or testimonials.
2. No AI-negotiator framing anywhere — the product's trust pitch is explicitly "you stay
   in control after the first message."
3. Keep the Eldorado-gold link legible even in a bolder execution — it's doing real
   trust work, not decoration.
4. Multi-game-ready is a structural claim (architecture), not a promise of games that
   don't exist yet — "Fortnite live, more coming" stays honest.

## Accessibility & Inclusion

No product-specific requirement established beyond standard web accessibility (contrast,
keyboard/focus states, `prefers-reduced-motion`).
