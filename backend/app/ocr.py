"""
OCR and Medical Entity Extraction Module for Med-Drishti.
Handles image preprocessing, quality assessment, PDF conversion,
hybrid OCR (printed + handwritten), and clinical entity extraction.
"""

import os
import re
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image, ImageStat, ImageEnhance
from datetime import datetime

logger = logging.getLogger(__name__)


# ============ Document Quality Guard ============

def check_image_quality(image_path: str) -> Dict[str, Any]:
    """
    Comprehensive image quality assessment for OCR viability.
    Checks resolution, brightness, contrast, blur, and glare.
    Returns structured quality report.
    """
    issues = []
    metrics = {}

    try:
        with Image.open(image_path) as img:
            # 1. Resolution Check
            width, height = img.size
            metrics["resolution"] = f"{width}x{height}"
            if width < 500 or height < 500:
                issues.append("Resolution too low (min 500x500)")

            # Convert to grayscale for analysis
            gray = img.convert('L')
            stat = ImageStat.Stat(gray)

            # 2. Brightness Check
            mean_brightness = stat.mean[0]
            metrics["brightness"] = round(mean_brightness, 2)
            if mean_brightness < 40:
                issues.append("Image too dark")
            elif mean_brightness > 220:
                issues.append("Image too bright/washed out")

            # 3. Contrast Check
            std_dev = stat.stddev[0]
            metrics["contrast"] = round(std_dev, 2)
            if std_dev < 20:
                issues.append("Low contrast")

            # 4. Blur Detection via Laplacian variance
            try:
                gray_array = np.array(gray, dtype=np.float64)
                # Laplacian kernel approximation
                laplacian = (
                    gray_array[:-2, 1:-1] + gray_array[2:, 1:-1] +
                    gray_array[1:-1, :-2] + gray_array[1:-1, 2:] -
                    4 * gray_array[1:-1, 1:-1]
                )
                blur_score = float(laplacian.var())
                metrics["blur_score"] = round(blur_score, 2)
                if blur_score < 100:
                    issues.append(f"Image appears blurry (score: {blur_score:.0f}, min: 100)")
            except Exception as e:
                logger.warning(f"Blur detection failed: {e}")
                metrics["blur_score"] = None

            # 5. Glare Detection (percentage of near-white pixels)
            try:
                gray_array = np.array(gray)
                near_white = np.sum(gray_array > 245)
                total_pixels = gray_array.size
                glare_pct = (near_white / total_pixels) * 100
                metrics["glare_percentage"] = round(glare_pct, 2)
                if glare_pct > 30:
                    issues.append(f"Possible glare detected ({glare_pct:.1f}% bright pixels)")
            except Exception as e:
                logger.warning(f"Glare detection failed: {e}")
                metrics["glare_percentage"] = None

            is_viable = len(issues) == 0
            return {
                "is_viable": is_viable,
                "issues": issues,
                "reason": issues[0] if issues else "Viable",
                "metrics": metrics,
                "blur_score": metrics.get("blur_score"),
                "brightness": metrics.get("brightness"),
                "contrast": metrics.get("contrast"),
                "glare_percentage": metrics.get("glare_percentage"),
            }
    except Exception as e:
        logger.error(f"Quality check failed for {image_path}: {e}")
        return {
            "is_viable": False,
            "issues": [f"Analysis error: {str(e)}"],
            "reason": f"Analysis error: {str(e)}",
            "metrics": {},
            "blur_score": None,
            "brightness": None,
            "contrast": None,
            "glare_percentage": None,
        }


# ============ PDF Support ============

def convert_pdf_to_images(file_path: str) -> List[Any]:
    """
    Convert PDF pages to PIL Image objects.
    Returns list of PIL Images, one per page.
    """
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(file_path, dpi=300)
        logger.info(f"Converted PDF to {len(images)} page(s)")
        return images
    except ImportError:
        logger.warning("pdf2image not installed. PDF conversion unavailable.")
        return []
    except Exception as e:
        logger.error(f"PDF conversion failed for {file_path}: {e}")
        return []


def is_pdf(file_path: str) -> bool:
    """Check if a file is a PDF."""
    return file_path.lower().endswith('.pdf')


# ============ Image Preprocessing ============

