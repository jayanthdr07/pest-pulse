"""
Pest Knowledge Base & Agricultural Recommendations.

Every product and dose below is derived from published Indian agricultural extension sources:
- ICAR-IIHR (Indian Institute of Horticultural Research, Hesaraghatta)
- Kerala Agricultural University (KAU)
- Tamil Nadu Agricultural University (TNAU)
- Krishi Vigyan Kendra (KVK) Wyra IPM manuals
- ICAR-NBAIR (National Bureau of Agricultural Insect Resources)

Safety and Transparency:
- All chemical rates are calculated assuming 200 L spray volume per acre.
- Recommended waiting periods (PHI) before harvest are provided.
- IRAC mode-of-action groups are marked to enforce rotation.
"""

KAU_BORER = "https://celkau.in/crops/vegetables/tomato/borer.php"
KAU_WHITEFLY = "https://celkau.in/crops/vegetables/tomato/whitefly.php"
KAU_LEAFMINER = "https://celkau.in/crops/vegetables/tomato/leafminer.php"
TNAU_LEAFMINER = "https://agritech.tnau.ac.in/crop_protection/tomato/tomato_2.html"
KVK_TUTA = "https://aatcc.peerjournals.net/demonstration-on-management-of-tomato-pinworm-tuta-absoluta-l-in-khammam-district-of-telangana-india/"
NBAIR_TUTA = "https://www.nbair.res.in/sites/default/files/2019-01/Group%20meeting%20on%20the%20new%20invasive%20pest%20Tuta%20absoluta.pdf"
ICAR_THRIPS = "https://iihr.res.in/package-practices-chilli"


def P(name, trade, irac, per_l, unit="ml", colour=None, src=None, note=None, phi_days=3):
    """A chemical option. per_acre is derived from the source's 200 L/acre spray volume."""
    return {
        "name": name,
        "trade": trade,
        "irac": irac,
        "per_l": per_l,
        "unit": unit,
        "per_tank10": round(per_l * 10, 2),
        "per_acre": round(per_l * 200, 1),
        "colour": colour,
        "source": src,
        "note": note,
        "phi_days": phi_days,
    }


