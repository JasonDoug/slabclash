# One Pager — Sports Trading Card Battle App

Version: 1.1  
Prepared for: Product & Engineering Leadership  
Prepared by: (Your Team)  
Date: 2026-04-29

---

## Executive Summary
A mobile-first app that lets collectors scan real-world sports trading cards (baseball, football, etc.), converts them into digital game assets with data-driven "power" ratings (0-1000), and enables online head-to-head battles between player collections. The product leverages card recognition, sports data, and pricing signals to create a dynamic, fair, and collectible competitive experience with progression, economy, and social features.

---

## Problem Statement
- Collectors have large physical card collections but limited ways to engage with them beyond storing, trading, and occasional show-and-tell.
- Existing digital card games use virtual-only assets; collectors want to leverage the sentimental and monetary value of real cards.
- There is no mainstream, trusted system that securely links physical cards to competitive digital gameplay with transparent, data-driven power calculations.

---

## Opportunity
- Combine the physical card collecting market (tens of millions of collectors; multi-billion-dollar secondary market) with mobile gaming and competitive social features.
- Offer a new use-case for collectors: play using real cards, showcase rarities, monetize engagement (tournaments, marketplace).
- Create recurring revenue via in-app purchases, entry fees, premium features, and potential partnerships with data/licensing providers.

---

## Target Audience & Ideal Customer
Primary personas:
- Hobbyist Collector ("Alex", 25–45): Has a moderate-to-large physical collection, active in forums/socials, enjoys showing collections and light competition.
- Hardcore Collector / Grader-Focused ("Jordan", 30–55): Highly values card condition/rarity, tracks market prices, interested in high-stakes play.
- Casual Sports Gamer ("Taylor", 16–35): Enjoys fantasy/sports games and competition but may not own many physical cards—enticed by themed game modes and rentals.

Ideal customer attributes:
- Owns physical sports cards (or plans to).
- Uses smartphone regularly and is comfortable photographing/scanning items.
- Interested in competition, social sharing, and potential monetization (tournaments, trades).

---

## Product Concept / Value Proposition
- Instantly convert your physical card collection into playable digital assets via scanning.
- Cards receive transparent, market-informed power ratings (0-1000) derived from player stats, card rarity, condition, and market value.
- Play battles (casual matches, ranked ladders, tournaments) using your collection; win rewards, climb leaderboards, and trade/sell cards on an integrated marketplace.

---

## Core Features (MVP Scope)
1. **Mobile card scanning and recognition**: camera scanning + image processing (OCR + pHash) + candidate matching.
2. **Card ingestion pipeline**: identify card (player, year, set, variant), capture condition metadata, and handle manual review flags.
3. **Power rating engine**: algorithm combining player performance metrics, card rarity, condition, and market pricing using versioned configurations.
4. **Battle system (1v1)**: deck/lineup selection, match resolution (deterministic stat-based comparison).
5. **Account & collection UI**: browse, filter, sort, view card details and lineage.
6. **Basic matchmaking**: skill/collection-adjusted.
7. **Rewards & progression**: XP, ranks, badges, currency.
8. **Anti-fraud layer**: duplicate detection (pHash), dispute flow, manual review flags (poor/fair condition).

---

## High-Level Game Rules (Example)
- **Deck/Lineup**: Player selects 9 cards for a baseball lineup, each occupying specific roles/positions.
- **Power Rating**: Each card has a single numerical power score (0–1000) derived from aggregated inputs.
- **Match Setup**: Lineups are compared role-for-role to produce a match score.
- **Match Resolution**:
  - **Deterministic Stat Comparison**: For each matchup, compare relevant stat-weighted values; sum points to determine winner.
- **Special Abilities**: Rare/parallels may have abilities (e.g., “Clutch” bonus, “Streak” multiplier).
- **Tiebreaker**: Use secondary metrics (market value, player momentum) or sudden-death simulated plays.

---

## Power Rating Algorithm — Inputs & Weighting
The rating engine produces a score from 0 to 1000 based on a weighted sum of normalized factors:
- **Player Performance (40%)**: career/season stats, recent form, position-specific metrics.
- **Market Value (20%)**: aggregated pricing from marketplaces.
- **Card Rarity (20%)**: year, set, parallel/variant, rarity category (Common to Secret Rare).
- **Condition Score (10%)**: user-reported + AI-estimated condition.
- **Momentum (10%)**: recent performance trends.

*Note: Weights and normalization bounds are configurable server-side via `RatingConfig`.*

---

## User Flow (Core)
1. **Onboarding**: Sign up / login (JWT-based).
2. **Scan & Ingest**:
   - Capture card images (front/back), auto-detect card type via OCR and candidate matching.
   - Confirm/resolve matches; enter condition details.
   - Card enters collection, assigned power score (0-1000).
3. **Build Lineup**: Select cards into a lineup with position constraints and rarity caps.
4. **Matchmaking**: Enter casual or ranked queue.
5. **Battle**: Results resolved deterministically based on card power and stats.
6. **Post-Match**: Awards (XP, currency), leaderboard updates.

---

## MVP Acceptance Criteria
- Users can reliably scan and ingest cards (90%+ recognition for major sets).
- Cards receive a visible, reproducible power rating (0-1000).
- Users can create a lineup and play 1v1 matches.
- Basic matchmaking ensures reasonably balanced matches.
- Admin tools to moderate ingestion and adjust rating weights.

---

## Key Metrics & Success Criteria
- **Acquisition**: Daily installs, ARPU.
- **Engagement**: DAU/MAU, matches per user per week.
- **Retention**: 1-day, 7-day, 30-day retention.
- **Technical**: Scan recognition accuracy, match latency, system uptime.
