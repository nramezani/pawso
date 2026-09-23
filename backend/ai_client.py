"""Centralized OpenAI client configuration and structured-call helper.

Consolidates what used to be duplicated across ask_router.py (3x) and
main.py: client construction, model selection, timeouts/retries, and
error handling for structured (Responses API) calls.
"""

import os

from openai import APIError, OpenAI

# Model is configurable via env so a deprecated/renamed model doesn't require
# a code change + redeploy. Defaults to a real, currently-published OpenAI
# model rather than a hardcoded placeholder.
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

# Bounds how long we wait on a single OpenAI call and how many times the SDK
# will retry transient failures (5xx/timeouts) before giving up.
REQUEST_TIMEOUT_SECONDS = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "30"))
MAX_RETRIES = int(os.getenv("OPENAI_MAX_RETRIES", "2"))

# Caps the length of a single structured response so one call can't produce
# an unbounded (and unboundedly expensive) amount of output.
MAX_OUTPUT_TOKENS = int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS", "2000"))

# Caps the *combined* size of source text sent as context in a single
# request. Per-field limits alone (see ask_router.AskSource) still allow
# up to 200 sources x 10,000 chars (~2MB); this bounds the aggregate so a
# single request can't legally carry an outsized, expensive context.
MAX_TOTAL_SOURCE_CHARS = int(os.getenv("OPENAI_MAX_TOTAL_SOURCE_CHARS", "30000"))


def get_client() -> OpenAI:
    """Build an OpenAI client with an explicit timeout and bounded retries.

    Raises RuntimeError if OPENAI_API_KEY is not configured, so callers can
    turn that into an HTTP 500 with a safe, generic message.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OpenAI API key is not configured.")

    return OpenAI(
        api_key=api_key,
        timeout=REQUEST_TIMEOUT_SECONDS,
        max_retries=MAX_RETRIES,
    )


def call_structured(client: OpenAI, *, system_prompt: str, user_content, response_model):
    """Call the Responses API for a structured (Pydantic) output.

    Wraps the three near-identical call sites that previously existed in
    ask_router.py so timeout/retry/token-cap configuration lives in one
    place. Raises the underlying exception on failure; callers are
    responsible for translating that into a safe, generic HTTP response
    (see ask_router.py / main.py) so internal error details are never
    leaked to the client.
    """
    response = client.responses.parse(
        model=MODEL,
        max_output_tokens=MAX_OUTPUT_TOKENS,
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        text_format=response_model,
    )
    return response.output_parsed


def total_source_chars(sources) -> int:
    """Sum of source.text length across a list of AskSource-like objects."""
    return sum(len(source.text) for source in sources)


__all__ = [
    "APIError",
    "MODEL",
    "MAX_OUTPUT_TOKENS",
    "MAX_TOTAL_SOURCE_CHARS",
    "REQUEST_TIMEOUT_SECONDS",
    "MAX_RETRIES",
    "get_client",
    "call_structured",
    "total_source_chars",
]
