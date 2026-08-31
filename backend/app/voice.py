# backend/app/voice.py
"""Voice transcription module using faster-whisper."""

import os
import tempfile
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy-load model to avoid startup penalty
_whisper_model = None

def _get_model():
    """Lazy-load the faster-whisper model (small, multilingual)."""
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            model_size = os.getenv("WHISPER_MODEL_SIZE", "small")
            device = os.getenv("WHISPER_DEVICE", "cpu")
            logger.info(f"Loading Whisper model: {model_size} on {device}")
            _whisper_model = WhisperModel(model_size, device=device, compute_type="int8")
            logger.info("Whisper model loaded successfully")
        except ImportError:
            logger.warning("faster-whisper not installed. Using mock transcription.")
            _whisper_model = None
    return _whisper_model


def transcribe_audio(audio_bytes: bytes, language_hint: Optional[str] = None) -> dict:
    """
    Transcribe audio bytes using faster-whisper.
    
    Args:
        audio_bytes: Raw audio data (webm, wav, mp3)
        language_hint: Optional ISO language code hint (e.g. 'hi', 'en', 'bn')
    
    Returns:
        dict with keys: text, language_detected, confidence
    """
    model = _get_model()
    
    # If model not available, return mock for development
    if model is None:
        return {
            "text": "[Mock transcription - faster-whisper not installed]",
            "language_detected": language_hint or "en",
            "confidence": 0.5,
        }
    
    # Write bytes to temp file
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_path = tmp_file.name
    
    try:
        # Transcribe
        segments, info = model.transcribe(
            tmp_path,
            language=language_hint,
            beam_size=5,
            vad_filter=True,  # Voice activity detection
            vad_parameters=dict(min_silence_duration_ms=500),
        )
        
        # Collect all segments
        full_text = " ".join(seg.text.strip() for seg in segments)
        
        # Compute average confidence from log-probs (approx)
        avg_confidence = max(0.0, min(1.0, (info.language_probability or 0.8)))
        
        return {
            "text": full_text.strip(),
            "language_detected": info.language,
            "confidence": round(avg_confidence, 3),
        }
    finally:
        os.unlink(tmp_path)
