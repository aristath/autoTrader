"""Shared error types for the AI research pipeline."""


class AIPipelineError(Exception):
    """Base error for the AI research pipeline."""


class LLMError(AIPipelineError):
    """Raised when an LLM request or the tool loop fails."""


class MemoryStoreError(AIPipelineError):
    """Raised when the pgvector memory store fails.

    Named to avoid shadowing the builtin ``MemoryError``.
    """
