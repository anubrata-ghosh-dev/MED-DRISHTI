"""
Red-Flag Rules Engine for Med-Drishti.
Evaluates clinical text and extracted entities against configurable rules to trigger alerts.
"""

import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_RULES_PATH = os.path.join(os.path.dirname(__file__), "red_flags_rules.json")

def load_rules() -> List[Dict[str, Any]]:
    """Load red flag rule definitions."""
    try:
        with open(_RULES_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading red-flag rules: {e}")
        return []


def evaluate_red_flags(text_corpus: str) -> List[Dict[str, Any]]:
    """
    Evaluates text corpus (HPI, chief complaint, OCR text) against red flag rules.
    Returns list of triggered red flag dicts.
    """
    rules = load_rules()
    triggered = []
    text_lower = text_corpus.lower()

    for rule in rules:
        keywords = rule.get("keywords", [])
        for kw in keywords:
            if kw.lower() in text_lower:
                triggered.append({
                    "rule_id": rule.get("rule_id"),
                    "description": f"{rule.get('name')}: {rule.get('description')} (Matched keyword: '{kw}')",
                    "severity": rule.get("severity", "medium")
                })
                break  # Don't duplicate trigger for same rule

    return triggered