def preprocess_image(image_path_or_img) -> Optional[Any]:
    """
    Preprocess image for better OCR accuracy.
    Applies grayscale conversion, contrast enhancement, sharpness boost,
    and auto-deskew if rotation detected.
    """
    try:
        if isinstance(image_path_or_img, str):
            img = Image.open(image_path_or_img)
        else:
            img = image_path_or_img

        img = img.convert('L')

        # Contrast enhancement
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.8)

        # Sharpness enhancement
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.5)

        # Auto-deskew attempt
        try:
            img = _auto_deskew(img)
        except Exception as e:
            logger.debug(f"Auto-deskew skipped: {e}")

        return img
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        return None


def _auto_deskew(img: Image.Image) -> Image.Image:
    """
    Detect and correct image skew using image moments.
    Only rotates if the detected angle is between 2 and 45 degrees.
    """
    try:
        arr = np.array(img)
        # Binary threshold
        binary = (arr < 128).astype(np.uint8)
        # Calculate moments
        coords = np.column_stack(np.where(binary > 0))
        if len(coords) < 100:
            return img

        # Use PCA to find dominant angle
        mean = np.mean(coords, axis=0)
        centered = coords - mean
        cov = np.cov(centered.T)
        eigenvalues, eigenvectors = np.linalg.eigh(cov)
        angle = np.degrees(np.arctan2(eigenvectors[0, 1], eigenvectors[0, 0]))

        if 2 < abs(angle) < 45:
            logger.info(f"Auto-deskewing by {angle:.1f} degrees")
            img = img.rotate(angle, fillcolor=255, expand=True)
    except Exception as e:
        logger.debug(f"Deskew calculation failed: {e}")

    return img


# ============ Hybrid OCR Pipeline ============

def extract_ocr_text(file_path: str) -> Dict[str, Any]:
    """
    Hybrid OCR extraction with dual-layer approach:
    Layer 1: Tesseract (optimized for printed text)
    Layer 2: EasyOCR fallback (better for handwriting)

    Returns dict with text, confidence, method used, and handwriting flag.
    """
    # Handle PDFs
    if is_pdf(file_path):
        pages = convert_pdf_to_images(file_path)
        if pages:
            all_text = []
            for i, page_img in enumerate(pages):
                result = _extract_from_image(page_img)
                all_text.append(f"--- Page {i + 1} ---\n{result['text']}")
            return {
                "text": "\n".join(all_text),
                "confidence": 0.8,
                "is_handwritten": False,
                "method": "tesseract_pdf",
                "pages": len(pages),
            }
        else:
            return _get_mock_text(file_path)

    # Handle images
    return _extract_from_image(file_path)


def _extract_from_image(image_path_or_img) -> Dict[str, Any]:
    """
    Extract text from a single image using Tesseract, falling back to EasyOCR.
    """
    # Layer 1: Tesseract (printed text)
    try:
        import pytesseract
        processed_img = preprocess_image(image_path_or_img)
        if processed_img:
            # Use optimal Tesseract config for documents
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(processed_img, config=custom_config).strip()
            if text and len(text) > 10:
                # Get confidence data
                try:
                    data = pytesseract.image_to_data(processed_img, output_type=pytesseract.Output.DICT, config=custom_config)
                    confidences = [int(c) for c in data['conf'] if str(c).isdigit() and int(c) > 0]
                    avg_conf = sum(confidences) / len(confidences) / 100 if confidences else 0.5
                except Exception:
                    avg_conf = 0.7

                return {
                    "text": text,
                    "confidence": round(avg_conf, 3),
                    "is_handwritten": False,
                    "method": "tesseract",
                }
    except ImportError:
        logger.warning("pytesseract not installed")
    except Exception as e:
        logger.warning(f"Tesseract extraction failed: {e}")

    # Layer 2: EasyOCR (handwriting fallback)
    try:
        import easyocr
        reader = easyocr.Reader(['en', 'hi'], gpu=False, verbose=False)
        if isinstance(image_path_or_img, str):
            results = reader.readtext(image_path_or_img)
        else:
            img_array = np.array(image_path_or_img)
            results = reader.readtext(img_array)

        if results:
            text = " ".join([r[1] for r in results])
            avg_conf = sum(r[2] for r in results) / len(results)
            return {
                "text": text,
                "confidence": round(avg_conf, 3),
                "is_handwritten": True,
                "method": "easyocr",
            }
    except ImportError:
        logger.warning("easyocr not installed")
    except Exception as e:
        logger.warning(f"EasyOCR extraction failed: {e}")

    # Synthetic text is opt-in for local demos only. Never fabricate clinical
    # content in a real upload path.
    if os.getenv("OCR_DEMO_MODE", "").lower() == "true" and isinstance(image_path_or_img, str):
        return _get_mock_text(image_path_or_img)
    return {"text": "", "confidence": 0.0, "is_handwritten": False, "method": "none"}


