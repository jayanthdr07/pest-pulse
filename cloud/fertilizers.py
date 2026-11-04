"""
Fertilizer and Plant Nutrient Knowledge Base.

Important Agricultural Distinction:
- Fertilizers provide essential plant nutrients (N, P, K, Ca, Mg, S, micronutrients) to support vigorous crop growth and immunity.
- Pesticides control specific pests, insects, or fungal pathogens.
- Never substitute fertilizers for pest control or vice versa.

All doses are derived from published ICAR-IIHR (Indian Institute of Horticultural Research, Bengaluru)
and state agricultural university package of practices for horticultural crops.
"""

ICAR_IIHR_TOMATO = "https://iihr.res.in/package-practices-tomato"
TNAU_TOMATO_NUTRIENT = "https://agritech.tnau.ac.in/horticulture/horti_vegetables_tomato.html"
KAU_VEGETABLE_SPECIAL = "https://celkau.in/crops/vegetables/tomato/fertilizer.php"

# Crop nutrient requirements by stage
CROP_FERTILIZERS = {
    "Tomato": [
        {
            "id": "tom_basal",
            "stage": "Basal Application (Land Preparation)",
            "stage_kn": "ನಾಟಿಗೆ ಮೊದಲು (ಭೂಮಿ ಸಿದ್ಧತೆ)",
            "purpose": "Establish soil organic structure and initial root zone nutrients",
            "purpose_kn": "ಮಣ್ಣಿನ ರಚನೆ ಸುಧಾರಣೆ ಮತ್ತು ಆರಂಭಿಕ ಬೇರು ಬೆಳವಣಿಗೆಗೆ ಪೋಷಕಾಂಶ",
            "items": [
                {
                    "nutrient": "Well-decomposed Farmyard Manure (FYM)",
                    "nutrient_kn": "ಕೊಳೆತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ (FYM)",
                    "category": "Organic manure",
                    "rate_per_acre": 10.0,
                    "unit": "tonnes",
                    "method": "Broadcast and incorporate into soil during final ploughing",
                    "method_kn": "ಕೊನೆಯ ಉಳುಮೆಯ ಸಮಯದಲ್ಲಿ ಸಮವಾಗಿ ಹರಡಿ ಮಣ್ಣಿಗೆ ಸೇರಿಸಿ",
                    "precautions": "Ensure manure is completely decomposed to avoid soil-borne larvae and weeds.",
                    "source": ICAR_IIHR_TOMATO,
                },
                {
                    "nutrient": "Single Super Phosphate (SSP 16% P2O5)",
                    "nutrient_kn": "ಸಿಂಗಲ್ ಸೂಪರ್ ಫಾಸ್ಫೇಟ್ (SSP)",
                    "category": "Phosphatic fertilizer",
                    "rate_per_acre": 150.0,
                    "unit": "kg",
                    "method": "Apply in furrows or broad bands before transplanting",
                    "method_kn": "ನಾಟಿಗೆ ಮುಂಚೆ ಸಾಲುಗಳಲ್ಲಿ ಹಾಕಿ",
                    "precautions": "Do not mix directly with water-soluble nitrogen fertilizers.",
                    "source": ICAR_IIHR_TOMATO,
                },
                {
                    "nutrient": "Muriate of Potash (MOP 60% K2O)",
                    "nutrient_kn": "ಮ್ಯೂರಿಯೇಟ್ ಆಫ್ ಪೊಟ್ಯಾಶ್ (MOP)",
                    "category": "Potash fertilizer",
                    "rate_per_acre": 35.0,
                    "unit": "kg",
                    "method": "Apply basal band 5 cm below seedling level",
                    "method_kn": "ಸಸಿಗಳ ಬೇರಿನ ಮಟ್ಟಕ್ಕಿಂತ 5 ಸೆಂ.ಮೀ ಕೆಳಗೆ ಸಾಲಿನಲ್ಲಿ ಹಾಕಿ",
                    "precautions": "Keep away from direct root contact to avoid salt burn.",
                    "source": ICAR_IIHR_TOMATO,
                },
                {
                    "nutrient": "Neem Cake",
                    "nutrient_kn": "ಬೇವಿನ ಹಿಂಡಿ",
                    "category": "Organic bio-enricher & nematicide",
                    "rate_per_acre": 100.0,
                    "unit": "kg",
                    "method": "Incorporate in plant rows",
                    "method_kn": "ಸಾಲಿನಲ್ಲಿ ಮಣ್ಣಿನೊಂದಿಗೆ ಸೇರಿಸಿ",
                    "precautions": "Helps suppress root-knot nematodes and slow nitrification.",
                    "source": ICAR_IIHR_TOMATO,
                },
            ],
        },
        {
            "id": "tom_veg",
            "stage": "Vegetative Growth (15 to 40 Days After Transplanting)",
            "stage_kn": "ಶಾಖೀಯ ಬೆಳವಣಿಗೆ (ನಾಟಿ ಮಾಡಿದ 15 ರಿಂದ 40 ದಿನಗಳು)",
            "purpose": "Promote vigorous vegetative canopy, sturdy stems, and deep root branching",
            "purpose_kn": "ಗಿಡದ ಕವಲುಗಳು, ಕಾಂಡದ ದಪ್ಪ ಮತ್ತು ಬೇರಿನ ಬೆಳವಣಿಗೆಗೆ ಪೋಷಕಾಂಶ",
            "items": [
                {
                    "nutrient": "Water Soluble NPK 19:19:19",
                    "nutrient_kn": "ನೀರಿನಲ್ಲಿ ಕರಗುವ NPK 19:19:19",
                    "category": "Complete balanced fertigation",
                    "rate_per_acre": 3.0,
                    "unit": "kg/week",
                    "method": "Fertigation via drip or drenching (dilute in 200 L water/acre)",
                    "method_kn": "ಹನಿ ನೀರಾವರಿ ಮೂಲಕ ಅಥವಾ ಬುಡಕ್ಕೆ ಎರೆಯುವುದು (200 ಲೀ ನೀರಿಗೆ ಕರಗಿಸಿ)",
                    "precautions": "Do not apply on dry soil. Irrigate field lightly before fertigation.",
                    "source": ICAR_IIHR_TOMATO,
                },
                {
                    "nutrient": "Magnesium Sulphate (MgSO4)",
                    "nutrient_kn": "ಮೆಗ್ನೀಸಿಯಮ್ ಸಲ್ಫೇಟ್ (MgSO4)",
                    "category": "Secondary macronutrient",
                    "rate_per_acre": 5.0,
                    "unit": "kg/month",
                    "method": "Soil application or drip injection",
                    "method_kn": "ಮಣ್ಣಿಗೆ ಅಥವಾ ಹನಿ ನೀರಾವರಿ ಮೂಲಕ ನೀಡಿ",
                    "precautions": "Prevents interveinal chlorosis in older leaves.",
                    "source": TNAU_TOMATO_NUTRIENT,
                },
            ],
        },
        {
            "id": "tom_flower",
            "stage": "Flowering & Early Fruit Set (40 to 65 Days)",
            "stage_kn": "ಹೂವಾಡುವ ಮತ್ತು ಕಾಯಿ ಕಟ್ಟುವ ಹಂತ (40 ರಿಂದ 65 ದಿನಗಳು)",
            "purpose": "Maximize flower retention, prevent flower drop, and ensure strong pollen viability",
            "purpose_kn": "ಹೂ ಉದುರುವುದು ತಡೆಗಟ್ಟುವುದು ಮತ್ತು ಉತ್ತಮ ಕಾಯಿ ಕಟ್ಟುವುದು",
            "items": [
                {
                    "nutrient": "Mono Ammonium Phosphate (MAP 12:61:00)",
                    "nutrient_kn": "ಮೊನೊ ಅಮೋನಿಯಂ ಫಾಸ್ಫೇಟ್ (12:61:00)",
                    "category": "High phosphorus fertigation",
                    "rate_per_acre": 2.5,
                    "unit": "kg/week",
                    "method": "Fertigation through drip system",
                    "method_kn": "ಹನಿ ನೀರಾವರಿ ಮೂಲಕ ವಾರಕ್ಕೆ ಒಂದು ಬಾರಿ ನೀಡಿ",
                    "precautions": "Promotes profuse flowering and early fruit setting.",
                    "source": ICAR_IIHR_TOMATO,
                },
                {
                    "nutrient": "IIHR Arka Vegetable Special (Micronutrient Formulation)",
                    "nutrient_kn": "ಐ.ಸಿ.ಎ.ಆರ್ ಅರ್ಕಾ ತರಕಾರಿ ಸ್ಪೆಷಲ್ (ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶ)",
                    "category": "Chelated micronutrient foliar spray",
                    "rate_per_acre": 1.0,
                    "unit": "kg",
                    "method": "Foliar spray: 5 g per litre of water (requires 200 L water per acre)",
                    "method_kn": "ಎಲೆಗಳ ಮೇಲೆ ಸಿಂಪಡಣೆ: ಲೀಟರ್ ನೀರಿಗೆ 5 ಗ್ರಾಂ (ಎಕರೆಗೆ 200 ಲೀಟರ್ ನೀರು)",
                    "precautions": "Spray during cool morning or evening hours with shampoo/sticker.",
                    "source": ICAR_IIHR_TOMATO,
                },
                {
                    "nutrient": "Boron (Solubor 20% B)",
                    "nutrient_kn": "ಬೋರಾನ್ (ಸೊಲ್ಯುಬೋರ್ 20%)",
                    "category": "Micronutrient",
                    "rate_per_acre": 0.2,
                    "unit": "kg",
                    "method": "Foliar spray: 1 g per litre of water",
                    "method_kn": "ಎಲೆ ಸಿಂಪಡಣೆ: ಲೀಟರಿಗೆ 1 ಗ್ರಾಂ",
                    "precautions": "Prevents flower drop and internal fruit cracking.",
                    "source": TNAU_TOMATO_NUTRIENT,
                },
            ],
        },
        {
            "id": "tom_fruit",
            "stage": "Fruit Development & Ripening (65 to 110 Days)",
            "stage_kn": "ಕಾಯಿ ಬೆಳವಣಿಗೆ ಮತ್ತು ಹಣ್ಣಾಗುವ ಹಂತ (65 ರಿಂದ 110 ದಿನಗಳು)",
            "purpose": "Enhance fruit size, firm skin, sugar content, and prevent Blossom End Rot (BER)",
            "purpose_kn": "ಹಣ್ಣಿನ ತೂಕ, ಹೊಳಪು, ದಪ್ಪ ಸಿಪ್ಪೆ ಮತ್ತು ಕಾಯಿ ಕೊಳೆತ ತಡೆಗಟ್ಟುವುದು",
            "items": [
                {
                    "nutrient": "Potassium Nitrate (13:00:45)",
                    "nutrient_kn": "ಪೊಟ್ಯಾಶಿಯಂ ನೈಟ್ರೇಟ್ (13:00:45)",
                    "category": "High potassium finisher",
                    "rate_per_acre": 4.0,
                    "unit": "kg/week",
                    "method": "Drip fertigation twice a week (2 kg per split)",
                    "method_kn": "ಹನಿ ನೀರಾವರಿ ಮೂಲಕ ವಾರಕ್ಕೆ 4 ಕೆಜಿ (2 ಕೆಜಿಂತೆ ಎರಡು ಬಾರಿ)",
                    "precautions": "Enhances fruit gloss, pulp firmness, and shipping quality.",
                    "source": ICAR_IIHR_TOMATO,
                },
                {
                    "nutrient": "Calcium Nitrate (Ca(NO3)2)",
                    "nutrient_kn": "ಕ್ಯಾಲ್ಸಿಯಂ ನೈಟ್ರೇಟ್",
                    "category": "Secondary macronutrient",
                    "rate_per_acre": 2.5,
                    "unit": "kg/week",
                    "method": "Apply separately from phosphate/sulphate fertigation",
                    "method_kn": "ಪ್ರತ್ಯೇಕವಾಗಿ ನೀಡಿ (ರಂಜಕದೊಂದಿಗೆ ಬೆರೆಸಬೇಡಿ)",
                    "precautions": "CRITICAL: Prevents Calcium deficiency Blossom End Rot (black sunken base).",
                    "source": ICAR_IIHR_TOMATO,
                },
            ],
        },
    ],
    "Chilli": [
        {
            "id": "chilli_veg",
            "stage": "Vegetative to Flowering Stage",
            "stage_kn": "ಬೆಳವಣಿಗೆ ಮತ್ತು ಹೂವಾಡುವ ಹಂತ",
            "purpose": "Promote lateral branching and prevent early flower abscission",
            "purpose_kn": "ಕವಲುಗಳು ಹೆಚ್ಚುವುದು ಮತ್ತು ಹೂ ಉದುರುವುದು ತಡೆಯುವುದು",
            "items": [
                {
                    "nutrient": "NPK 19:19:19 Water Soluble",
                    "nutrient_kn": "ನೀರಿನಲ್ಲಿ ಕರಗುವ NPK 19:19:19",
                    "category": "Balanced fertigation",
                    "rate_per_acre": 2.5,
                    "unit": "kg/week",
                    "method": "Drip fertigation or foliar spray at 5 g/L",
                    "method_kn": "ಹನಿ ನೀರಾವರಿ ಅಥವಾ ಲೀಟರಿಗೆ 5 ಗ್ರಾಂ ಸಿಂಪರಣೆ",
                    "precautions": "Apply when soil moisture is adequate.",
                    "source": ICAR_IIHR_TOMATO,
                },
                {
                    "nutrient": "Zinc Sulphate (ZnSO4 21%)",
                    "nutrient_kn": "ಜಿಂಕ್ ಸಲ್ಫೇಟ್ (21%)",
                    "category": "Micronutrient",
                    "rate_per_acre": 0.5,
                    "unit": "kg",
                    "method": "Foliar spray: 2.5 g per litre water",
                    "method_kn": "ಎಲೆ ಸಿಂಪಡಣೆ: ಲೀಟರಿಗೆ 2.5 ಗ್ರಾಂ",
                    "precautions": "Neutralize with 1.25 g slaked lime per litre before spraying.",
                    "source": TNAU_TOMATO_NUTRIENT,
                },
            ],
        },
    ],
}


