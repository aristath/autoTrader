package universe

import (
	"math"

	"github.com/rs/zerolog"
)

// TagAssigner assigns tags to securities based on analysis
type TagAssigner struct {
	log zerolog.Logger
}

// NewTagAssigner creates a new tag assigner
func NewTagAssigner(log zerolog.Logger) *TagAssigner {
	return &TagAssigner{
		log: log.With().Str("service", "tag_assigner").Logger(),
	}
}

// AssignTagsInput contains all data needed to assign tags to a security
type AssignTagsInput struct {
	Symbol               string
	Security             Security
	Score                *SecurityScore
	GroupScores          map[string]float64
	SubScores            map[string]map[string]float64
	Volatility           *float64
	DailyPrices          []float64
	PERatio              *float64
	MarketAvgPE          float64
	DividendYield        *float64
	FiveYearAvgDivYield  *float64
	CurrentPrice         *float64
	Price52wHigh         *float64
	Price52wLow          *float64
	EMA200               *float64
	RSI                  *float64
	BollingerPosition    *float64
	MaxDrawdown          *float64
	PositionWeight       *float64
	TargetWeight         *float64
	AnnualizedReturn     *float64
	DaysHeld             *int
	HistoricalVolatility *float64
}

// AssignTagsForSecurity analyzes a security and returns appropriate tag IDs
func (ta *TagAssigner) AssignTagsForSecurity(input AssignTagsInput) ([]string, error) {
	var tags []string

	// Extract scores for easier access
	opportunityScore := getScore(input.GroupScores, "opportunity")
	fundamentalsScore := getScore(input.GroupScores, "fundamentals")
	longTermScore := getScore(input.GroupScores, "long_term")
	technicalScore := getScore(input.GroupScores, "technicals")
	shortTermScore := getScore(input.GroupScores, "short_term")
	dividendScore := getScore(input.GroupScores, "dividends")
	totalScore := 0.0
	if input.Score != nil {
		totalScore = input.Score.TotalScore
	}

	// Extract sub-scores
	consistencyScore := getSubScore(input.SubScores, "fundamentals", "consistency")
	cagrScore := getSubScore(input.SubScores, "long_term", "cagr")
	momentumScore := getSubScore(input.SubScores, "short_term", "momentum")
	dividendConsistencyScore := getSubScore(input.SubScores, "dividends", "consistency")

	// Calculate derived metrics
	volatility := 0.0
	if input.Volatility != nil {
		volatility = *input.Volatility
	}

	below52wHighPct := calculateBelow52wHighPct(input.CurrentPrice, input.Price52wHigh)
	peRatio := 0.0
	if input.PERatio != nil {
		peRatio = *input.PERatio
	}
	peVsMarket := 0.0
	if input.MarketAvgPE > 0 && peRatio > 0 {
		peVsMarket = (peRatio - input.MarketAvgPE) / input.MarketAvgPE
	}

	dividendYield := 0.0
	if input.DividendYield != nil {
		dividendYield = *input.DividendYield
	}

	rsi := 0.0
	if input.RSI != nil {
		rsi = *input.RSI
	}

	ema200 := 0.0
	if input.EMA200 != nil && input.CurrentPrice != nil {
		ema200 = *input.EMA200
	}

	distanceFromEMA := 0.0
	if input.CurrentPrice != nil && ema200 > 0 {
		distanceFromEMA = (*input.CurrentPrice - ema200) / ema200
	}

	bollingerPosition := 0.0
	if input.BollingerPosition != nil {
		bollingerPosition = *input.BollingerPosition
	}

	maxDrawdown := 0.0
	if input.MaxDrawdown != nil {
		maxDrawdown = *input.MaxDrawdown
	}

	historicalVolatility := volatility
	if input.HistoricalVolatility != nil {
		historicalVolatility = *input.HistoricalVolatility
	}

	volatilitySpike := false
	if historicalVolatility > 0 {
		volatilitySpike = volatility > historicalVolatility*1.5
	}

	annualizedReturn := 0.0
	if input.AnnualizedReturn != nil {
		annualizedReturn = *input.AnnualizedReturn
	}

	daysHeld := 0
	if input.DaysHeld != nil {
		daysHeld = *input.DaysHeld
	}

	positionWeight := 0.0
	if input.PositionWeight != nil {
		positionWeight = *input.PositionWeight
	}

	targetWeight := 0.0
	if input.TargetWeight != nil {
		targetWeight = *input.TargetWeight
	}

	// === OPPORTUNITY TAGS ===

	// Value Opportunities
	if opportunityScore > 0.7 && (below52wHighPct > 20.0 || peVsMarket < -0.20) {
		tags = append(tags, "value-opportunity")
	}

	if below52wHighPct > 30.0 && peVsMarket < -0.20 {
		tags = append(tags, "deep-value")
	}

	if below52wHighPct > 10.0 {
		tags = append(tags, "below-52w-high")
	}

	if peVsMarket < -0.20 {
		tags = append(tags, "undervalued-pe")
	}

	// Quality Opportunities
	if fundamentalsScore > 0.8 && longTermScore > 0.75 {
		tags = append(tags, "high-quality")
	}

	if fundamentalsScore > 0.75 && volatility < 0.20 && consistencyScore > 0.8 {
		tags = append(tags, "stable")
	}

	if consistencyScore > 0.8 && cagrScore > 8.0 {
		tags = append(tags, "consistent-grower")
	}

	if fundamentalsScore > 0.8 {
		tags = append(tags, "strong-fundamentals")
	}

	// Technical Opportunities
	if rsi < 30 {
		tags = append(tags, "oversold")
	}

	if distanceFromEMA < -0.05 {
		tags = append(tags, "below-ema")
	}

	if bollingerPosition < 0.2 {
		tags = append(tags, "bollinger-oversold")
	}

	// Dividend Opportunities
	if dividendYield > 6.0 {
		tags = append(tags, "high-dividend")
	}

	if dividendScore > 0.7 && dividendYield > 3.0 {
		tags = append(tags, "dividend-opportunity")
	}

	if dividendConsistencyScore > 0.8 && input.FiveYearAvgDivYield != nil && dividendYield > 0 {
		if *input.FiveYearAvgDivYield > dividendYield {
			tags = append(tags, "dividend-grower")
		}
	}

	// Momentum Opportunities
	if shortTermScore > 0.7 && momentumScore > 0.05 && momentumScore < 0.15 {
		tags = append(tags, "positive-momentum")
	}

	if momentumScore < 0 && fundamentalsScore > 0.7 && below52wHighPct > 15.0 {
		tags = append(tags, "recovery-candidate")
	}

	// Score-Based Opportunities
	if totalScore > 0.75 {
		tags = append(tags, "high-score")
	}

	if totalScore > 0.7 && opportunityScore > 0.7 {
		tags = append(tags, "good-opportunity")
	}

	// === DANGER TAGS ===

	// Volatility Warnings
	if volatility > 0.30 {
		tags = append(tags, "volatile")
	}

	if volatilitySpike {
		tags = append(tags, "volatility-spike")
	}

	if volatility > 0.40 {
		tags = append(tags, "high-volatility")
	}

	// Overvaluation Warnings
	if peVsMarket > 0.20 && below52wHighPct < 5.0 {
		tags = append(tags, "overvalued")
	}

	if below52wHighPct < 5.0 && input.Price52wHigh != nil && input.CurrentPrice != nil {
		if *input.CurrentPrice > *input.Price52wHigh*0.95 {
			tags = append(tags, "near-52w-high")
		}
	}

	if distanceFromEMA > 0.10 {
		tags = append(tags, "above-ema")
	}

	if rsi > 70 {
		tags = append(tags, "overbought")
	}

	// Instability Warnings
	// Note: Instability score from sell scorer not available in current input
	// Would need to be added if available
	if annualizedReturn > 50.0 && volatilitySpike {
		tags = append(tags, "unsustainable-gains")
	}

	if math.Abs(distanceFromEMA) > 0.30 {
		tags = append(tags, "valuation-stretch")
	}

	// Underperformance Warnings
	if annualizedReturn < 0.0 && daysHeld > 180 {
		tags = append(tags, "underperforming")
	}

	if annualizedReturn < 5.0 && daysHeld > 365 {
		tags = append(tags, "stagnant")
	}

	if maxDrawdown > 30.0 {
		tags = append(tags, "high-drawdown")
	}

	// Portfolio Risk Warnings
	if positionWeight > targetWeight+0.02 || positionWeight > 0.10 {
		tags = append(tags, "overweight")
	}

	if positionWeight > 0.15 {
		tags = append(tags, "concentration-risk")
	}

	// === CHARACTERISTIC TAGS ===

	// Risk Profile
	if volatility < 0.15 && fundamentalsScore > 0.7 && maxDrawdown < 20.0 {
		tags = append(tags, "low-risk")
	}

	if volatility >= 0.15 && volatility <= 0.30 && fundamentalsScore > 0.6 {
		tags = append(tags, "medium-risk")
	}

	if volatility > 0.30 || fundamentalsScore < 0.5 {
		tags = append(tags, "high-risk")
	}

	// Growth Profile
	if cagrScore > 15.0 && fundamentalsScore > 0.7 {
		tags = append(tags, "growth")
	}

	if peVsMarket < 0 && opportunityScore > 0.7 {
		tags = append(tags, "value")
	}

	if dividendYield > 4.0 && dividendScore > 0.7 {
		tags = append(tags, "dividend-focused")
	}

	// Time Horizon
	if longTermScore > 0.75 && consistencyScore > 0.8 {
		tags = append(tags, "long-term")
	}

	if technicalScore > 0.7 && opportunityScore > 0.7 && momentumScore > 0 {
		tags = append(tags, "short-term-opportunity")
	}

	// Remove duplicates
	tags = removeDuplicates(tags)

	ta.log.Debug().
		Str("symbol", input.Symbol).
		Strs("tags", tags).
		Msg("Tags assigned to security")

	return tags, nil
}

// Helper functions

func getScore(scores map[string]float64, key string) float64 {
	if scores == nil {
		return 0.0
	}
	if score, ok := scores[key]; ok {
		return score
	}
	return 0.0
}

func getSubScore(subScores map[string]map[string]float64, group, key string) float64 {
	if subScores == nil {
		return 0.0
	}
	if groupScores, ok := subScores[group]; ok {
		if score, ok := groupScores[key]; ok {
			return score
		}
	}
	return 0.0
}

func calculateBelow52wHighPct(currentPrice, price52wHigh *float64) float64 {
	if currentPrice == nil || price52wHigh == nil || *price52wHigh == 0 {
		return 0.0
	}
	if *currentPrice >= *price52wHigh {
		return 0.0
	}
	return ((*price52wHigh - *currentPrice) / *price52wHigh) * 100.0
}

func removeDuplicates(tags []string) []string {
	seen := make(map[string]bool)
	result := []string{}
	for _, tag := range tags {
		if !seen[tag] {
			seen[tag] = true
			result = append(result, tag)
		}
	}
	return result
}
