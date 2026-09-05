"""
Shared utilities for the AI service layer.
"""

import json
import re
import logging

logger = logging.getLogger(__name__)


def repair_json(s: str) -> str:
    """
    Attempts to repair common LLM JSON syntax errors:
    - Code fences
    - JavaScript-style comments (// and /* */)
    - Trailing commas before } or ]
    - Missing commas between properties or array elements on separate lines
    - Duplicate commas
    """
    # 1. Strip markdown code fences if present
    fence_pattern = re.compile(r"```(?:json)?\s*\n?(.*?)\n?\s*```", re.DOTALL)
    match = fence_pattern.search(s)
    if match:
        s = match.group(1).strip()

    # 2. Extract outer JSON bounds ({...} or [...])
    brace_start = s.find("{")
    brace_end = s.rfind("}")
    bracket_start = s.find("[")
    bracket_end = s.rfind("]")

    if brace_start != -1 and (bracket_start == -1 or brace_start < bracket_start):
        if brace_end > brace_start:
            s = s[brace_start : brace_end + 1]
    elif bracket_start != -1 and bracket_end > bracket_start:
        s = s[bracket_start : bracket_end + 1]

    # 3. Strip single-line (//) and multi-line (/* */) comments
    s = re.sub(r'//.*?$', '', s, flags=re.MULTILINE)
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.DOTALL)

    # 4. Strip trailing commas before } or ]
    s = re.sub(r',\s*([}\]])', r'\1', s)

    # 5. Fix missing commas between key-value pairs or list items:
    # Value (digit, string, boolean, null, }, ]) followed by newline and next key ("...") or ({ / [)
    s = re.sub(r'(?<=[0-9"truefalsenull\]}])\s*\n\s*(?=")', ',\n', s)
    s = re.sub(r'(?<=[0-9"truefalsenull\]}])\s*\n\s*(?=[{\[])', ',\n', s)

    # 6. Clean up any duplicate commas
    s = re.sub(r',\s*,+', ',', s)

    # 7. Re-strip trailing commas that might have been introduced
    s = re.sub(r',\s*([}\]])', r'\1', s)

    return s


def extract_json(raw: str) -> dict:
    """
    Safely extract a JSON object from an LLM response.

    Handles clean JSON, markdown code fences, unescaped characters,
    missing commas, and trailing commas.
    """
    text = raw.strip()

    # 1. Direct parse
    try:
        return json.loads(text, strict=False)
    except Exception:
        pass

    # 2. Fences parse
    fence_pattern = re.compile(r"```(?:json)?\s*\n?(.*?)\n?\s*```", re.DOTALL)
    match = fence_pattern.search(text)
    if match:
        try:
            return json.loads(match.group(1).strip(), strict=False)
        except Exception:
            pass

    # 3. Outer brace parse
    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end > brace_start:
        candidate = text[brace_start : brace_end + 1]
        try:
            return json.loads(candidate, strict=False)
        except Exception:
            pass

    # 4. Repaired parse
    repaired = repair_json(text)
    try:
        return json.loads(repaired, strict=False)
    except Exception:
        pass

    # 5. Single-quote keys fix
    repaired_single = re.sub(r"(?<=[{,\s])'([a-zA-Z0-9_]+)'\s*:", r'"\1":', repaired)
    try:
        return json.loads(repaired_single, strict=False)
    except Exception as e:
        logger.error("Failed to parse JSON from LLM response. Raw output:\n%s", raw)
        raise e
