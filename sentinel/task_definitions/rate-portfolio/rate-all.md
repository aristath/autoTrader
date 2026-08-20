You are assessing these securities for a 5-10 year portfolio allocation. The goal is to decide which securities to buy more of and which to sell. This is a relative comparison — you're deciding where the money should go.

The scale is 0.0 to 1.0 and reflects **structural trajectory over 5-10 years**, not current performance or valuation:
- 0.0 - 0.3: structural decline, existential risks, obsolete business model
- 0.3 - 0.6: average outlook, significant headwinds, eroding moats, uncertain thesis
- 0.6 - 0.9: strong outlook, durable moat, clear growth path, manageable risks
- 0.9 - 1.0: dominant structural winner, near-monopoly, essential infrastructure, multi-decade compounding

A company with weak current results but excellent structural prospects belongs high. A company with strong current results but eroding structural moats belongs lower. The signal is trajectory, not current state.

Below are concise assessments of each security in the portfolio. Each assessment starts with metadata:
- `symbol`: copy this exact value into the JSON `symbol` field.
- `name`: use this to understand which company or security the assessment describes.

Read all assessments, then rate them relative to each other.

{{compiledText}}

Previous validation errors, if any:

{{validationFeedback}}

Write a single JSON object to this exact file. Use the `write_file` tool with the JSON object as the file content:

`{{ratingsRawPath}}`

The JSON object must use this exact shape:

```json
{
  "ratings": [
    {
      "symbol": "SYMBOL",
      "rating": 0.85,
      "rationale": "Brief reason in one sentence."
    }
  ]
}
```

List all {{count}} securities exactly once. Use the exact `symbol` values from the assessment metadata. Ratings must be numbers from 0.0 to 1.0. Be honest about the differences — if two companies are in the same space, the stronger one should rate higher.

If this is a retry, fix the previous candidate using the validator feedback above.

After writing, respond with a short confirmation only.