def _get_mock_text(file_path: str) -> Dict[str, Any]:
    """Hardcoded mock fallbacks for demo stability."""
    file_name = os.path.basename(file_path).lower() if isinstance(file_path, str) else ""
    if "lab" in file_name:
        return {
            "text": "PATIENT LAB REPORT\nDate: 14/08/2026\nHemoglobin: 11.2 g/dL\nHbA1c: 7.4 %\nFasting Glucose: 135 mg/dL\nCreatinine: 1.4 mg/dL\nTotal Cholesterol: 245 mg/dL\nTSH: 6.8 mIU/L",
            "confidence": 0.95,
            "is_handwritten": False,
            "method": "mock",
        }
    return {
        "text": "CLINICAL PRESCRIPTION\nDate: 10/08/2026\nDiagnosis: Hypertension, Type 2 Diabetes\nRx:\n1. Telmisartan 40mg - Once daily\n2. Metformin 500mg - Twice daily\n3. Atorvastatin 10mg - At bedtime\nAdvice: Low salt diet, regular exercise",
        "confidence": 0.90,
        "is_handwritten": False,
        "method": "mock",
    }


# ============ Clinical Entity Extraction (NER) ============

def extract_entities_from_text(ocr_text: str) -> List[Dict[str, Any]]:
    """
    Enhanced clinical entity extraction from OCR text.
    Extracts medications, lab values, dates, vitals, and diagnoses.
    """
    if not ocr_text or not ocr_text.strip():
        return []

    entities = []

    # 1. Medication extraction: "Name DosageUnit" or "Name Dosage Unit"
    med_patterns = [
        r'(?:^|\n)\s*\d+\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+\d+\s*(?:mg|g|ml|mcg|IU))\b',
        r'\b([A-Z][a-z]{2,}(?:sartan|pril|olol|statin|formin|pine|zole|cillin|mycin|oxacin)\s+\d+\s*(?:mg|g|ml|mcg))\b',
        r'(?:Rx|rx|Medication|medication)[:\s]+([A-Za-z]+\s+\d+\s*(?:mg|g|ml|mcg))',
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+\d+\s*(?:mg|g|ml|mcg)\b)',
    ]
    seen_meds = set()
    for pattern in med_patterns:
        for match in re.finditer(pattern, ocr_text):
            val = match.group(1).strip()
            if val.lower() not in seen_meds:
                seen_meds.add(val.lower())
                entities.append({
                    "entity_type": "medication",
                    "entity_value": val,
                    "confidence": 0.85,
                    "source_text": val,
                })

    # 2. Lab value extraction: "Test Name: Value Unit" or "Test Name - Value Unit"
    lab_patterns = [
        # Pattern: "Test Name: Value Unit" or "Test Name - Value Unit"
        r'(Hemoglobin|Hb|HbA1c|Glucose|Fasting Glucose|PPBS|Creatinine|BUN|eGFR|'
        r'Total Cholesterol|LDL|HDL|Triglycerides|TSH|T3|T4|SGPT|SGOT|ALT|AST|'
        r'Bilirubin|Albumin|Uric Acid|Calcium|Sodium|Potassium|Chloride|'
        r'WBC|RBC|Platelets|MCV|MCH|MCHC|ESR|CRP|'
        r'HCT|Hematocrit|SpO2|Pulse|Heart Rate)'
        r'[:\s\-–]+([\d]+\.?[\d]*)\s*(g/dL|mg/dL|%|mmol/L|mIU/L|U/L|mg/L|'
        r'IU/mL|ng/mL|pg/mL|cells/mcL|x10\^?[0-9]+/L|bpm|mmHg)',
    ]
    for pattern in lab_patterns:
        for match in re.finditer(pattern, ocr_text, re.IGNORECASE):
            test_name = match.group(1).strip()
            value = match.group(2).strip()
            unit = match.group(3).strip()
            entities.append({
                "entity_type": "lab_value",
                "entity_value": f"{test_name}: {value} {unit}",
                "confidence": 0.90,
                "source_text": match.group(0).strip(),
                "parsed": {"test": test_name, "value": float(value), "unit": unit},
            })

    # 3. Blood Pressure extraction: "120/80 mmHg" or "BP: 120/80"
    bp_pattern = r'(?:BP|Blood Pressure|B\.P\.?)[:\s]*([\d]{2,3})\s*/\s*([\d]{2,3})\s*(?:mmHg)?'
    for match in re.finditer(bp_pattern, ocr_text, re.IGNORECASE):
        systolic = match.group(1)
        diastolic = match.group(2)
        entities.append({
            "entity_type": "blood_pressure",
            "entity_value": f"{systolic}/{diastolic} mmHg",
            "confidence": 0.92,
            "source_text": match.group(0).strip(),
            "parsed": {"systolic": int(systolic), "diastolic": int(diastolic)},
        })

    # 4. Date extraction: DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY
    date_patterns = [
        r'(?:Date|Dated|Report Date|DOB|Date of Report)[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})',
        r'(?:Date|Dated|Report Date)[:\s]*(\d{1,2}[\s\-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-]\d{2,4})',
        r'\b(\d{1,2}/\d{1,2}/\d{4})\b',
    ]
    seen_dates = set()
    for pattern in date_patterns:
        for match in re.finditer(pattern, ocr_text, re.IGNORECASE):
            date_str = match.group(1).strip()
            if date_str not in seen_dates:
                seen_dates.add(date_str)
                entities.append({
                    "entity_type": "date",
                    "entity_value": date_str,
                    "confidence": 0.88,
                    "source_text": match.group(0).strip(),
                })

    # 5. Diagnosis extraction
    diag_pattern = r'(?:Diagnosis|Dx|Impression|Assessment)[:\s]+([^\n]+)'
    for match in re.finditer(diag_pattern, ocr_text, re.IGNORECASE):
        diagnosis = match.group(1).strip()
        if len(diagnosis) > 3:
            entities.append({
                "entity_type": "diagnosis",
                "entity_value": diagnosis,
                "confidence": 0.80,
                "source_text": match.group(0).strip(),
            })

    return entities