PESTS = {
    "whitefly": {
        "en": "Whitefly",
        "kn": "ಬಿಳಿ ನೊಣ",
        "latin": "Bemisia tabaci",
        "life_stage": "Adult & Nymph",
        "crops_affected": ["Tomato", "Chilli", "Brinjal", "Cotton", "Okra"],
        "infestation_signs": {
            "en": "Tiny white winged insects fluttering from the undersides of leaves when disturbed; yellow sticky honeydew; black sooty mold.",
            "kn": "ಗಿಡ ಅಲುಗಾಡಿಸಿದಾಗ ಎಲೆಯ ಕೆಳಗಿನಿಂದ ಸಣ್ಣ ಬಿಳಿ ನೊಣಗಳು ಹಾರುವುದು; ಎಲೆಯ ಮೇಲೆ ಜಿಗುಟಾದ ದ್ರವ ಮತ್ತು ಕಪ್ಪು ಬೂಷ್ಟು."
        },
        "potential_damage": {
            "en": "Severe sap depletion leading to yellow chlorotic speckling; active vector of Tomato Leaf Curl Virus (ToLCV).",
            "kn": "ರಸ ಹೀರುವುದರಿಂದ ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತವೆ; ಎಲೆ ಮುದುಡು ವೈರಸ್ ರೋಗವನ್ನು ತೀವ್ರವಾಗಿ ಹರಡುತ್ತದೆ."
        },
        "disease_vector": {
            "status": "Confirmed Vector",
            "diseases": ["Tomato Leaf Curl Virus (ToLCV)", "Chilli Leaf Curl Virus"]
        },
        "why": {
            "en": "Sucks sap and persistently transmits the destructive Tomato Leaf Curl Virus.",
            "kn": "ರಸ ಹೀರುತ್ತದೆ ಮತ್ತು ಅಪಾಯಕಾರಿ ಎಲೆ ಮುದುಡು ವೈರಸ್ ಹರಡುತ್ತದೆ."
        },
        "reference_image": "/img/ref_whitefly.jpg",
        "non_chemical": [
            {"en": "Install yellow sticky traps at 15 per hectare (about 6 per acre).", "kn": "ಹೆಕ್ಟೇರಿಗೆ 15 ಹಳದಿ ಅಂಟು ಬಲೆ (ಎಕರೆಗೆ ಸುಮಾರು 6) ಇಡಿ.", "source": KAU_WHITEFLY},
            {"en": "Spray water forcefully on the undersides of leaves in early morning.", "kn": "ಬೆಳಿಗ್ಗೆ ಎಲೆಗಳ ತಳಭಾಗಕ್ಕೆ ಜೋರಾಗಿ ನೀರು ಸಿಂಪಡಿಸಿ.", "source": KAU_WHITEFLY},
            {"en": "Uproot and bury plants exhibiting virus leaf curl symptoms.", "kn": "ಎಲೆ ಮುದುಡಿದ ರೋಗಪೀಡಿತ ಗಿಡಗಳನ್ನು ಕಿತ್ತು ಹೂತುಹಾಕಿ.", "source": KAU_WHITEFLY},
            {"en": "Spray Neem Oil 2% (20 ml/L) + soap solution as an anti-feedant.", "kn": "ಬೇವಿನ ಎಣ್ಣೆ 2% (ಲೀಟರಿಗೆ 20 ಮಿ.ಲೀ) ಸಿಂಪಡಿಸಿ.", "source": KAU_WHITEFLY},
        ],
        "chemical": [
            P("Imidacloprid 17.8 SL", "Confidor, Tata Mida, Victor", "4A", 0.3, colour="yellow", src=KAU_WHITEFLY,
              note="Highly toxic to bees: spray only late in the evening when bees are not foraging.", phi_days=5),
            P("Diafenthiuron 50 WP", "Pegasus", "12A", 1.0, unit="g", colour="blue", src=KAU_WHITEFLY,
              note="Effective on resistant whitefly nymphs and adults.", phi_days=7),
            P("Spiromesifen 22.9 SC", "Oberon", "23", 1.0, colour="blue", src=KAU_WHITEFLY,
              note="Lipid synthesis inhibitor; excellent against juvenile nymphs.", phi_days=5),
        ],
    },
    "leafminer": {
        "en": "Serpentine Leaf Miner",
        "kn": "ಎಲೆ ಸುರಂಗ ಕೀಟ",
        "latin": "Liriomyza trifolii",
        "life_stage": "Larva (mining inside leaf)",
        "crops_affected": ["Tomato", "Watermelon", "Cucumber", "Beans"],
        "infestation_signs": {
            "en": "Pale white irregular serpentine winding tunnels visible on leaf surfaces; punctured feeding dots.",
            "kn": "ಎಲೆಗಳ ಮೇಲೆ ಬಿಳಿಯ ಅಂಕುಡೊಂಕಾದ ಸುರಂಗದ ಗೆರೆಗಳು; ಸಣ್ಣ ಚುಕ್ಕೆಗಳು."
        },
        "potential_damage": {
            "en": "Destroys photosynthetic leaf tissue, causes premature leaf drop, and exposes fruit to sunscald.",
            "kn": "ಎಲೆಯ ಹಸಿರು ಭಾಗ ನಾಶವಾಗಿ ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಕುಂಠಿತವಾಗುತ್ತದೆ, ಕಾಯಿಗಳು ಬಿಸಿಲಿಗೆ ಸುಡುತ್ತವೆ."
        },
        "disease_vector": {
            "status": "Direct Tissue Miner (Secondary Rot Facilitator)",
            "diseases": ["Secondary leaf blight and bacterial necrosis"]
        },
        "why": {
            "en": "Larvae tunnel inside leaves, drastically reducing photosynthesis and crop vigor.",
            "kn": "ಮರಿಹುಳು ಎಲೆಯೊಳಗೆ ಸುರಂಗ ಕೊರೆದು ಬೆಳವಣಿಗೆಯನ್ನು ಕುಂಠಿತಗೊಳಿಸುತ್ತದೆ."
        },
        "reference_image": "/img/ref_leafminer.jpg",
        "non_chemical": [
            {"en": "Collect and destroy heavily mined lower leaves.", "kn": "ಸುರಂಗವಿರುವ ಎಲೆಗಳನ್ನು ಕಿತ್ತು ನಾಶಮಾಡಿ.", "source": KAU_LEAFMINER},
            {"en": "Spray Neem Seed Kernel Extract (NSKE 5%) or Neem Oil 2%.", "kn": "ಬೇವಿನ ಬೀಜದ ಸಾರ 5% ಅಥವಾ ಬೇವಿನ ಎಣ್ಣೆ 2% ಸಿಂಪಡಿಸಿ.", "source": KAU_LEAFMINER},
            {"en": "Spray Lecanicillium lecanii 20 g per litre (bio-pesticide).", "kn": "ಜೈವಿಕ ಕೀಟನಾಶಕ ಲೆಕಾನಿಸಿಲಿಯಂ ಲೆಕಾನಿ ಲೀಟರಿಗೆ 20 ಗ್ರಾಂ ಸಿಂಪಡಿಸಿ.", "source": KAU_LEAFMINER},
        ],
        "chemical": [
            P("Cyantraniliprole 10.26 OD", "Benevia", "28", 1.8, colour="green", src=TNAU_LEAFMINER,
              note="Systemic cross-spectrum anthranilic diamide; respects beneficial predatory wasps.", phi_days=3),
            P("Abamectin 1.9 EC", "Vertimec", "6", 0.5, colour="yellow", src=KAU_LEAFMINER,
              note="Penetrates leaf cuticle translaminarly to reach feeding larvae.", phi_days=7),
        ],
    },
    "fruit_borer": {
        "en": "Gram Pod Borer / Fruit Borer",
        "kn": "ಕಾಯಿ ಕೊರಕ / ಹಣ್ಣು ಕೊರಕ",
        "latin": "Helicoverpa armigera",
        "life_stage": "Larva / Caterpillar",
        "crops_affected": ["Tomato", "Chilli", "Chickpea", "Pigeonpea", "Cotton"],
        "infestation_signs": {
            "en": "Circular entrance holes bored into green and ripe fruits, accompanied by dark moist larval droppings (frass).",
            "kn": "ಕಾಯಿಗಳ ಮೇಲೆ ದುಂಡಗಿನ ರಂಧ್ರಗಳು ಮತ್ತು ಮರಿಹುಳುವಿನ ಕಪ್ಪು ಮಲದ ಗುರುತುಗಳು."
        },
        "potential_damage": {
            "en": "One caterpillar can bore into and destroy 4-8 fruits in its lifespan; damaged fruits rot rapidly.",
            "kn": "ಒಂದೇ ಹುಳು 4 ರಿಂದ 8 ಕಾಯಿಗಳನ್ನು ಹಾಳುಮಾಡುತ್ತದೆ; ಗಾಯಗೊಂಡ ಕಾಯಿಗಳು ಕೊಳೆತು ಉದುರುತ್ತವೆ."
        },
        "disease_vector": {
            "status": "Wound Facilitator",
            "diseases": ["Secondary Fruit Rot (Alternaria, Rhizopus)"]
        },
        "why": {
            "en": "Caterpillars bore into fruits; a single larva ruins multiple marketable fruits.",
            "kn": "ಮರಿಹುಳು ಕಾಯಿಯೊಳಗೆ ಕೊರೆದು ತೀವ್ರ ಇಳುವರಿ ನಷ್ಟ ಉಂಟುಮಾಡುತ್ತದೆ."
        },
        "reference_image": "/img/ref_fruit_borer.jpg",
        "non_chemical": [
            {"en": "Pheromone traps with Helilure at 12 per hectare (about 5 per acre).", "kn": "ಹೆಲಿಲ್ಯೂರ್ ಫೆರೋಮೋನ್ ಬಲೆ ಹೆಕ್ಟೇರಿಗೆ 12 (ಎಕರೆಗೆ 5) ಇಡಿ.", "source": KAU_BORER},
            {"en": "Release Trichogramma chilonis egg parasitoids at 50,000 per acre.", "kn": "ಟ್ರೈಕೊಗ್ರಾಮಾ ಮೊಟ್ಟೆ ಪರಾವಲಂಬಿ ಕೀಟಗಳನ್ನು ಎಕರೆಗೆ 50,000 ಬಿಡುಗಡೆ ಮಾಡಿ.", "source": KAU_BORER},
            {"en": "Handpick and destroy bored fruits and mature caterpillars.", "kn": "ಕೊರೆದ ಕಾಯಿ ಮತ್ತು ಮರಿಹುಳುಗಳನ್ನು ಕೈಯಿಂದ ಆರಿಸಿ ನಾಶಮಾಡಿ.", "source": KAU_BORER},
            {"en": "Spray HaNPV (Nuclear Polyhedrosis Virus) at 250 LE/acre in the evening.", "kn": "ಸಂಜೆ ಸಮಯದಲ್ಲಿ HaNPV ವೈರಸ್ ಕಷಾಯ ಸಿಂಪಡಿಸಿ.", "source": KAU_BORER},
        ],
        "chemical": [
            P("Chlorantraniliprole 18.5 SC", "Coragen", "28", 0.3, colour="green", src=KAU_BORER,
              note="Low mammalian toxicity; targets ryanodine receptors causing rapid feeding cessation.", phi_days=3),
            P("Flubendiamide 240 SC", "Fame, Takumi", "28", 0.2, colour="green", src=KAU_BORER,
              note="Potent against Lepidopteran larvae; excellent rainfastness.", phi_days=5),
            P("Novaluron 10 EC", "Rimon, Pedestal", "15", 1.5, colour="green", src=KAU_BORER,
              note="Insect growth regulator (IGR); prevents cuticle moulting.", phi_days=5),
            P("Indoxacarb 14.5 SC", "Avaunt, Fego", "22A", 0.8, colour="yellow", src=KAU_BORER,
              note="Voltage-gated sodium channel blocker; effective on resistant larvae.", phi_days=5),
        ],
    },
    "tuta": {
        "en": "Tomato Pinworm (Tuta)",
        "kn": "ಟ್ಯೂಟಾ ಪಿನ್‌ವರ್ಮ್",
        "latin": "Tuta absoluta",
        "life_stage": "Larva (leaf miner and fruit borer)",
        "crops_affected": ["Tomato", "Potato", "Brinjal"],
        "infestation_signs": {
            "en": "Blotch-shaped transparent mines on leaves; small entrance pinholes near the fruit calyx with frass.",
            "kn": "ಎಲೆಯ ಮೇಲೆ ಪಾರದರ್ಶಕ ಕಲೆಗಳು; ಕಾಯಿಯ ತೊಟ್ಟಿನ ಬಳಿ ಸಣ್ಣ ಸೂಜಿಯಂತಹ ರಂಧ್ರಗಳು."
        },
        "potential_damage": {
            "en": "Extremely invasive; can destroy 50-100% of the crop foliage and fruit within 2-3 weeks if unmanaged.",
            "kn": "ಅತಿ ವೇಗವಾಗಿ ಹರಡುವ ಕೀಟ; 2-3 ವಾರಗಳಲ್ಲಿ ಶೇ 50-100 ರಷ್ಟು ಬೆಳೆಯನ್ನು ನಾಶಪಡಿಸಬಹುದು."
        },
        "disease_vector": {
            "status": "Direct Tissue Miner & Fruit Borer",
            "diseases": ["Secondary fungal and bacterial calyx rot"]
        },
        "why": {
            "en": "Aggressive invasive leaf and fruit miner that can rapidly destroy the entire crop canopy.",
            "kn": "ಎಲೆ, ಕಾಂಡ ಮತ್ತು ಕಾಯಿಗಳಿಗೆ ಕೊರೆದು ಬೆಳೆ ಸಂಪೂರ್ಣ ನಾಶಮಾಡುತ್ತದೆ."
        },
        "reference_image": "/img/ref_tuta.jpg",
        "non_chemical": [
            {"en": "Pheromone delta traps (Tuta lure) at 5 per acre to monitor, 16 per acre for mass-trapping.", "kn": "ಟ್ಯೂಟಾ ಫೆರೋಮೋನ್ ಬಲೆ: ಗಮನಿಸಲು ಎಕರೆಗೆ 5, ಸಾಮೂಹಿಕ ಹಿಡಿತಕ್ಕೆ 16.", "source": KVK_TUTA},
            {"en": "Sanitize and burn crop residues after harvest; net nursery beds with 40-mesh netting.", "kn": "ಬೆಳೆ ಕಟಾವಿನ ನಂತರ ಅವಶೇಷಗಳನ್ನು ಸುಟ್ಟು ನಾಶಮಾಡಿ; ನರ್ಸರಿಗೆ ಬಲೆ ಹಾಕಿ.", "source": NBAIR_TUTA},
            {"en": "Spray Azadirachtin 10000 ppm at 2-3 ml per litre 30 days after transplanting.", "kn": "ನಾಟಿ ಮಾಡಿದ 30 ದಿನಕ್ಕೆ ಅಜಾಡಿರಾಕ್ಟಿನ್ 10000 ppm ಲೀಟರಿಗೆ 2-3 ಮಿ.ಲೀ ಸಿಂಪಡಿಸಿ.", "source": KVK_TUTA},
            {"en": "Conserve predatory mirid bugs (Nesidiocoris tenuis).", "kn": "ಸ್ನೇಹಿ ಕೀಟ ನೆಸಿಡಿಯೊಕೋರಿಸ್ ಅನ್ನು ಸಂರಕ್ಷಿಸಿ.", "source": NBAIR_TUTA},
        ],
        "chemical": [
            P("Emamectin Benzoate 5 SG", "Proclaim", "6", 0.4, unit="g", colour="blue", src=KVK_TUTA,
              note="Semi-synthetic avermectin derivative with high translaminar efficacy.", phi_days=3),
            P("Spinosad 45 SC", "Tracer", "5", 0.25, colour="blue", src=KVK_TUTA,
              note="Naturalyte fermentation insecticide; nicotinic acetylcholine receptor modulator.", phi_days=3),
            P("Chlorantraniliprole 18.5 SC", "Coragen", "28", 0.3, colour="green", src=KVK_TUTA,
              note="Do not spray Coragen consecutively if used in the previous spray cycle.", phi_days=3),
            P("Flubendiamide 480 SC", "Fame", "28", 0.2, colour="green", src=KVK_TUTA,
              note="Alternate with Emamectin or Spinosad to prevent pest resistance.", phi_days=5),
        ],
    },
    "thrips": {
        "en": "Chilli Thrips",
        "kn": "ನುಸಿ / ಥ್ರಿಪ್ಸ್",
        "latin": "Scirtothrips dorsalis",
        "life_stage": "Nymph & Adult",
        "crops_affected": ["Chilli", "Tomato", "Capsicum", "Cotton"],
        "infestation_signs": {
            "en": "Upward boat-shaped leaf curling, bronze or silver sheen on the undersides of leaves, stunted shoots.",
            "kn": "ಎಲೆಗಳು ದೋಣಿಯಾಕಾರದಲ್ಲಿ ಮೇಲ್ಮುಖವಾಗಿ ಮುದುಡುವುದು; ಎಲೆಯ ತಳಭಾಗ ಕಂಚಿನಂತೆ ಹೊಳೆಯುವುದು."
        },
        "potential_damage": {
            "en": "Rasping and sucking leads to crinkled leaves, flower drop, and vectors Groundnut Bud Necrosis Virus (GBNV).",
            "kn": "ಎಲೆಗಳನ್ನು ಕೆರೆದು ರಸ ಹೀರುವುದರಿಂದ ಹೂ ಉದುರುತ್ತದೆ ಮತ್ತು ನಂಜು ರೋಗ ಹರಡುತ್ತದೆ."
        },
        "disease_vector": {
            "status": "Confirmed Vector",
            "diseases": ["Groundnut Bud Necrosis Virus (GBNV) / Tomato Spotted Wilt"]
        },
        "why": {
            "en": "Rasps leaves and transmits bud necrosis tospoviruses.",
            "kn": "ಎಲೆಗಳನ್ನು ಕೆರೆದು ರಸ ಹೀರುತ್ತದೆ ಮತ್ತು ಮೊಗ್ಗು ಕೊಳೆತ ನಂಜು ರೋಗ ಹರಡುತ್ತದೆ."
        },
        "reference_image": "/img/ref_thrips.jpg",
        "non_chemical": [
            {"en": "Install blue sticky traps at 15-20 per acre.", "kn": "ಎಕರೆಗೆ 15-20 ನೀಲಿ ಅಂಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ.", "source": ICAR_THRIPS},
            {"en": "Spray Neem Oil 3000 ppm at 3 ml per litre.", "kn": "ಬೇವಿನ ಎಣ್ಣೆ 3000 ppm ಲೀಟರಿಗೆ 3 ಮಿ.ಲೀ ಸಿಂಪಡಿಸಿ.", "source": ICAR_THRIPS},
        ],
        "chemical": [
            P("Fipronil 5 SC", "Regent", "2B", 1.5, colour="blue", src=ICAR_THRIPS,
              note="Broad spectrum GABA-gated chloride channel antagonist.", phi_days=7),
            P("Spinetoram 11.7 SC", "Delegate", "5", 0.9, colour="green", src=ICAR_THRIPS,
              note="Fast-acting spinosyn derivative; highly effective on thrips.", phi_days=3),
        ],
    },
}

