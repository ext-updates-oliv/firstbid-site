# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: sellers/boosters on Eldorado.gg who run their own seller account and want
to win more boosting orders. The visitor to firstbid.xyz is a booster evaluating whether
to buy the bot for their own account, not the end buyer of a boost. Licensing is per
game: one key unlocks one game on one machine, so a seller working several games holds
several keys at once.

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
sizes, price matrix — nothing hardcoded) built multi-game from day one. That claim is no
longer structural only: ten games run on the same architecture, each one added by
configuration rather than a rewrite. No AI pretends to be the seller past the opening
message — that's a deliberate constraint, not a missing feature, aimed at sellers who
don't trust "AI negotiators" with their buyer relationships.

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
  trust commitment, not a current-version limitation. The bot may *alert* the seller on
  Telegram when a buyer replies, but it never answers for them.
- Fully dynamic: ranks, modes, party sizes, price matrix, and message templates are all
  seller-configured, nothing hardcoded per game.
- Ten games live: Fortnite, Valorant, Rocket League, Brawl Stars, Rainbow Six Siege X,
  Marvel Rivals, League of Legends, EA Sports FC, Apex Legends, Call of Duty. More are
  added by configuration, undated.
- Price levels: each game can run Hungry (-12%), Normal, or Expensive (+12%) without
  rewriting the seller's price table.
- A custom message can cover every rank at once, and may optionally answer orders the
  bot has no price for — sending only text, never an offer.
- License-locked per machine and per game; licenses revalidate periodically and need
  internet.
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

`reviews.json` now holds six testimonials and the "What sellers say" section renders.
The section is still gated on the file being non-empty, and the standing rule has not
changed: **never add a review that a real seller did not give.** Anyone editing this
file is responsible for the claims on a public sales page.

No measured metrics exist (no public user count, no measured response-time numbers) —
the pitch rests on the mechanism itself (speed + full dynamic config), not on stats. Do
not invent numbers or customer counts.

## Product Principles

1. Prove speed and dynamism through the mechanism itself (show the pipeline: detect →
   read → price → send), not through invented stats or testimonials.
2. No AI-negotiator framing anywhere — the product's trust pitch is explicitly "you stay
   in control after the first message."
3. Keep the Eldorado-gold link legible even in a bolder execution — it's doing real
   trust work, not decoration.
4. Name the games that actually run today (ten of them) and never a game that doesn't.
   The multi-game claim is now demonstrated, not aspirational — keep it that way by
   updating this list instead of hinting at what might come.

## Accessibility & Inclusion

No product-specific requirement established beyond standard web accessibility (contrast,
keyboard/focus states, `prefers-reduced-motion`).
