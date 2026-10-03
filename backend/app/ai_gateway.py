import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class AIProvider(ABC):
    """Abstract Base Class for all AI Service Providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    # Voice Capabilities
    def transcribe(self, audio_bytes: bytes, language_hint: Optional[str] = None) -> Optional[Dict[str, Any]]:
        return None

    def synthesize(self, text: str, lang: str = "en") -> Optional[bytes]:
        return None

    # Translation Capabilities
    def translate(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        return None

    # Document Capabilities
    def extract_text(self, file_path: str) -> Optional[str]:
        return None

    def extract_entities(self, text: str) -> Optional[List[Dict[str, Any]]]:
        return None

    # NLP Capabilities
    def summarize(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return None

class AIGateway:
    """
    Orchestrates AI providers and handles graceful failure/fallback.
    The application interacts with this Gateway, not the providers directly.
    """
    def __init__(self):
        self._providers: List[AIProvider] = []

    def register_provider(self, provider: AIProvider):
        self._providers.append(provider)
        logger.info(f"Registered AI Provider: {provider.provider_name}")

    def transcribe(self, audio_bytes: bytes, language_hint: Optional[str] = None) -> Dict[str, Any]:
        for provider in self._providers:
            try:
                result = provider.transcribe(audio_bytes, language_hint)
                if result: return result
            except Exception as e:
                logger.error(f"Provider {provider.provider_name} failed transcription: {e}")
        return {"text": "[Transcription Unavailable]", "language_detected": language_hint or "en", "confidence": 0.0}

    def synthesize(self, text: str, lang: str = "en") -> bytes:
        for provider in self._providers:
            try:
                result = provider.synthesize(text, lang)
                if result: return result
            except Exception as e:
                logger.error(f"Provider {provider.provider_name} failed synthesis: {e}")
        raise RuntimeError("No AI provider available for TTS")

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if source_lang == target_lang:
            return text
        for provider in self._providers:
            try:
                result = provider.translate(text, source_lang, target_lang)
                if result: return result
            except Exception as e:
                logger.error(f"Provider {provider.provider_name} failed translation: {e}")
        return text # Fallback to original text

    def extract_text(self, file_path: str) -> str:
        for provider in self._providers:
            try:
                result = provider.extract_text(file_path)
                if result: return result
            except Exception as e:
                logger.error(f"Provider {provider.provider_name} failed OCR: {e}")
        raise RuntimeError("No OCR provider returned text for the uploaded document")

    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        for provider in self._providers:
            try:
                result = provider.extract_entities(text)
                if result: return result
            except Exception as e:
                logger.error(f"Provider {provider.provider_name} failed entity extraction: {e}")
        return []

    def summarize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for provider in self._providers:
            try:
                result = provider.summarize(data)
                if result: return result
            except Exception as e:
                logger.error(f"Provider {provider.provider_name} failed summarization: {e}")
        return {"summary": "Summary generation unavailable", "confidence": 0.0}

# Global Gateway Instance
gateway = AIGateway()