def get_recommendations_for_field(crop_type, area_acres=1.0, growth_stage=None):
    """
    Returns verified fertilizer recommendations scaled to the farmer's registered acreage.
    Total quantity = Verified rate per acre * Farm area in acres.
    """
    plans = CROP_FERTILIZERS.get(crop_type, CROP_FERTILIZERS.get("Tomato", []))
    acres = max(0.1, float(area_acres or 1.0))
    result = []

    for stage_plan in plans:
        is_current_stage = False
        if growth_stage and any(w.lower() in stage_plan["stage"].lower() for w in growth_stage.split()):
            is_current_stage = True

        calculated_items = []
        for item in stage_plan["items"]:
            total_qty = round(item["rate_per_acre"] * acres, 2)
            calculated_items.append({
                "nutrient": item["nutrient"],
                "nutrient_kn": item["nutrient_kn"],
                "category": item["category"],
                "verified_rate_per_acre": f"{item['rate_per_acre']} {item['unit']}/acre",
                "farm_area_acres": acres,
                "calculated_total_quantity": f"{total_qty} {item['unit']}",
                "total_quantity_num": total_qty,
                "unit": item["unit"],
                "application_method": item["method"],
                "application_method_kn": item["method_kn"],
                "water_volume": "200 Litres per acre for foliar / Drip injection as per normal schedule",
                "water_volume_kn": "ಎಲೆ ಸಿಂಪರಣೆಗೆ ಎಕರೆಗೆ 200 ಲೀಟರ್ ನೀರು / ಹನಿ ನೀರಾವರಿ ಮೂಲಕ",
                "precautions": item["precautions"],
                "source": item["source"],
                "reviewed_date": "2026-10-15",
            })

        result.append({
            "stage_id": stage_plan["id"],
            "stage": stage_plan["stage"],
            "stage_kn": stage_plan["stage_kn"],
            "purpose": stage_plan["purpose"],
            "purpose_kn": stage_plan["purpose_kn"],
            "is_current_stage": is_current_stage,
            "items": calculated_items,
        })

    return {
        "crop": crop_type,
        "farm_area_acres": acres,
        "water_volume_per_acre_l": 200,
        "citation": "ICAR-Indian Institute of Horticultural Research (IIHR) Package of Practices",
        "guidance_note": {
            "en": "Calculations are based on verified agricultural application rates per acre. Always verify soil test reports and consult your local KVK or Agriculture Officer.",
            "kn": "ಲೆಕ್ಕಾಚಾರಗಳು ಎಕರೆಗೆ ಶಿಫಾರಸು ಮಾಡಿದ ಪ್ರಮಾಣವನ್ನು ಆಧರಿಸಿವೆ. ಮಣ್ಣು ಪರೀಕ್ಷೆ ನಡೆಸಿ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ."
        },
        "stages": result,
    }
