import json
import os
from typing import Optional, Tuple
from . import schemas

_POLICY_PATH = os.path.join(os.path.dirname(__file__), "dialogue_policy.json")

def load_dialogue_policy():
    with open(_POLICY_PATH, encoding="utf-8") as f:
        policy = json.load(f)
    q_map = {q["id"]: q for q in policy["questions"]}
    return policy, q_map

def resolve_next_question(
    current_question_id: Optional[str],
    last_answer: Optional[str],
    language: str,
    department: str
) -> Tuple[Optional[str], Optional[str], Optional[str], bool]:
    """
    Logic to resolve the next question based on adaptive rules and department branching.
    Returns: (next_id, text, field, is_done)
    """
    policy, question_map = load_dialogue_policy()

    if current_question_id is None:
        next_id = policy["start_question_id"]
    else:
        current_q = question_map.get(current_question_id)
        if not current_q:
            return None, None, None, True

        # 1. Handle Adaptive Branching based on the last answer
        if last_answer and "adaptive_next" in current_q:
            last_ans_lower = last_answer.lower()
            rules = policy.get("adaptive_rules", {}).get(current_question_id, {})
            for branch_id, keywords in rules.items():
                if any(kw in last_ans_lower for kw in keywords):
                    next_id = current_q["adaptive_next"].get(branch_id)
                    if next_id: break
            else:
                next_id = current_q.get("next")
        else:
            next_id = current_q.get("next")

    # 2. Resolve Internal Nodes (Departmental Branching)
    while next_id:
        next_q = question_map.get(next_id)
        if not next_q: break
        if not next_q.get("is_internal"):
            break

        branching = next_q.get("branching", {})
        next_id = branching.get(department, next_q.get("next"))

    if not next_id:
        return None, None, None, True

    final_q = question_map.get(next_id)
    if not final_q:
        return None, None, None, True

    # 3. Language Selection & Translation
    text_key = f"text_{language}"
    question_text = final_q.get(text_key) or final_q["text"]

    # Note: translation via gateway is handled in the API layer

    return next_id, question_text, final_q.get("field"), False
