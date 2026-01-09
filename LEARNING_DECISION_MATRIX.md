# Learning Approaches: Comprehensive Decision Matrix

## Quick Reference for All 10 Approaches

### Approach Comparison at a Glance

```
VIABILITY TIER 1: IMPLEMENT FIRST (Week 1-8)
═══════════════════════════════════════════════════════════════════════════════

1. CHANGE POINT DETECTION (PELT)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Feasibility: ✓✓✓ (Trivial)                    │ Week: 1-2        │
   │ Complexity:  ✓ (Low)                          │ Effort: ~100 LOC │
   │ Interpretability: ✓✓✓ (Excellent)             │ Memory: 50MB     │
   │ "Event→Impact" Fit: ✓✓✓ (Excellent)           │ CPU: <1 sec      │
   │                                                                      │
   │ Why Start Here:                                                    │
   │ • Simplest algorithm (unsupervised)                               │
   │ • Runs daily on existing price data                               │
   │ • Shows exact dates when markets shift                            │
   │ • Natural foundation for all other methods                        │
   │ • Immediate operational value                                    │
   │                                                                      │
   │ Expected Output:                                                   │
   │ "VIX jumped 42% on 2024-01-15 (coincided with FOMC meeting)"    │
   │                                                                      │
   │ Next Action: Correlate detected breaks with event calendar       │
   └─────────────────────────────────────────────────────────────────────┘

2. CAUSAL INFERENCE (2SLS)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Feasibility: ✓✓✓ (Feasible)                   │ Week: 3-4        │
   │ Complexity:  ✓✓ (Medium)                      │ Effort: ~600 LOC │
   │ Interpretability: ✓✓✓ (Excellent)             │ Memory: <50MB    │
   │ "Event→Impact" Fit: ✓✓✓ (Excellent)           │ CPU: <1 sec      │
   │                                                                      │
   │ Why Essential:                                                    │
   │ • Most rigorous causality discovery                               │
   │ • Handles confounding (multiple events at once)                  │
   │ • Gives confidence intervals, not just point estimates           │
   │ • Interpretable: "War → -2.5% returns (95% CI: -3.1% to -1.9%)" │
   │                                                                      │
   │ Expected Output:                                                   │
   │ ┌──────────────────────────────────────────────────┐              │
   │ │ Event Type    Coefficient  95% CI        P-value │              │
   │ ├──────────────────────────────────────────────────┤              │
   │ │ War           -0.025  [-0.035, -0.015]  0.001   │              │
   │ │ Sanctions     -0.012  [-0.018, -0.006]  0.002   │              │
   │ │ Trade Tension -0.003  [-0.008, +0.002]  0.350   │              │
   │ │ CB Rate Hike  +0.008  [+0.002, +0.014]  0.008   │              │
   │ └──────────────────────────────────────────────────┘              │
   │                                                                      │
   │ Next Action: Monthly retraining as new events occur              │
   └─────────────────────────────────────────────────────────────────────┘

3. ANOMALY DETECTION (Isolation Forest)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Feasibility: ✓✓✓ (Trivial)                    │ Week: 2-3        │
   │ Complexity:  ✓ (Low)                          │ Effort: ~400 LOC │
   │ Interpretability: ✓✓ (Good)                   │ Memory: 50MB     │
   │ "Event→Impact" Fit: ✓✓ (Good)                 │ CPU: <1ms/point  │
   │                                                                      │
   │ Why Useful:                                                       │
   │ • Complements CPD (spikes vs. shifts)                            │
   │ • Unsupervised (no labels needed)                                │
   │ • Fast inference (real-time scoring)                             │
   │ • Foundation for opportunity detection                           │
   │                                                                      │
   │ Expected Output:                                                   │
   │ "S&P 500 return on 2024-02-15 was 3.2σ outlier (prob=0.002)"   │
   │                                                                      │
   │ Next Action: Cross-reference with event calendar + causal attr. │
   └─────────────────────────────────────────────────────────────────────┘

4. ACTIVE LEARNING (Uncertainty Sampling)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Feasibility: ✓✓✓ (Trivial)                    │ Week: 5-6        │
   │ Complexity:  ✓ (Low)                          │ Effort: ~400 LOC │
   │ Interpretability: ✓✓✓ (Excellent)             │ Memory: <10MB    │
   │ "Event→Impact" Fit: ✓✓✓ (Excellent)           │ CPU: <1 sec      │
   │                                                                      │
   │ Why Critical:                                                     │
   │ • Grows training data efficiently                                │
   │ • User provides ground truth (improves all models)               │
   │ • Simple UX: "These 10 events confuse us—help us learn!"         │
   │ • Compounding: Each label improves future uncertainty ranking    │
   │                                                                      │
   │ Expected Output:                                                   │
   │ Monthly: 5-10 user labels + notes                                │
   │ Quarterly: Model confidence improves (0.73 → 0.82)               │
   │                                                                      │
   │ Next Action: Build "Help Us Learn" tab in frontend              │
   └─────────────────────────────────────────────────────────────────────┘

5. BAYESIAN LINEAR REGRESSION (Spike-and-Slab)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Feasibility: ✓✓✓ (Feasible)                   │ Week: 6-8        │
   │ Complexity:  ✓✓ (Medium)                      │ Effort: ~700 LOC │
   │ Interpretability: ✓✓✓ (Excellent)             │ Memory: <50MB    │
   │ "Event→Impact" Fit: ✓✓✓ (Excellent)           │ CPU: ~30 sec mo. │
   │                                                                      │
   │ Why Essential:                                                    │
   │ • Automatic feature selection                                    │
   │ • Answers: "Which event types actually matter?"                  │
   │ • Probabilistic: P(War matters | data) = 0.94                   │
   │ • Complements causal inference (different angle)                │
   │                                                                      │
   │ Expected Output:                                                   │
   │ ┌────────────────────────────────────────────┐                    │
   │ │ Feature          P(≠0)  Mean    95% CI     │                    │
   │ ├────────────────────────────────────────────┤                    │
   │ │ War              0.94   -2.5%   [-3.1%, -1.9%] │                    │
   │ │ Sanctions        0.87   -1.2%   [-1.8%, -0.6%] │                    │
   │ │ Political Tension 0.42  -0.05%  [-0.4%, +0.3%] │                    │
   │ │ Central Bank Hike 0.96   +0.8%   [+0.4%, +1.1%] │                    │
   │ └────────────────────────────────────────────┘                    │
   │                                                                      │
   │ Next Action: Identify insignificant features, refocus effort     │
   └─────────────────────────────────────────────────────────────────────┘

6. ANOMALY ATTRIBUTION (Causal + IF)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Feasibility: ✓✓✓ (Feasible)                   │ Week: 4-5        │
   │ Complexity:  ✓✓ (Medium)                      │ Effort: ~300 LOC │
   │ Interpretability: ✓✓✓ (Excellent)             │ Memory: <50MB    │
   │ "Event→Impact" Fit: ✓✓✓ (Excellent)           │ CPU: <1 sec      │
   │                                                                      │
   │ Why Powerful:                                                     │
   │ • Explains surprises: "Market moved unexpectedly—why?"          │
   │ • Uses causal inference to attribute blame/credit                │
   │ • Flags opportunities: "Unexplained anomaly—investigate"         │
   │ • Weekly reporting builds user confidence                        │
   │                                                                      │
   │ Expected Output:                                                   │
   │ Weekly Report:                                                    │
   │ "VIX jumped 25% on 2024-01-15"                                  │
   │ "FOMC announcement explains 60% of jump (p=0.02)"               │
   │ "Remaining 40% unexplained (data error? latent factors?)"       │
   │                                                                      │
   │ Opportunity: "Anomaly > 3σ and unexplained. Investigate."       │
   │                                                                      │
   │ Next Action: Track quality of explanations (residuals)          │
   └─────────────────────────────────────────────────────────────────────┘


VIABILITY TIER 2: ADD IF PHASE 1 SUCCEEDS (Week 8-12)
═══════════════════════════════════════════════════════════════════════════════

7. SYMBOLIC REGRESSION (Extend Existing)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Feasibility: ✓✓✓ (Feasible)                   │ Week: 6-8 (phase 2) │
   │ Complexity:  ✓✓ (Medium)                      │ Effort: ~200 LOC ext │
   │ Interpretability: ✓✓✓ (Excellent)             │ Memory: ~150MB       │
   │ "Event→Impact" Fit: ✓✓✓ (Excellent)           │ CPU: ~30 min/mo      │
   │                                                                      │
   │ Why Good Addition:                                                │
   │ • Discovered formulas are transparent & interpretable            │
   │ • Can discover non-linear relationships (formulas)               │
   │ • You already have genetic algorithm infrastructure              │
   │ • Complements linear causal models                               │
   │                                                                      │
   │ Expected Output:                                                   │
   │ Impact = -0.01×Sentiment + 0.5×Sentiment² - 0.0003×DaysSince   │
   │ (Explains 65% of variance, R² = 0.42)                           │
   │                                                                      │
   │ Next Action: Feed Bayesian feature importance as guidance       │
   └─────────────────────────────────────────────────────────────────────┘

8. HIDDEN MARKOV MODELS (Regime Detection Upgrade)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Feasibility: ✓✓✓ (Feasible)                   │ Week: 8-10 (phase 2)  │
   │ Complexity:  ✓✓ (Medium)                      │ Effort: ~600 LOC      │
   │ Interpretability: ✓✓ (Good)                   │ Memory: <50MB         │
   │ "Event→Impact" Fit: ✓✓ (Good)                 │ CPU: <1 sec           │
   │                                                                      │
   │ Why Nice to Have:                                                │
   │ • Probabilistic state transitions (more principled than current) │
   │ • States: Calm, Volatile, Crisis                                │
   │ • Detects state changes (events trigger transitions)            │
   │ • Integrates with regime-aware models (stratify by state)       │
   │                                                                      │
   │ Expected Output:                                                   │
   │ State Sequence: Calm (0.9) → Chaotic (0.7) → Stressed (0.6)   │
   │ P(Calm→Chaotic | War) = 0.85                                   │
   │                                                                      │
   │ Next Action: Replace current regime detector gradually          │
   └─────────────────────────────────────────────────────────────────────┘

9. GAUSSIAN PROCESSES (Non-Linear Impact Functions)
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Feasibility: ✓✓✓ (Feasible) [up to ~500 events]                 │ Week: 8-10 (phase 2)  │
   │ Complexity:  ✓✓ (Medium)                      │ Effort: ~500 LOC      │
   │ Interpretability: ✓✓ (Good)                   │ Memory: ~100MB        │
   │ "Event→Impact" Fit: ✓✓ (Good)                 │ CPU: ~20 sec/update   │
   │                                                                      │
   │ Why Optional:                                                     │
   │ • Non-parametric (no assumption on functional form)              │
   │ • Uncertainty bounds (wider where data sparse)                   │
   │ • Scales O(n³) — don't exceed 500 events                        │
   │ • Better than Bayesian linear if relationships are curved       │
   │                                                                      │
   │ Expected Output:                                                   │
   │ At Sentiment=0.5:                                                │
   │   Predicted impact: -1.2% (95% CI: -2.1% to -0.3%)             │
   │   (High confidence; many similar historical events)              │
   │                                                                      │
   │ Next Action: Use when Bayesian linear saturates                │
   └─────────────────────────────────────────────────────────────────────┘


VIABILITY TIER 3: MAYBE LATER (Month 6+)
═══════════════════════════════════════════════════════════════════════════════

10. KNOWLEDGE GRAPHS (Explicit Reasoning)
    ┌─────────────────────────────────────────────────────────────────┐
    │ Feasibility: ✓✓ (Doable)                      │ Month: 6+       │
    │ Complexity:  ✓✓ (Medium)                      │ Effort: ~800 LOC│
    │ Interpretability: ✓✓✓ (Excellent)             │ Memory: ~50MB   │
    │ "Event→Impact" Fit: ✓✓ (Good)                 │ CPU: <1 sec     │
    │                                                                    │
    │ Why Consider:                                                  │
    │ • Transparent reasoning chains                                  │
    │ • Can encode domain knowledge explicitly                        │
    │ • Manual but interpretable                                      │
    │ • Integrates with causal inference (test hypotheses)           │
    │                                                                    │
    │ Expected Output:                                                 │
    │ [War in Ukraine] →affects_commodity→ [Oil] →increases_price→   │
    │ [Energy stocks] →in_portfolio→ [Your holdings]                 │
    │ → Predicted impact: +2.3%                                       │
    │                                                                    │
    │ Next Action: Build incrementally, start with 10 entities      │
    └─────────────────────────────────────────────────────────────────┘


VIABILITY TIER 4: SKIP (Not viable for this domain)
═══════════════════════════════════════════════════════════════════════════════

✗ Deep Learning (TensorFlow, PyTorch)
  ✗ No GPU on ARM hardware
  ✗ Slow inference, high memory
  ✗ Interpretability issues (black-box)
  ✗ Overkill for 50-100 training examples

✗ Meta-Learning / Few-Shot Learning
  ✗ Requires expensive gradient-based optimization
  ✗ You don't have massive pre-training datasets
  ✗ Complex to implement and debug

✗ Graph Neural Networks
  ✗ Memory-heavy on embedded hardware
  ✗ Slow training on ARM
  ✗ Opaque reasoning

✗ Reinforcement Learning
  ✗ Portfolio management is already a solved optimization problem
  ✗ RL adds complexity without benefit
  ✗ Data-inefficient


═══════════════════════════════════════════════════════════════════════════════
IMPLEMENTATION PRIORITY RANKING
═══════════════════════════════════════════════════════════════════════════════

WEEK 1-2:
  1. ⭐⭐⭐ Change Point Detection
     └─ Immediate operational value, simplest algorithm

WEEK 3-4:
  2. ⭐⭐⭐ Causal Inference (2SLS)
     └─ Most rigorous causality discovery

WEEK 4-5:
  3. ⭐⭐⭐ Anomaly Detection + Attribution
     └─ Explains surprises, builds on CPD

WEEK 5-6:
  4. ⭐⭐⭐ Active Learning
     └─ Grows training data, user engagement

WEEK 6-8:
  5. ⭐⭐⭐ Bayesian Linear Regression
     └─ Feature selection, uncertainty quantification

MONTH 2 (IF TIME):
  6. ⭐⭐ Symbolic Regression Extension
     └─ Discovered formulas, non-linear relationships

MONTH 3 (IF VALIDATED):
  7. ⭐⭐ Hidden Markov Models
     └─ Regime detection upgrade

  8. ⭐ Gaussian Processes
     └─ Non-parametric impact functions

  9. ⭐ Knowledge Graphs
     └─ Explicit reasoning (nice-to-have)


═══════════════════════════════════════════════════════════════════════════════
RESOURCE REQUIREMENTS SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Phase 1 (8 weeks):
  Memory:    400-600MB (all 5 methods running)
  CPU:       ~3-5 min/month retraining
  Developer: 1 FTE (or 2 part-time)
  Data:      50-100 curated events

Phase 2 (4 weeks):
  Memory:    600-800MB
  CPU:       ~10-15 min/month retraining
  Developer: 0.5 FTE
  Data:      100-200 events (via active learning)

Deployment Target:
  Arduino Uno Q (2GB ARM64):
  ✓ All Phase 1 methods fit easily
  ✓ Phase 2 methods fit, slower retraining
  ✓ Max sustainable: 200-300 training examples


═══════════════════════════════════════════════════════════════════════════════
SUCCESS CRITERIA CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

By Week 8:
  ☐ Can explain 50-70% of major market moves to events
  ☐ Event catalog: 50+ events with documented impacts
  ☐ Active learning: 20+ user labels collected
  ☐ Monthly retraining runs in < 5 minutes
  ☐ Models show confidence intervals (not point estimates)
  ☐ Causal effects significant at p < 0.10 level
  ☐ Anomaly attribution explains 60%+ of detected breaks

By Month 3 (Phase 2):
  ☐ Can explain 70-80% of market moves
  ☐ 5-7 independent models voting (ensemble)
  ☐ Opportunity detection flags 2-3 high-quality trades/month
  ☐ User confidence in system increasing (validation data)
  ☐ Feature importance rankings stable (not noisy)

By Month 6+:
  ☐ Models inform allocation decisions
  ☐ Event sensitivity integrated into risk dashboard
  ☐ Causal relationships documented & stable
  ☐ Live trading results validate predictions


═══════════════════════════════════════════════════════════════════════════════
DECISION FLOWCHART
═══════════════════════════════════════════════════════════════════════════════

START
  │
  ├─ Do you have/can you curate 50+ historical events?
  │  ├─ NO  → Spend 2-3 weeks on event research first
  │  └─ YES → Continue
  │
  ├─ Can you spare 1 FTE × 8 weeks?
  │  ├─ NO  → Reduce scope to Phase 1a (CPD + Causal only = 4 weeks)
  │  └─ YES → Continue
  │
  ├─ Can you label 5-10 uncertain events per month?
  │  ├─ NO  → Skip active learning, reduce model improvement rate
  │  └─ YES → Continue (this is critical)
  │
  ├─ Are you willing to accept models that are 70-80% accurate initially?
  │  ├─ NO  → Adjust expectations or add more domain expertise
  │  └─ YES → Continue
  │
  ├─ Do you want models to inform allocation or just inform thinking?
  │  ├─ "Just inform" → Simpler integration, lower risk
  │  └─ "Inform allocation" → Need stricter confidence thresholds
  │
  └─ PROCEED with Phase 1 implementation
     Cost: 1 FTE × 8 weeks + 50+ hours event curation
     Benefit: Statistically rigorous geopolitical impact learning


═══════════════════════════════════════════════════════════════════════════════
```

## Key Takeaways

### ✓ What Will Succeed
1. **Change Point Detection**: Start here (Week 1-2)
2. **Causal Inference**: Foundation for understanding (Week 3-4)
3. **Bayesian Methods**: Answer "what matters?" (Week 6-8)
4. **Active Learning**: Grow data efficiently (Week 5-6)
5. **Symbolic Regression**: Discovered formulas (Phase 2)

### ✗ What Won't Work
- Deep learning (no GPU, slow on ARM)
- Meta-learning (expensive, you lack pre-training data)
- RL (over-engineered for this problem)
- GNNs (memory/CPU prohibitive)

### ⚠️ Critical Unknowns
1. Event catalog: Do you have 50+ events?
2. Feedback loop: Can you label 5-10/month?
3. Latency: Can you afford 30+ min retraining?
4. Risk tolerance: How confident must models be?

### 🎯 Expected Outcome
By Week 8: Models explain 50-70% of major market moves
By Week 12: Models explain 70-80% of market moves
By Month 6: Models inform allocation decisions

---

**Ready to build this? Start with Change Point Detection. Week 1.**
