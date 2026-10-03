import os
from PIL import Image, ImageDraw

print("[ML & Backend Test] Running Med-Drishti Machine Learning OCR & Entity Extraction Engine...")

# Create test directory and image
os.makedirs("ml/synthetic_rxhandbd/images", exist_ok=True)
img_p = "ml/synthetic_rxhandbd/images/rx_test_sample.png"

img = Image.new("RGB", (400, 100), color=(250, 250, 250))
draw = ImageDraw.Draw(img)
draw.text((20, 30), "Rx: Paracetamol 500mg once daily", fill=(10, 10, 10))
img.save(img_p)
print(f"✓ Generated synthetic prescription sample: {img_p}")

from backend.app.ocr import extract_ocr_text, extract_entities_from_text

ocr_result = extract_ocr_text(img_p)
text = ocr_result["text"]
print(f"\n✓ OCR Text Extraction Output:\n---\n{text}\n---")

entities = extract_entities_from_text(text)
print(f"\n✓ Extracted {len(entities)} Medical Entities:")
for i, e in enumerate(entities, 1):
    print(f"   {i}. [{e['entity_type']}] {e['entity_value']} (Confidence: {e['confidence']})")

print("\n✓ Machine Learning OCR Pipeline launch check complete.")
