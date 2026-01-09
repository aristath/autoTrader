# Pre-Implementation Checklist

Before starting Phase 1, verify:

## Decision Gate 1: Do you have enough data?

- [ ] Can you identify 30+ historical geopolitical events?
- [ ] For each event, can you find: Date, Description, Affected Regions?
- [ ] Do you have market return data for the 30 days following each event?
- [ ] Do you have additional context (news articles, government statements)?

**If NO to any**: Spend 1-2 weeks researching events before starting coding.
**If YES to all**: Proceed to Gate 2.

---

## Decision Gate 2: Can you commit resources?

- [ ] Do you have 1 full-time developer for 8 weeks?
  - OR: 2 part-time developers for 4 weeks?
- [ ] Does the developer have Go + SQL experience?
- [ ] Does the developer have statistics experience (or willingness to learn)?
- [ ] Can you allocate 20-30 hours for event catalog curation?

**If NO to any**: Reduce scope (CPD + Causal only = 4 weeks instead of 8).
**If YES to all**: Proceed to Gate 3.

---

## Decision Gate 3: Are you ready for uncertainty?

- [ ] Can you accept models that are 70-80% accurate initially?
- [ ] Will you use models as "weak signal" not hard decisions?
- [ ] Can you wait 6+ months for models to stabilize?
- [ ] Are you willing to override model predictions when needed?

**If NO to any**: Adjust expectations or reconsider project.
**If YES to all**: Proceed to Gate 4.

---

## Decision Gate 4: Will you maintain the system?

- [ ] Can you label 5-10 uncertain events per month?
- [ ] Can you audit model accuracy quarterly?
- [ ] Can you curate new events as they happen?
- [ ] Are you willing to retrain models monthly?

**If NO to any**: Consider simpler approaches (CPD-only, no active learning).
**If YES to all**: You're ready for Phase 1.

---

## Pre-Implementation Tasks

### Task 1: Event Catalog Curation
- [ ] Research 50 major geopolitical events since 2019
- [ ] Document for each:
  - Date (±1 day accuracy)
  - Type (War, Sanctions, Trade Tension, etc.)
  - Regions affected
  - Intensity (0-1 scale)
  - Primary news sources
- [ ] For each event, find market returns 1-30 days post-event
- [ ] Store in CSV or JSON (temporary format, migrate to agents.db later)

**Output**: `events_catalog.csv` with 50+ events
**Effort**: 20-30 hours research
**Timeline**: 1-2 weeks before coding starts

### Task 2: Market Data Validation
- [ ] Verify you have daily price data for:
  - S&P 500 / Global equity indices
  - VIX or volatility measures
  - Currency pairs (if applicable)
  - Sector indices (if using)
- [ ] Check data quality: Any gaps? Outliers?
- [ ] Compute daily returns (log returns preferred)

**Output**: Verified price history (you likely have this)
**Effort**: 2-3 hours
**Timeline**: Before Week 1 coding

### Task 3: Database Schema Design
- [ ] Review agents.db schema proposal (see RESEARCH_ADAPTIVE_LEARNING.md)
- [ ] Decide: Store event features in separate table or computed on-the-fly?
- [ ] Design: How will user labels be stored?
- [ ] Design: How will model predictions be audited?

**Output**: Finalized agents.db schema (SQL file)
**Effort**: 3-4 hours (with architecture review)
**Timeline**: Before Week 1 coding

### Task 4: Dependency Audit
- [ ] Verify gonum/matrix is available in your go.mod
- [ ] Check if any new dependencies will add to binary size
- [ ] Plan: Will you implement MCMC from scratch or use library?

**Output**: Dependency list for Phase 1
**Effort**: 1-2 hours
**Timeline**: Before Week 1 coding

---

## Week 1 Preparation

### Before Developer Starts Coding
- [ ] Event catalog finalized (50+ events in CSV)
- [ ] Market data validated
- [ ] agents.db schema approved
- [ ] DI container integration plan sketched
- [ ] UI/routing sketched (for active learning, anomaly reports)

### Developer Checklist (Week 1 only)
- [ ] Review RESEARCH_ADAPTIVE_LEARNING.md (Section 2)
- [ ] Review LEARNING_CODE_STUBS.md (Change Point Detection section)
- [ ] Implement basic event structures (models.go, repository.go)
- [ ] Create agents.db migration
- [ ] Implement CPD algorithm
- [ ] Create unit tests for CPD
- [ ] Verify CPD works on real price data

---

## Success Criteria by Week

### Week 2 (End of Event Infrastructure)
- [ ] Existing 50 events loaded into agents.db
- [ ] Event features can be computed
- [ ] Training example generation works
- [ ] Historical impact data available for validation

### Week 3 (End of CPD)
- [ ] CPD detects 5-10 breaks in S&P 500 price history
- [ ] Detected breaks correlate with event calendar
- [ ] False positive rate < 30%
- [ ] Weekly CPD job runs in < 2 seconds

### Week 4 (End of Causal Inference)
- [ ] 2SLS regression runs successfully
- [ ] At least 3 event types show p < 0.15 significance
- [ ] Confidence intervals are < 5% width (on average)
- [ ] Monthly job completes in < 10 seconds

