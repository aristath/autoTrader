Produce the final long-term structural rating for `{{symbol}}` ({{name}}) based on the analysis below.

Rate the **5-10 year structural outlook** on a 0.0 to 1.0 scale. Disregard current pricing, current valuation, current quarterly performance, and short-term sentiment entirely.

Scale:
- 0.0 - 0.3: structural decline, existential risks, or obsolete business model. The long-term trajectory points down regardless of current results.
- 0.4 - 0.6: average outlook with significant headwinds, intense competition, stagnant secular demand, or eroding moats. Long-term thesis is uncertain.
- 0.7 - 0.8: strong outlook, durable moat, clear long-term growth path, manageable structural risks. Defensible long-term thesis.
- 0.9 - 1.0: dominant structural winner, near-monopoly, essential infrastructure, extreme long-term tailwinds, or state-backed self-sufficiency play with secured demand. Multi-decade compounding visible.

A company with weak current performance but excellent structural prospects (e.g., Huawei) belongs in the 0.7-0.9 range. A company with strong current performance but eroding structural moats belongs in the 0.4-0.6 range. The rating is about TRAJECTORY, not current state.

Analysis to base the rating on:

{{analysis}}

Previous validator result (if this is a retry):

{{validatorFeedback}}

Write a single JSON object to this exact file. Use the `write_file` tool with the JSON object as the file content:

`{{ratingRawPath}}`

The JSON object must contain exactly these three keys and no others:

```
{
  "symbol": "{{symbol}}",
  "rating": 0.0,
  "rationale": "..."
}
```

- `rating` must be a number from 0.0 to 1.0.
- `rationale` must be one string with 2 or 3 paragraphs separated by blank lines. Use the rationale to state the main durable positives, the main structural risks, and why the final rating lands where it does. Do not invent additional keys (`risks`, `bull_case`, `bear_case`, `verdict`, `conclusion`, `limitations`). Put everything inside the single `rationale` string.

If this is a retry, fix the previous candidate using the validator's error and schema feedback above.

After writing, respond with a short confirmation only.
