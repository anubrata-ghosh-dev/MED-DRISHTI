import json
import os
from typing import Optional, Tuple

_POLICY_PATH = os.path.join(os.path.dirname(__file__), "dialogue_policy.json")

_TARGETED_QUESTIONS = {
    "cardiac": {
        "field": "hpi.associated_symptoms",
        "text": "With this chest or heart symptom, have you had shortness of breath, sweating, fainting, or pain spreading to your arm or jaw?",
        "text_hi": "सीने या दिल की इस तकलीफ के साथ सांस फूलना, पसीना, बेहोशी, या हाथ/जबड़े तक दर्द हुआ है?",
        "text_bn": "বুক বা হৃদ্‌যন্ত্রের এই সমস্যার সঙ্গে শ্বাসকষ্ট, ঘাম, অজ্ঞান হওয়া, বা হাত/চোয়ালে ব্যথা হয়েছে?",
    },
    "respiratory": {
        "field": "hpi.associated_symptoms",
        "text": "With the cough or breathing problem, have you had fever, chest pain, wheezing, or difficulty speaking in full sentences?",
        "text_hi": "खांसी या सांस की समस्या के साथ बुखार, सीने में दर्द, घरघराहट, या पूरा वाक्य बोलने में कठिनाई हुई है?",
        "text_bn": "কাশি বা শ্বাসের সমস্যার সঙ্গে জ্বর, বুকব্যথা, শোঁ-শোঁ শব্দ, বা পুরো বাক্য বলতে অসুবিধা হয়েছে?",
    },
    "neurologic": {
        "field": "hpi.associated_symptoms",
        "text": "Have you had weakness or numbness on one side, trouble speaking, confusion, or a sudden severe headache?",
        "text_hi": "एक तरफ कमजोरी या सुन्नपन, बोलने में कठिनाई, भ्रम, या अचानक तेज सिरदर्द हुआ है?",
        "text_bn": "এক পাশে দুর্বলতা বা অসাড়তা, কথা বলতে সমস্যা, বিভ্রান্তি, বা হঠাৎ তীব্র মাথাব্যথা হয়েছে?",
    },
    "abdominal": {
        "field": "hpi.associated_symptoms",
        "text": "With the abdominal problem, have you had repeated vomiting, blood in vomit or stool, fever, or severe worsening pain?",
        "text_hi": "पेट की समस्या के साथ बार-बार उल्टी, उल्टी या मल में खून, बुखार, या तेजी से बढ़ता तेज दर्द हुआ है?",
        "text_bn": "পেটের সমস্যার সঙ্গে বারবার বমি, বমি বা পায়খানায় রক্ত, জ্বর, বা দ্রুত বাড়তে থাকা তীব্র ব্যথা হয়েছে?",
    },
    "fever": {
        "field": "hpi.associated_symptoms",
        "text": "Along with the fever, have you had a rash, severe headache, breathing difficulty, confusion, or trouble keeping fluids down?",
        "text_hi": "बुखार के साथ दाने, तेज सिरदर्द, सांस लेने में कठिनाई, भ्रम, या पानी भी न रुकने जैसी समस्या हुई है?",
        "text_bn": "জ্বরের সঙ্গে ফুসকুড়ি, তীব্র মাথাব্যথা, শ্বাসকষ্ট, বিভ্রান্তি, বা পানি ধরে রাখতে অসুবিধা হয়েছে?",
    },
    "general": {
        "field": "hpi.associated_symptoms",
        "text": "What other symptoms came with this, and is anything getting rapidly worse or making you feel unsafe right now?",
        "text_hi": "इसके साथ और क्या लक्षण हैं? क्या कुछ तेजी से बिगड़ रहा है या अभी आपको असुरक्षित महसूस हो रहा है?",
        "text_bn": "এর সঙ্গে আর কী উপসর্গ হয়েছে? কোনো কিছু কি দ্রুত খারাপ হচ্ছে বা এখন আপনি খুব অসুস্থ বোধ করছেন?",
    },
}

