# 📈 GafferDex Algorithmic Pricing Engine & Economic Guardrails

This document specifies the mathematical formulations, bonding curves, volatility dampeners, and economic guardrails that power the **GafferDex** transfer market.

---

## 1. Master Valuation Formula

The spot price for any player on the exchange is defined dynamically:

$$\text{Current Price} = \text{Base Value} \times \left(1 + \mathcal{F}\right) \times \left(1 + \mathcal{R}\right) \times \left(1 + \mathcal{D}\right) \times \mathcal{C}$$

Where:
- $\text{Base Value}$ ($BV$): The fundamental anchor price established at season launch (e.g., Erling Haaland: £120.0M; Kobbie Mainoo: £45.0M).
- $\mathcal{F}$: Real-world Form Factor ($-0.25 \le \mathcal{F} \le +0.30$).
- $\mathcal{R}$: Transfer Rumor Multiplier ($-0.20 \le \mathcal{R} \le +0.35$).
- $\mathcal{D}$: Platform Demand & Liquidity Factor ($-0.15 \le \mathcal{D} \le +0.25$).
- $\mathcal{C}$: Contract & Health Coefficient ($0.60 \le \mathcal{C} \le 1.00$).

---

## 2. Factor Formulations

### 2.1 Real-World Form Factor ($\mathcal{F}$)
Computed weekly after Premier League fixture gameweeks based on official match data:

$$\mathcal{F} = \alpha \cdot \left(\frac{\text{Rating}_{\text{last 3 avg}} - 6.5}{3.5}\right) + \beta \cdot (\text{Goals} \times 0.04 + \text{Assists} \times 0.02 + \text{CleanSheets} \times 0.03)$$

- **Benchmark**: Neutral rating is $6.5 / 10$.
- A rating of $9.0$ with 2 goals generates an approximate $+12\%$ to $+18\%$ upward form push.
- Benchings (0 minutes played) or consecutive $<5.0$ ratings apply gradual negative decay (capped at $-25\%$).

### 2.2 Transfer Rumor Multiplier ($\mathcal{R}$)
Incoming transfer reports affect valuation according to journalist credibility and community consensus:

$$\mathcal{R} = \mathcal{W}_{\text{Tier}} \times \text{Impact}_{\text{Event}} \times \left(0.5 + 0.5 \times \frac{\text{Votes}_{\text{Deal}}}{\text{Votes}_{\text{Deal}} + \text{Votes}_{\text{Delusion}}}\right)$$

| Journalist Tier | Credibility Weight ($\mathcal{W}_{\text{Tier}}$) | Example Sources | Base Shock |
| :--- | :---: | :--- | :---: |
| **Tier 1** | $1.00$ | David Ornstein, Fabrizio Romano, BBC Sport | $+15\%$ to $+25\%$ |
| **Tier 2** | $0.60$ | Reliable regional beat reporters (e.g., James Pearce, Sami Mokbel) | $+8\%$ to $+12\%$ |
| **Tier 3** | $0.35$ | National broadsheets, standard outlets | $+4\%$ to $+7\%$ |
| **Tier 4** | $0.10$ | Tabloids, speculative aggregate feeds | $+1\%$ to $+2\%$ |
| **Tier 5** | $0.02$ | Unverified social rumors, clickbait blogs | Negligible ($\sim 0\%$) |

#### Consensus Gauge Damping:
- If community votes $90\%$ "Delusion", the consensus multiplier is $(0.5 + 0.5 \times 0.10) = 0.55$, cutting the rumor shock almost in half.
- If community votes $90\%$ "Deal", the multiplier is $0.95$, expressing near-full market confidence.

### 2.3 In-Game Supply & Demand Factor ($\mathcal{D}$)
To prevent runaway speculative bubbles while rewarding savvy traders, platform net purchases over a rolling 48-hour window apply a logarithmic curve:

$$\mathcal{D} = \operatorname{sgn}(\Delta Q) \cdot \min\left(0.25, \, k \cdot \ln(1 + |\Delta Q|)\right)$$

Where:
- $\Delta Q = \text{Purchases}_{48\text{h}} - \text{Liquidations}_{48\text{h}}$
- $k = 0.035$ (dampening sensitivity constant)
- Maximum shift from in-game trading is bounded between $-15\%$ and $+25\%$.

### 2.4 Contract & Health Modifier ($\mathcal{C}$)
Simulates real-world contract leverage and physical setbacks:
- **Contract Length**:
  - $>24$ months remaining: $\mathcal{C}_{\text{contract}} = 1.00$
  - $12–24$ months: $\mathcal{C}_{\text{contract}} = 0.95$
  - $6–12$ months: $\mathcal{C}_{\text{contract}} = 0.85$
  - $<6$ months (Bosman risk): $\mathcal{C}_{\text{contract}} = 0.75$
- **Injury Status**:
  - Minor (knock, 1–2 weeks): $-5\%$
  - Moderate (muscle tear, 4–8 weeks): $-15\%$
  - Severe (ACL, Achilles, 6+ months): $-30\%$

---

## 3. ~~Automated Market Maker (AMM) Liquidity Pool~~ — DEPRECATED

> [!WARNING]
> The AMM liquidity pool described in this section has been removed. Players are no longer
> bought or sold through a central automated market maker with instant liquidity and a 3% broker fee.
> Player transfers now occur exclusively through peer-to-peer (P2P) negotiations within private League Worlds.
> The algorithmic pricing formulas in Sections 1–2 and the anti-exploit rules in Section 4 remain in effect.

---

## 4. Anti-Exploit & Economic Balance Controls

### 4.1 Anti-Collusion & Wash-Trading Shield
When two users negotiate a Peer-to-Peer (P2P) deal:
$$\left| \text{Fair Market Value}_{\text{Offered}} - \text{Fair Market Value}_{\text{Requested}} \right| \approx \text{Cash Adjustment}$$
If cash addition deviates by more than $20\%$ from the fair market delta:
- The trade proposal is **flagged and rejected**.
- Prevents users from spinning up secondary demo accounts to feed £150M purses into a single primary club.

### 4.2 Velocity Caps (Daily Quota)
- Each club is granted **5 trade proposals per rolling 24-hour period**.
- During real-world Premier League Transfer Deadline Days (Summer Deadline & Winter Deadline), the quota automatically expands to **25 trades per day** to simulate deadline madness.

### 4.3 Mandatory Roster Size
- Clubs must always hold between **11 and 25 players**.
- Prevents hoarding more than 25 players to monopolize supply.
- Prevents liquidating down to 0 players to sit in 100% cash risk-free during market downturns.