### Week 5 (End of Anomaly Attribution)
- [ ] Anomalies detected + attributed to events
- [ ] 60%+ of detected anomalies have explanation (residual < 50%)
- [ ] Weekly report generation working

### Week 6 (End of Active Learning)
- [ ] UI shows top 10 uncertain events
- [ ] Users can label events via API
- [ ] Labels trigger monthly retraining

### Week 8 (End of Bayesian Regression)
- [ ] Gibbs sampler converges in < 5 minutes
- [ ] Feature significance computed for all event types
- [ ] P(≠0) values stable across runs
- [ ] Can identify 3-5 "definitely matters" features

---

## Deployment Readiness Checklist

### Before Phase 1 Production
- [ ] All 6 modules tested with 20+ events
- [ ] Monthly retraining completes in < 5 minutes (on target hardware)
- [ ] agents.db fits in disk space budget
- [ ] Error handling comprehensive (APIs fail gracefully)
- [ ] Logging captures all important events
- [ ] UI components tested with real data
- [ ] Accuracy metrics computed and tracked

### Phase 1 Go-Live
- [ ] Event catalog live in system
- [ ] CPD + Causal + Bayesian running weekly/monthly
- [ ] Active learning UI deployed
- [ ] Anomaly reports sent to user
- [ ] Model predictions stored for audit trail
- [ ] Quarterly accuracy review scheduled

---

## Risk Mitigation

### If Event Catalog Is Sparse
- Don't delay Phase 1
- Start with 20-30 events, grow via active learning
- Expect wider confidence intervals initially
- Set confidence thresholds conservatively

### If Developer Lacks Statistics Background
- Pair with domain expert (you) during implementation
- Reference papers listed in RESEARCH_ADAPTIVE_LEARNING.md
- Test algorithms on synthetic data first
- Use gonum/stat for hypothesis tests

### If Models Show Poor Performance
- This is expected initially (small data)
- Focus on: Which event types matter? (Bayesian answer this)
- Refine feature engineering based on Bayesian results
- Re-run causal inference with better features
- Expected improvement: Each month as data grows

### If Retraining Takes Too Long
- Profile code (where is time spent?)
- Simplify (reduce complexity weight in symbolic regression)
- Parallelize (Gibbs sampling can be vectorized)
- Cache (pre-compute if possible)
- Don't skip; optimize

---

## Documentation Requirements

### Code Comments
Reference the research documents:
```go
// See: RESEARCH_ADAPTIVE_LEARNING.md Section 2
// for PELT algorithm details
```

### Commit Messages
Include context:
```
feat(time_series): implement PELT change point detection

Detects abrupt shifts in market regimes coinciding with events.
Uses dynamic programming (O(n log n) with pruning).
See: LEARNING_CODE_STUBS.md for algorithm details
See: RESEARCH_ADAPTIVE_LEARNING.md Section 2.1 for evaluation
```

### Monthly Status Reports
Track:
- [ ] Number of events processed
- [ ] Model accuracy (predictions vs realized)
- [ ] Confidence interval widths
- [ ] User labels collected
- [ ] Top discovered relationships

---

## Monthly Cadence (After Phase 1)

### 1st Week: Event Curation
- [ ] Research 2-3 new geopolitical events
- [ ] Update events_catalog
- [ ] Add to agents.db

### 2nd Week: Model Retraining
- [ ] Run causal inference (2SLS)
- [ ] Run Bayesian feature selection
- [ ] Update model predictions
- [ ] Store results in agents.db

### 3rd Week: Active Learning
- [ ] Identify 10 most uncertain events
- [ ] User labels uncertain events
- [ ] Retrain with new labels

### 4th Week: Auditing
- [ ] Compare predictions vs realized impacts
- [ ] Measure: Accuracy, precision, confidence
- [ ] Document: Which models improved? Which regressed?
- [ ] Plan adjustments for next month

---

## Go/No-Go Criteria

### Final Gate Before Week 1 Starts

Do you have:
- [ ] YES 50+ historical events curated?
- [ ] YES Event descriptions + observed market impacts?
- [ ] YES Committed developer time (8+ weeks)?
- [ ] YES Realistic expectation (75% accuracy initially)?
- [ ] YES Buy-in for monthly labeling + auditing?

**All YES**: Start Week 1
**Any NO**: Delay Phase 1, address blocker first

---

## Post-Research Review (If helpful)

- [ ] Read LEARNING_EXECUTIVE_SUMMARY.md (15 min)
- [ ] Skim LEARNING_DECISION_MATRIX.md (10 min)
- [ ] Review LEARNING_IMPLEMENTATION_ROADMAP.md (30 min)
- [ ] Deep-dive RESEARCH_ADAPTIVE_LEARNING.md Section 1-3 (45 min)
- [ ] Scan LEARNING_CODE_STUBS.md for your components (20 min)

Total time to understanding: ~2 hours

---

## Estimated Total Effort Before Coding

- Event curation: 20-30 hours
- Schema design: 3-4 hours
- Dependency audit: 1-2 hours
- Developer preparation: 2-3 hours
- Research review: 2 hours

**Total: 30-45 hours** (mostly event research)

Recommend: 1-2 weeks of preparation before developer starts Week 1 coding.

---

**Status**: Ready for review
**Revision Date**: 2026-01-09
**Next Step**: Verify all checkboxes, address blockers, proceed when all gates green
