"""Print one query's source summaries for the findings prompt; emits a placeholder
(not fatal) when none were fetched.
Environment: SOURCE_SUMMARIES_PATH."""

import os
import pathlib

path = pathlib.Path(os.environ["SOURCE_SUMMARIES_PATH"])
content = path.read_text(encoding="utf-8") if path.exists() else ""
if not content.strip():
    # Zero usable sources for this query is not fatal — emit a placeholder
    # so the next step still has something to read, and let the LLM decide
    # whether to search further with its tools.
    content = (
        "(No source summaries available for this query — either the search "
        "returned no usable results or all candidates were filtered out.)\n"
    )
print(content)
