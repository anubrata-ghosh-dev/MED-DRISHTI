# Bhashini Integration Guide — Med-Drishti

**Standard:** Digital India Bhashini (National Language Translation Mission - NLTM)
**API Architecture:** ULCA / Dhruva Pipeline v2 REST Interface
**Status:** Adapter-Ready Blueprint (Pending Government API Keys)

---

## 1. Overview

Bhashini is the Government of India's AI-led language translation platform, enabling public digital services in all 22 scheduled Indian languages.

Med-Drishti's `AIGateway` is architected to seamlessly prioritize Bhashini services for:
1. **Automated Speech Recognition (ASR):** High-accuracy transcription of regional Indian dialects spoken by patients.
2. **Neural Machine Translation (NMT):** Real-time bi-directional translation between local languages and English/Hindi.
3. **Text-to-Speech (TTS):** Natural regional voice synthesis for kiosk prompts.

Because official Bhashini API keys require institutional verification from the Ministry of Electronics and Information Technology (MeitY) or Ministry of Ayush, Med-Drishti operates locally with `LocalVoiceProvider` and browser Web Speech until keys are supplied.

---

## 2. Required Environment Variables

When credentials are issued, populate the following variables in `backend/.env`:

```bash
# Bhashini Credentials
BHASHINI_API_KEY=your_bhashini_api_key_here
BHASHINI_USER_ID=your_bhashini_user_id_here
BHASHINI_PIPELINE_ID=64392f96daac500b55c543d5
BHASHINI_INFERENCE_URL=https://dhruva-api.bhashini.gov.in/services/inference/pipeline
```

---

## 3. Supported Language Codes

Bhashini uses ISO 639-1 language codes mapped to Indian languages:

| Code | Language | Native Name | Script | ASR | NMT | TTS |
|---|---|---|---|---|---|---|
| `hi` | Hindi | हिन्दी | Devanagari | Yes | Yes | Yes |
| `bn` | Bengali | বাংলা | Bengali | Yes | Yes | Yes |
| `ta` | Tamil | தமிழ் | Tamil | Yes | Yes | Yes |
| `te` | Telugu | తెలుగు | Telugu | Yes | Yes | Yes |
| `mr` | Marathi | मराठी | Devanagari | Yes | Yes | Yes |
| `gu` | Gujarati | ગુજરાતી | Gujarati | Yes | Yes | Yes |
| `kn` | Kannada | ಕನ್ನಡ | Kannada | Yes | Yes | Yes |
| `ml` | Malayalam | മലയാളം | Malayalam | Yes | Yes | Yes |
| `pa` | Punjabi | ਪੰਜਾਬੀ | Gurmukhi | Yes | Yes | Yes |
| `or` | Odia | ଓଡ଼ିଆ | Odia | Yes | Yes | Yes |
| `as` | Assamese | অসমীয়া | Bengali-Assamese | Yes | Yes | Yes |
| `ur` | Urdu | اُردُو | Perso-Arabic | Yes | Yes | Yes |
| `en` | English | English | Latin | Yes | Yes | Yes |

---

## 4. `BhashiniProvider` Implementation

To connect Bhashini, create `backend/app/bhashini_provider.py` implementing `AIProvider`:

```python
import os
import base64
import requests
import logging
from typing import Dict, Any, Optional
from .ai_gateway import AIProvider

logger = logging.getLogger(__name__)

class BhashiniProvider(AIProvider):
    """
    Production adapter for Bhashini Dhruva / ULCA Pipeline APIs.
    """
    def __init__(self):
        self.api_key = os.getenv("BHASHINI_API_KEY")
        self.user_id = os.getenv("BHASHINI_USER_ID")
        self.pipeline_id = os.getenv("BHASHINI_PIPELINE_ID")
        self.inference_url = os.getenv(
            "BHASHINI_INFERENCE_URL",
            "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
        )

    @property
    def provider_name(self) -> str:
        return "BhashiniProvider"

    def _headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": self.api_key,
            "userID": self.user_id
        }

    def transcribe(self, audio_bytes: bytes, language_hint: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Invokes Bhashini ASR pipeline with base64 audio payload."""
        if not self.api_key:
            return None

        lang = language_hint or "hi"
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "asr",
                    "config": {
                        "language": {"sourceLanguage": lang},
                        "audioFormat": "wav",
                        "samplingRate": 16000
                    }
                }
            ],
            "inputData": {
                "audio": [{"audioContent": audio_b64}]
            }
        }

        try:
            res = requests.post(self.inference_url, json=payload, headers=self._headers(), timeout=10)
            if res.status_code == 200:
                data = res.json()
                source_text = data["pipelineResponse"][0]["output"][0]["source"]
                return {
                    "text": source_text,
                    "language_detected": lang,
                    "confidence": 0.95
                }
        except Exception as e:
            logger.error(f"Bhashini ASR failed: {e}")
        return None

    def translate(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """Invokes Bhashini NMT pipeline."""
        if not self.api_key or source_lang == target_lang:
            return None

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "translation",
                    "config": {
                        "language": {
                            "sourceLanguage": source_lang,
                            "targetLanguage": target_lang
                        }
                    }
                }
            ],
            "inputData": {
                "input": [{"source": text}]
            }
        }

        try:
            res = requests.post(self.inference_url, json=payload, headers=self._headers(), timeout=5)
            if res.status_code == 200:
                data = res.json()
                return data["pipelineResponse"][0]["output"][0]["target"]
        except Exception as e:
            logger.error(f"Bhashini Translation failed: {e}")
        return None

    def synthesize(self, text: str, lang: str = "en") -> Optional[bytes]:
        """Invokes Bhashini TTS pipeline and returns raw MP3/WAV bytes."""
        if not self.api_key:
            return None

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": {
                        "language": {"sourceLanguage": lang},
                        "gender": "female"
                    }
                }
            ],
            "inputData": {
                "input": [{"source": text}]
            }
        }

        try:
            res = requests.post(self.inference_url, json=payload, headers=self._headers(), timeout=10)
            if res.status_code == 200:
                data = res.json()
                audio_b64 = data["pipelineResponse"][0]["audio"][0]["audioContent"]
                return base64.b64decode(audio_b64)
        except Exception as e:
            logger.error(f"Bhashini TTS failed: {e}")
        return None
```

---

## 5. Registering in the AI Gateway

To prioritize Bhashini as the primary provider before local fallbacks, update the gateway initialization in `backend/app/main.py`:

```python
import os
from .ai_gateway import gateway
from .ai_providers import LocalVoiceProvider, LocalOCRProvider, LocalSummaryProvider, MockAIProvider

# If credentials are configured, register Bhashini FIRST
if os.getenv("BHASHINI_API_KEY"):
    from .bhashini_provider import BhashiniProvider
    gateway.register_provider(BhashiniProvider())

# Local providers act as immediate fallback
gateway.register_provider(LocalVoiceProvider())
gateway.register_provider(LocalOCRProvider())
gateway.register_provider(LocalSummaryProvider())
gateway.register_provider(MockAIProvider())
```

---

## 6. Testing & Validation

Once configured, verify the Bhashini connection using the AI Gateway test endpoint:

```bash
# Test translation from English to Hindi
curl -X POST http://localhost:8000/api/v1/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Patient reports fever and severe cough",
    "source_language": "en",
    "target_language": "hi"
  }'
```

Expected Response:
```json
{
  "original_text": "Patient reports fever and severe cough",
  "translated_text": "रोगी बुखार और गंभीर खांसी की शिकायत करता है",
  "source_language": "en",
  "target_language": "hi"
}
```
