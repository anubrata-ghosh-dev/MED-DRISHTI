"""
Red-Flag Rules Engine for Med-Drishti.
Evaluates clinical text against configurable rules with composite matching
and negation detection to trigger triage alerts.
"""

import os
import json
import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_RULES_PATH = os.path.join(os.path.dirname(__file__), "red_flags_rules.json")
_cached_rules: List[Dict[str, Any]] = []

# Negation window: if any negation word appears within 5 words before the keyword,
# the match is considered negated.
NEGATION_WORDS = {"no", "not", "none", "denies", "denied", "without", "absent",
                  "negative", "never", "neither", "nor", "doesn't", "don't",
                  "didn't", "hasn't", "haven't", "isn't", "wasn't", "weren't",
                  "won't", "wouldn't", "couldn't", "shouldn't"}
NEGATION_WINDOW = 5  # words


def load_rules() -> List[Dict[str, Any]]:
    """Load and cache red flag rule definitions."""
    global _cached_rules
    if _cached_rules:
        return _cached_rules
    try:
        with open(_RULES_PATH, 'r') as f:
            _cached_rules = json.load(f)
        logger.info(f"Loaded {len(_cached_rules)} red flag rules")
        return _cached_rules
    except Exception as e:
        logger.error(f"Error loading red-flag rules: {e}")
        return []


def _is_negated(text_lower: str, keyword: str) -> bool:
    """
    Check if a keyword match is negated by a preceding negation word.
    Looks within NEGATION_WINDOW words before the keyword.
    """
    idx = text_lower.find(keyword.lower())
    if idx == -1:
        return False

    # Extract words preceding the keyword
    preceding_text = text_lower[:idx]
    preceding_words = preceding_text.split()
    window = preceding_words[-NEGATION_WINDOW:] if len(preceding_words) >= NEGATION_WINDOW else preceding_words

    return any(word.strip('.,;:!?') in NEGATION_WORDS for word in window)


def evaluate_red_flags(text_corpus: str) -> List[Dict[str, Any]]:
    """
    Evaluates text corpus against red flag rules with support for:
    - match_mode: "ANY" (default) - any keyword triggers the rule
    - match_mode: "ALL" - all keywords must be present to trigger
    - Negation detection: skips matches preceded by negation words

    Returns list of triggered red flag dicts.
    """
    if not text_corpus:
        return []

    rules = load_rules()
    triggered = []
    text_lower = text_corpus.lower()

    for rule in rules:
        keywords = rule.get("keywords", [])
        match_mode = rule.get("match_mode", "ANY").upper()

        if match_mode == "ALL":
            # All keywords must be present and not negated
            matched_keywords = []
            all_matched = True
            for kw in keywords:
                if kw.lower() in text_lower and not _is_negated(text_lower, kw):
                    matched_keywords.append(kw)
                else:
                    all_matched = False
                    break
            if all_matched and matched_keywords:
                triggered.append({
                    "rule_id": rule.get("rule_id"),
                    "description": f"{rule.get('name')}: {rule.get('description')} (All keywords matched: {', '.join(matched_keywords)})",
                    "severity": rule.get("severity", "medium")
                })
        else:
            # ANY mode: first non-negated keyword match triggers
            for kw in keywords:
                if kw.lower() in text_lower and not _is_negated(text_lower, kw):
                    triggered.append({
                        "rule_id": rule.get("rule_id"),
                        "description": f"{rule.get('name')}: {rule.get('description')} (Matched keyword: '{kw}')",
                        "severity": rule.get("severity", "medium")
                    })
                    break  # Don't duplicate trigger for same rule

    return triggered