_AYURVEDA_QUESTIONS = {
    "ayur_body_type": {
        "id": "ayur_body_type",
        "field": "ayush_history.body_frame",
        "text": "To help us understand your body constitution (Prakriti), how would you describe your natural body frame and weight?",
        "text_hi": "आपके शरीर की प्रकृति को समझने के लिए, आप अपने प्राकृतिक शारीरिक ढांचे और वजन का वर्णन कैसे करेंगे?",
        "text_bn": "আপনার শরীরের প্রকৃতি বুঝতে, আপনার শারীরিক গঠন ও ওজন কেমন তা বলবেন কি?"
    },
    "ayur_digestion": {
        "id": "ayur_digestion",
        "field": "ayush_history.digestion",
        "text": "How is your appetite and digestion normally? Do you often feel bloated, have acidity, or irregular bowel movements?",
        "text_hi": "आपकी भूख और पाचन आमतौर पर कैसा रहता है? क्या आपको अक्सर गैस, एसिडिटी, या अनियमित मल त्याग की समस्या होती है?",
        "text_bn": "আপনার ক্ষুধা ও হজম কেমন? আপনার কি প্রায়ই গ্যাস, অ্যাসিডিটি বা অনিয়মিত মলত্যাগের সমস্যা হয়?"
    },
    "ayur_sleep": {
        "id": "ayur_sleep",
        "field": "ayush_history.sleep",
        "text": "How is your sleep pattern? Do you sleep deeply, or is it light and easily disturbed?",
        "text_hi": "आपकी नींद कैसी है? क्या आपको गहरी नींद आती है, या हल्की नींद आती है और आसानी से टूट जाती है?",
        "text_bn": "আপনার ঘুম কেমন? গভীর ঘুম হয়, নাকি পাতলা ঘুম যা সহজে ভেঙে যায়?"
    }
}

def load_dialogue_policy():
    with open(_POLICY_PATH, encoding="utf-8") as f:
        policy = json.load(f)
    return policy, {q["id"]: q for q in policy["questions"]}


def _target_for_answer(answer: str) -> str:
    value = (answer or "").lower()
    if any(term in value for term in ("chest", "heart", "pressure", "palpitation", "jaw", "arm pain", "सीने", "छाती", "दिल", "বুক", "হৃদয়")):
        return "cardiac"
    if any(term in value for term in ("breath", "cough", "wheez", "asthma", "lung", "सांस", "खांसी", "श्वास", "শ্বাস", "কাশি")):
        return "respiratory"
    if any(term in value for term in ("weakness", "numb", "speech", "speak", "stroke", "headache", "dizz", "सिरदर्द", "चक्कर", "सुन्न", "कमजोर", "মাথাব্যথা", "অসাড়")):
        return "neurologic"
    if any(term in value for term in ("stomach", "abdominal", "abdomen", "belly", "vomit", "diarrhea", "पेट", "उल्टी", "পেট", "বমি")):
        return "abdominal"
    if any(term in value for term in ("fever", "chills", "infection", "बुखार", "জ্বর")):
        return "fever"
    return "general"


def resolve_next_question(
    current_question_id: Optional[str],
    last_answer: Optional[str],
    language: str,
    department: str,
) -> Tuple[Optional[str], Optional[str], Optional[str], bool]:
    policy, question_map = load_dialogue_policy()
    language = (language or "en").lower().split("-")[0]

    if current_question_id is None:
        question = question_map[policy["start_question_id"]]
        return question["id"], question.get(f"text_{language}") or question["text"], question["field"], False

    if current_question_id == "chief_complaint":
        target = _target_for_answer(last_answer or "")
        question_id = f"targeted_{target}"
        question = _TARGETED_QUESTIONS[target]
        return question_id, question.get(f"text_{language}") or question["text"], question["field"], False

    if current_question_id.startswith("targeted_"):
        question = question_map["cc_duration"]
        return question["id"], question.get(f"text_{language}") or question["text"], question["field"], False

    if current_question_id == "cc_duration":
        if department.lower() == "ayurveda":
            q = _AYURVEDA_QUESTIONS["ayur_body_type"]
            return q["id"], q.get(f"text_{language}") or q["text"], q["field"], False
        return None, None, None, True

    if current_question_id == "ayur_body_type":
        q = _AYURVEDA_QUESTIONS["ayur_digestion"]
        return q["id"], q.get(f"text_{language}") or q["text"], q["field"], False

    if current_question_id == "ayur_digestion":
        q = _AYURVEDA_QUESTIONS["ayur_sleep"]
        return q["id"], q.get(f"text_{language}") or q["text"], q["field"], False

    return None, None, None, True
