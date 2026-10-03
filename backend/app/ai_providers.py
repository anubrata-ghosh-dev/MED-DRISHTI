import base64
import io
import logging
import os
import requests
from typing import List, Dict, Any, Optional
from .ai_gateway import AIProvider
from . import voice as voice_module
from . import ocr as ocr_module
from . import summary as summary_module

logger = logging.getLogger(__name__)


LANGUAGE_CODES = {
    "as": "as-IN", "bn": "bn-IN", "en": "en-IN", "gu": "gu-IN",
    "hi": "hi-IN", "kn": "kn-IN", "ml": "ml-IN", "mr": "mr-IN",
    "ne": "ne-IN", "od": "od-IN", "or": "od-IN", "pa": "pa-IN",
    "ta": "ta-IN", "te": "te-IN", "ur": "ur-IN",
}


def _sarvam_language_code(language: str) -> str:
    """Accept the app's short codes as well as Sarvam BCP-47 language codes."""
    normalized = (language or "en").strip().replace("_", "-")
    if "-" in normalized:
        return normalized
    return LANGUAGE_CODES.get(normalized.lower(), "en-IN")


class SarvamProvider(AIProvider):
    """Sarvam-backed speech and translation provider with no client-side key exposure."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SARVAM_API_KEY", "")
        self._client = None

    @property
    def provider_name(self) -> str:
        return "SarvamProvider"

    def _get_client(self):
        if not self.api_key:
            return None
        if self._client is None:
            from sarvamai import SarvamAI
            self._client = SarvamAI(api_subscription_key=self.api_key, timeout=30.0)
        return self._client

    def transcribe(self, audio_bytes: bytes, language_hint: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not audio_bytes:
            return None
        try:
            client = self._get_client()
            if client is None:
                return None
            audio = io.BytesIO(audio_bytes)
            audio.name = "recording.webm"
            response = client.speech_to_text.transcribe(
                file=audio,
                model="saaras:v4",
                mode="transcribe",
            )
            return {
                "text": response.transcript.strip(),
                "language_detected": response.language_code or language_hint or "en",
                "confidence": 1.0,
            }
        except Exception as exc:
            logger.warning("Sarvam transcription failed; using fallback: %s", exc)
            return None

    def synthesize(self, text: str, lang: str = "en") -> Optional[bytes]:
        if not text.strip():
            return None
        try:
            client = self._get_client()
            if client is None:
                return None
            response = client.text_to_speech.convert(
                language_code=_sarvam_language_code(lang),
                text=text.strip(),
                model="bulbul:v3",
                speaker=os.getenv("SARVAM_TTS_SPEAKER", "shubh"),
            )
            return base64.b64decode("".join(response.audios))
        except Exception as exc:
            logger.warning("Sarvam speech synthesis failed; using fallback: %s", exc)
            return None

    def translate(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        if not text.strip():
            return text
        try:
            client = self._get_client()
            if client is None:
                return None
            response = client.text.translate(
                input=text,
                source_language_code="auto" if source_lang.lower() == "auto" else _sarvam_language_code(source_lang),
                target_language_code=_sarvam_language_code(target_lang),
            )
            return response.translated_text
        except Exception as exc:
            logger.warning("Sarvam translation failed; using fallback: %s", exc)
            return None

class GoogleVisionProvider(AIProvider):
    """Google Cloud Vision API provider via REST for high-accuracy OCR."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY", "")

    @property
    def provider_name(self) -> str:
        return "GoogleVisionProvider"

    def extract_text(self, file_path: str) -> Optional[str]:
        if not self.api_key:
            return None
        try:
            with open(file_path, "rb") as image_file:
                content = base64.b64encode(image_file.read()).decode("utf-8")

            url = f"https://vision.googleapis.com/v1/images:annotate?key={self.api_key}"
            payload = {
                "requests": [{
                    "image": {"content": content},
                    "features": [{"type": "TEXT_DETECTION"}]
                }]
            }

            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()

            full_text = data["responses"][0].get("fullTextAnnotation", {}).get("text", "")
            return full_text.strip() or None
        except Exception as e:
            logger.warning("Google Vision OCR failed: %s", e)
            return None

    def extract_entities(self, text: str) -> Optional[List[Dict[str, Any]]]:
        # Entity extraction is handled by LLM in AIGateway's summarize or a dedicated NER call.
        # We can use Vision's OCR blocks but LLM is better for medical concepts.
        return None

class LocalVoiceProvider(AIProvider):
    """Implementation of voice services using local faster-whisper and gTTS."""

    @property
    def provider_name(self) -> str:
        return "LocalVoiceProvider"

    def transcribe(self, audio_bytes: bytes, language_hint: Optional[str] = None) -> Optional[Dict[str, Any]]:
        try:
            return voice_module.transcribe_audio(audio_bytes, language_hint=language_hint)
        except Exception as e:
            logger.error(f"LocalVoiceProvider transcription failed: {e}")
            return None

    def synthesize(self, text: str, lang: str = "en") -> Optional[bytes]:
        try:
            from gtts import gTTS
            import io
            tts = gTTS(text=text, lang=lang)
            mp3_fp = io.BytesIO()
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)
            return mp3_fp.getvalue()
        except Exception as e:
            logger.error(f"LocalVoiceProvider synthesis failed: {e}")
            return None

class LocalOCRProvider(AIProvider):
    """Implementation of OCR services using Tesseract/TrOCR."""

    @property
    def provider_name(self) -> str:
        return "LocalOCRProvider"

    def extract_text(self, file_path: str) -> Optional[str]:
        try:
            return ocr_module.extract_ocr_text_legacy(file_path)
        except Exception as e:
            logger.error(f"LocalOCRProvider text extraction failed: {e}")
            return None

    def extract_entities(self, text: str) -> Optional[List[Dict[str, Any]]]:
        try:
            return ocr_module.extract_entities_from_text(text)
        except Exception as e:
            logger.error(f"LocalOCRProvider entity extraction failed: {e}")
            return None

class LocalSummaryProvider(AIProvider):
    """Implementation of summary services using internal logic."""

    @property
    def provider_name(self) -> str:
        return "LocalSummaryProvider"

    def summarize(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            return summary_module.generate_clinical_summary(
                patient=data.get("patient"),
                history=data.get("history"),
                documents=data.get("documents"),
                red_flags=data.get("red_flags")
            )
        except Exception as e:
            logger.error(f"LocalSummaryProvider summarization failed: {e}")
            return None

class MockAIProvider(AIProvider):
    """Pure mock provider for development and fallback testing."""

    @property
    def provider_name(self) -> str:
        return "MockAIProvider"

    def transcribe(self, audio_bytes: bytes, language_hint: Optional[str] = None) -> Optional[Dict[str, Any]]:
        return {"text": "[Mock Transcription]", "language_detected": language_hint or "en", "confidence": 0.5}

    def synthesize(self, text: str, lang: str = "en") -> Optional[bytes]:
        return b"MOCK_AUDIO_DATA"

    def translate(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        return f"[Mock Translated {target_lang}]: {text}"

    def extract_text(self, file_path: str) -> Optional[str]:
        return "[Mock OCR Text]"

    def extract_entities(self, text: str) -> Optional[List[Dict[str, Any]]]:
        return [{"entity_type": "medication", "entity_value": "MockMed 10mg", "confidence": 0.5, "source_text": "MockMed 10mg"}]

    def summarize(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return {"summary": "This is a mock summary of the clinical case.", "confidence": 0.1}
