```markdown
## Week 3 — Scoring Methodology (Version 0.1)

### Revenue Growth (Compound Annual Growth Rate)

The Revenue Growth score measures how consistently a company's revenue has compounded over multiple years. Companies with durable, above-average revenue growth receive higher scores because sustained revenue expansion is a key characteristic of successful long-term growth businesses.

| Revenue CAGR | Interpretation |
|---------------|---------------|
| Above 20% | Exceptional long-term growth |
| 12–20% | Strong long-term growth |
| 7–12% | Healthy, above-average growth |
| 3–7% | Modest growth |
| Below 3% | Insufficient growth for a long-term growth portfolio |

**Examples (illustrative, not fixed classifications):**

- NVIDIA has exhibited exceptional revenue growth during certain periods.
- Microsoft has demonstrated strong and durable long-term growth.
- Costco has generally delivered healthy, consistent growth.

> These examples are intended to illustrate the categories and should not be interpreted as permanent classifications. Companies may move between categories over time as their fundamentals change.

---

### Financial Strength

The Financial Strength score evaluates a company's ability to meet its financial obligations while continuing to invest in future growth.

The current implementation focuses primarily on the **Interest Coverage Ratio**, with a bonus for positive Free Cash Flow.

| Interest Coverage Ratio | Interpretation |
|--------------------------|---------------|
| Above 15× | Exceptional financial strength |
| 8×–15× | Strong financial strength |
| 3×–8× | Adequate financial strength |
| Below 3× | Elevated financial risk |

Additional considerations:

- Companies with little or no interest-bearing debt are treated as financially very strong.
- Positive Free Cash Flow increases the Financial Strength score because it indicates the business is generating cash that can be reinvested, used to reduce debt, or returned to shareholders.

**Note:** These thresholds represent the methodology used in Version 0.1 of the scoring engine and may evolve as the platform becomes more sophisticated.

---

### Design Philosophy

The scoring system is designed to:

- Reward durable, long-term business quality rather than short-term performance.
- Prioritize explainable scores over black-box algorithms.
- Base conclusions on objective financial evidence whenever possible.
- Remain modular so individual scoring models can be refined without redesigning the overall system.
```