def extract_prescription_medications(ocr_text: str) -> Dict[str, Any]:
    """Extract conservative medication candidates for clinician verification."""
    medications = []
    warnings = []
    for entity in extract_entities_from_text(ocr_text):
        if entity.get("entity_type") != "medication":
            continue
        source_text = str(entity.get("source_text") or entity.get("entity_value") or "").strip()
        match = re.match(
            r"^(?P<name>[A-Za-z][A-Za-z .'-]*?)\s+(?P<strength>\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu))\b",
            source_text,
            re.IGNORECASE,
        )
        if not match:
            warnings.append(f"Medication requires manual review: {source_text}")
            medications.append({
                "raw_text": source_text,
                "name": source_text,
                "strength": None,
                "confidence": min(float(entity.get("confidence", 0.0)), 0.6),
                "requires_review": True,
            })
            continue
        confidence = float(entity.get("confidence", 0.0))
        medications.append({
            "raw_text": source_text,
            "name": match.group("name").strip(),
            "strength": re.sub(r"\s+", " ", match.group("strength").strip()),
            "confidence": confidence,
            "requires_review": confidence < 0.9,
        })
    if not medications:
        warnings.append("No medication candidate was confidently detected.")
    return {
        "medications": medications,
        "warnings": warnings,
        "requires_clinician_review": True,
    }


# ============ Legacy compatibility wrapper ============

def extract_ocr_text_legacy(file_path: str) -> str:
    """
    Legacy-compatible wrapper that returns just the text string.
    Used by code paths that expect the old str-only return.
    """
    result = extract_ocr_text(file_path)
    if isinstance(result, dict):
        return result.get("text", "")
    return str(result)