TRAP_DEFAULT_PEST = {
    "sticky_yellow": "whitefly",
    "lirio_sticky": "leafminer",
    "pheromone": "fruit_borer",
    "tuta_delta": "tuta",
}

SAFETY = [
    {
        "en": "Always confirm with your local Agriculture Officer or KVK expert before chemical application.",
        "kn": "ಯಾವುದೇ ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆಗೆ ಮುನ್ನ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿ ಅಥವಾ KVK ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ."
    },
    {
        "en": "Strictly follow the registered label dose and statutory waiting period (PHI) before harvest.",
        "kn": "ಲೇಬಲ್‌ನಲ್ಲಿ ನಮೂದಿಸಿದ ಪ್ರಮಾಣ ಮತ್ತು ಕೊಯ್ಲಿಗೆ ಮೊದಲು ಕಾಯಬೇಕಾದ ದಿನಗಳನ್ನು ಕಡ್ಡಾಯವಾಗಿ ಪಾಲಿಸಿ."
    },
    {
        "en": "Wear personal protective equipment (gloves, mask, goggles, boots). Spray early morning or late evening.",
        "kn": "ಕೈಗವಸು, ಮುಖಗವಸು ಧರಿಸಿ. ಮುಂಜಾನೆ ಅಥವಾ ಸಂಜೆ ಶಾಂತ ವಾತಾವರಣದಲ್ಲಿ ಸಿಂಪಡಿಸಿ."
    },
    {
        "en": "Rotate IRAC mode-of-action groups: NEVER spray the same chemical group consecutively.",
        "kn": "ಕೀಟಗಳು ನಿರೋಧಕತೆ ಪಡೆಯದಂತೆ ಒಂದೇ IRAC ಗುಂಪಿನ ಔಷಧಿಯನ್ನು ಸತತವಾಗಿ ಸಿಂಪಡಿಸಬೇಡಿ."
    },
]

MIN_DAYS_BETWEEN_SPRAYS = 10


def pest_for(trap, override=None):
    return override if override in PESTS else TRAP_DEFAULT_PEST.get(trap, "whitefly")
