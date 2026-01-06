# Regime Scale Analysis: Linear vs Alternatives

## The Question

Should we use a **linear regime scale** (-1.0 to +1.0) or something more sophisticated?

## Research Findings

✅ **Continuous scales are validated** - Research shows continuous regime detection is better than discrete states
❓ **But linear may not be optimal** - Markets exhibit non-linear behavior and regime persistence

## Linear Scale: Pros & Cons

### ✅ Pros
- **Simple**: Easy to understand and implement
- **Smooth**: Gradual transitions, no sudden jumps
- **Transparent**: Clear relationship between score and adaptation
- **Fast**: No complex calculations

### ❌ Cons
- **Assumes equal sensitivity**: Treats -0.1 and -0.9 the same way (both are "bear-ish")
- **No regime persistence**: Markets tend to stay in regimes for periods (momentum)
- **Extreme values rare**: -1.0 and +1.0 may never occur, wasting scale range
- **May over-react**: Small changes in middle range might cause unnecessary adaptation

## Alternatives to Consider

### Option 1: **Sigmoid/Tanh Transformation** (Recommended)

Compress extremes, more sensitive in middle range:

```go
// Tanh transformation: compresses extremes, more sensitive near 0
regimeScore = tanh(rawScore * 2.0)  // Maps -∞ to +∞ → -1.0 to +1.0

// Or sigmoid for asymmetric behavior
regimeScore = 2.0 / (1.0 + exp(-rawScore * 2.0)) - 1.0
```

**Benefits**:
- More sensitive in neutral range (where most time is spent)
- Compresses extreme values (prevents over-reaction)
- Smooth transitions
- Mathematically well-behaved

**Drawbacks**:
- Slightly more complex
- Requires tuning the compression factor

### Option 2: **Multi-Dimensional Scores**

Separate scores for different aspects:

```go
type RegimeScores struct {
    Momentum    float64  // -1.0 to +1.0 (return-based)
    Volatility  float64  // -1.0 to +1.0 (volatility-based, inverted)
    Drawdown    float64  // -1.0 to +1.0 (drawdown-based, inverted)
    Composite   float64  // Weighted average
}
```

**Benefits**:
- More nuanced understanding
- Can adapt different aspects independently
- Better diagnostics

**Drawbacks**:
- More complex
- Harder to interpret
- More parameters to tune

### Option 3: **Regime Probabilities** (HMM-style)

Probability distribution over discrete states:

```go
type RegimeProbabilities struct {
    Bull      float64  // Probability of bull (0.0 to 1.0)
    Bear      float64  // Probability of bear (0.0 to 1.0)
    Sideways  float64  // Probability of sideways (0.0 to 1.0)
    // Sums to 1.0
}
```

**Benefits**:
- Mathematically rigorous
- Handles uncertainty naturally
- Can use Hidden Markov Models

**Drawbacks**:
- Much more complex
- Requires statistical models
- Harder to implement
- May be overkill for retirement fund

### Option 4: **Hybrid: Discrete States with Confidence**

Keep discrete states but add confidence/probability:

```go
type RegimeState struct {
    State     string   // "bull", "bear", "sideways"
    Confidence float64 // 0.0 to 1.0 (how confident we are)
    Score     float64  // -1.0 to +1.0 (continuous for interpolation)
}
```

**Benefits**:
- Best of both worlds
- Easy to understand
- Can use continuous score for interpolation

**Drawbacks**:
- Still has discrete states (less smooth)
- Two values to track

## Recommendation: **Sigmoid/Tanh Transformation**

For a retirement fund with slow-growth strategy, I recommend **Option 1 (Sigmoid/Tanh)**:

1. **Matches your codebase**: You already use non-linear transformations (bell curves in scoring)
2. **Better sensitivity**: More responsive in the -0.5 to +0.5 range where markets spend most time
3. **Prevents over-reaction**: Compresses extremes, so -0.9 doesn't cause panic
4. **Still simple**: One transformation function, easy to understand
5. **Smooth**: Maintains smooth transitions

### Implementation

```go
// Calculate raw regime score from components
rawScore := (returnComponent * 0.50) +
            (volatilityComponent * 0.25) +
            (drawdownComponent * 0.25)

// Apply tanh transformation for non-linear compression
regimeScore := math.Tanh(rawScore * 2.0)  // Compresses extremes

// Or use sigmoid for asymmetric behavior
// regimeScore := 2.0 / (1.0 + math.Exp(-rawScore * 2.0)) - 1.0
```

**Why tanh?**
- Symmetric around 0
- Smooth and differentiable
- Compresses extremes naturally
- Standard in neural networks (well-understood)

**Tuning parameter**: The `2.0` multiplier controls compression:
- Higher (3.0): More compression, less sensitive
- Lower (1.0): Less compression, more linear
- 2.0 is a good default

## Comparison Table

| Approach | Complexity | Smoothness | Sensitivity | Best For |
|----------|-----------|------------|------------|----------|
| **Linear** | ⭐ Simple | ⭐⭐⭐ Smooth | ⭐⭐ Equal | Quick prototype |
| **Tanh/Sigmoid** | ⭐⭐ Medium | ⭐⭐⭐ Smooth | ⭐⭐⭐ Adaptive | **Recommended** |
| **Multi-Dimensional** | ⭐⭐⭐ Complex | ⭐⭐ Medium | ⭐⭐⭐ High | Advanced systems |
| **HMM Probabilities** | ⭐⭐⭐⭐ Very Complex | ⭐⭐⭐ Smooth | ⭐⭐⭐ High | Research/quant |
| **Hybrid** | ⭐⭐ Medium | ⭐⭐ Medium | ⭐⭐ Medium | Transition period |

## Decision Framework

**Choose Linear if**:
- You want maximum simplicity
- You're prototyping/testing
- You can tune thresholds manually

**Choose Tanh/Sigmoid if**:
- You want better sensitivity in middle range ✅
- You want to prevent over-reaction to extremes ✅
- You want non-linear behavior matching markets ✅
- **This matches your slow-growth retirement fund** ✅

**Choose Multi-Dimensional if**:
- You need fine-grained control
- You want to adapt different aspects independently
- Complexity is acceptable

**Choose HMM if**:
- You're doing research
- You have statistical expertise
- You need rigorous regime modeling

## Conclusion

**Linear is fine for a start**, but **tanh/sigmoid transformation is better** for a production retirement fund because:
1. Markets are non-linear (your codebase already acknowledges this with bell curves)
2. Better sensitivity where it matters (middle range)
3. Prevents over-reaction to extremes
4. Still simple enough to understand and maintain

**Recommendation**: Start with **tanh transformation** on the raw regime score. You can always switch to linear later if needed, but tanh is likely to perform better.
