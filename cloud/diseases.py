"""
Crop Diseases Knowledge Base.

Important Scientific Distinction:
- Clearly distinguishes between:
  1. Confirmed insect vector (e.g., Whitefly transmitting Tomato Leaf Curl Virus)
  2. Secondary pathogen entry via insect wounds (e.g., Fruit borer entry holes allowing fungal rot)
  3. Non-vectored environmental/soil-borne diseases (e.g., Early blight fungal spores)
- Does NOT claim an insect caused a disease simply because it was caught in a trap.
- Includes reliable citations from ICAR, TNAU, KAU, and state agricultural university manuals.
"""

DISEASES = [
    {
        "id": "tolcv",
        "name_en": "Tomato Leaf Curl Virus (ToLCV)",
        "name_kn": "ಟೊಮೆಟೊ ಎಲೆ ಮುದುಡು ವೈರಸ್ ರೋಗ (ToLCV)",
        "pathogen": "Tomato Leaf Curl Virus (Begomovirus / Geminiviridae)",
        "crops": ["Tomato", "Chilli"],
        "vector_pest": "whitefly",
        "vector_name_en": "Whitefly (Bemisia tabaci)",
        "vector_name_kn": "ಬಿಳಿ ನೊಣ (ಬೆಮಿಸಿಯಾ ಟಬಾಸಿ)",
        "vector_status": "Confirmed Vector",
        "vector_status_kn": "ದೃಢೀಕೃತ ರೋಗವಾಹಕ",
        "transmission_explanation": {
            "en": "Whiteflies transmit the virus persistently in a circulative manner. A single viruliferous whitefly feeding for 15-30 minutes can infect a young plant. The disease does not spread mechanically or by seed.",
            "kn": "ಬಿಳಿ ನೊಣಗಳು ಈ ವೈರಸ್ ಅನ್ನು ಗಿಡದಿಂದ ಗಿಡಕ್ಕೆ ಹರಡುತ್ತವೆ. 15-30 ನಿಮಿಷ ರಸ ಹೀರುವ ಮೂಲಕ ವೈರಸ್ ಪ್ರವೇಶಿಸುತ್ತದೆ."
        },
        "symptoms": {
            "en": "Upward curling and puckering of leaf margins, severe vein clearing, reduced leaflet size, pale yellowing, internode shortening leading to a stunted bushy plant, and failure to set fruit if infected early.",
            "kn": "ಎಲೆಗಳ ಅಂಚುಗಳು ಮೇಲ್ಮುಖವಾಗಿ ಮುದುಡಿಕೊಳ್ಳುವುದು, ಎಲೆಗಳು ಸಣ್ಣದಾಗಿ ಹಳದಿಯಾಗುವುದು, ಗಿಡ ಗಿಡ್ಡವಾಗಿ ಪೊದೆಯಂತಾಗುವುದು, ಹೂ ಉದುರಿ ಕಾಯಿ ಕಟ್ಟದಿರುವುದು."
        },
        "crop_damage": {
            "en": "Up to 80-100% yield loss if infestation happens within 30 days of transplanting. Fruit set is completely arrested in early-infected plants.",
            "kn": "ನಾಟಿ ಮಾಡಿದ 30 ದಿನಗಳೊಳಗೆ ರೋಗ ಬಂದರೆ ಶೇ 80-100 ಇಳುವರಿ ನಷ್ಟವಾಗಬಹುದು."
        },
        "prevention": [
            {
                "en": "Cover nursery beds with 40-50 mesh nylon insect netting until transplanting.",
                "kn": "ನಾಟಿ ಮಾಡುವವರೆಗೆ ನರ್ಸರಿ ಮಡಿಗಳಿಗೆ 40-50 ಮೆಶ್ ನೈಲಾನ್ ಬಲೆ ಹೊದಿಸಿ."
            },
            {
                "en": "Install yellow sticky traps at 15 per hectare to monitor and trap adult whiteflies.",
                "kn": "ಬಿಳಿ ನೊಣಗಳನ್ನು ಹಿಡಿಯಲು ಹೆಕ್ಟೇರಿಗೆ 15 ಹಳದಿ ಅಂಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ."
            },
            {
                "en": "Rogue out and bury infected plants immediately to eliminate virus reservoirs.",
                "kn": "ರೋಗಬಾಧಿತ ಗಿಡಗಳನ್ನು ತಕ್ಷಣವೇ ಕಿತ್ತು ಹೂತುಹಾಕಿ."
            },
            {
                "en": "Plant 3 border rows of maize, sorghum, or pearl millet as a natural windbreak barrier against incoming whiteflies.",
                "kn": "ಜಮೀನಿನ ಸುತ್ತ ಜೋಳ ಅಥವಾ ಮೆಕ್ಕೆಜೋಳದ 3 ಸಾಲುಗಳನ್ನು ಬ್ಯಾರಿಯರ್ ಬೆಳೆಯಾಗಿ ಬೆಳೆಯಿರಿ."
            }
        ],
        "expert_consultation": {
            "en": "Consult your local KVK or Agriculture Officer immediately if more than 5% of young plants show curling symptoms.",
            "kn": "ಶೇ 5 ಕ್ಕಿಂತ ಹೆಚ್ಚು ಗಿಡಗಳಲ್ಲಿ ಎಲೆ ಮುದುಡು ಲಕ್ಷಣ ಕಂಡುಬಂದರೆ ಕೂಡಲೇ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ."
        },
        "source": "ICAR-IIHR Tomato Disease Management Guide & KAU Vegetable Protection",
        "source_url": "https://iihr.res.in/package-practices-tomato"
    },
    {
        "id": "fruit_rot_secondary",
        "name_en": "Secondary Fruit Rot & Alternaria Entry",
        "name_kn": "ಕಾಯಿ ಕೊಳೆತ ಮತ್ತು ಅಲ್ಟರ್ನೇರಿಯಾ ಶಿಲೀಂಧ್ರ ಬಾಧೆ",
        "pathogen": "Opportunistic fungal pathogens (Alternaria alternata, Rhizopus stolonifer)",
        "crops": ["Tomato", "Chilli", "Brinjal"],
        "vector_pest": "fruit_borer",
        "vector_name_en": "Fruit Borer (Helicoverpa armigera) & Pinworm (Tuta)",
        "vector_name_kn": "ಕಾಯಿ ಕೊರಕ ಮತ್ತು ಟ್ಯೂಟಾ ಕೀಟ",
        "vector_status": "Secondary Wound Facilitator",
        "vector_status_kn": "ಗಾಯದ ಮೂಲಕ ದ್ವಿತೀಯಕ ಸೋಂಕು",
        "transmission_explanation": {
            "en": "The insects do not biologically vector this fungus; rather, the circular bore holes and larval excreta (frass) break the cuticle and create warm, moist entry points for airborne fungal spores.",
            "kn": "ಕೀಟಗಳು ನೇರವಾಗಿ ರೋಗ ಹರಡುವುದಿಲ್ಲ; ಆದರೆ ಕಾಯಿಗೆ ಕೊರೆಯುವ ರಂಧ್ರಗಳು ಮತ್ತು ಮಲದಿಂದ ಶಿಲೀಂಧ್ರ ಪ್ರವೇಶಿಸಿ ಕಾಯಿ ಕೊಳೆಯುತ್ತದೆ."
        },
        "symptoms": {
            "en": "Dark, water-soaked depressed lesions around borer exit holes, black fluffy fungal growth on rotting fruit tissue, premature dropping of green and ripe fruits.",
            "kn": "ರಂಧ್ರಗಳ ಸುತ್ತ ಕಪ್ಪು ಕೊಳೆತ, ಶಿಲೀಂಧ್ರದ ಬೂಷ್ಟು, ಹಸಿ ಕಾಯಿಗಳು ಅಕಾಲಿಕವಾಗಿ ಉದುರುವುದು."
        },
        "crop_damage": {
            "en": "Direct loss of unmarketable fruits, rapid post-harvest rot in storage and transit.",
            "kn": "ಕಾಯಿಗಳು ಮಾರುಕಟ್ಟೆಗೆ ಯೋಗ್ಯವಲ್ಲದಂತಾಗುತ್ತವೆ, ಕೊಯ್ಲಿನ ನಂತರ ಬೇಗನೆ ಕೊಳೆಯುತ್ತವೆ."
        },
        "prevention": [
            {
                "en": "Install pheromone traps (Helilure) at 5 per acre to detect Helicoverpa moths early.",
                "kn": "ಎಕರೆಗೆ 5 ಹೆಲಿಲ್ಯೂರ್ ಫೆರೋಮೋನ್ ಬಲೆಗಳನ್ನು ಇರಿಸಿ."
            },
            {
                "en": "Handpick and destroy bored fruits and grown caterpillars during routine scouting.",
                "kn": "ಕೊರೆದ ಕಾಯಿಗಳು ಮತ್ತು ಮರಿಹುಳುಗಳನ್ನು ಕೈಯಿಂದ ಆರಿಸಿ ನಾಶಮಾಡಿ."
            },
            {
                "en": "Apply Copper Oxychloride 50 WP (3 g/L) if fungal lesions develop after rain.",
                "kn": "ಮಳೆಯ ನಂತರ ಕಾಯಿಗಳಲ್ಲಿ ಕೊಳೆತ ಕಂಡರೆ ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ (ಲೀಟರಿಗೆ 3 ಗ್ರಾಂ) ಸಿಂಪಡಿಸಿ."
            }
        ],
        "expert_consultation": {
            "en": "Consult extension experts when bored fruits exceed 2% of the crop at harvest.",
            "kn": "ಕಾಯಿ ಹಾನಿ ಶೇ 2 ಕ್ಕಿಂತ ಹೆಚ್ಚಿದ್ದರೆ ಕೃಷಿ ವಿಸ್ತರಣಾ ಅಧಿಕಾರಿಯ ಸಲಹೆ ಪಡೆಯಿರಿ."
        },
        "source": "TNAU Agritech Crop Protection & ICAR-IIHR Tomato Disease Manual",
        "source_url": "https://agritech.tnau.ac.in/crop_protection/tomato/tomato_2.html"
    },
    {
        "id": "leafminer_blight",
        "name_en": "Leaf Miner Tunnel Necrosis & Desiccation",
        "name_kn": "ಎಲೆ ಸುರಂಗ ಕೀಟದ ಎಲೆ ಒಣಗುವಿಕೆ (ನೆಕ್ರೋಸಿಸ್)",
        "pathogen": "Severe insect mining followed by secondary saprophytic leaf blight",
        "crops": ["Tomato", "Watermelon", "Cucumber"],
        "vector_pest": "leafminer",
        "vector_name_en": "Serpentine Leaf Miner (Liriomyza trifolii)",
        "vector_name_kn": "ಎಲೆ ಸುರಂಗ ಕೀಟ (ಲಿರಿಯೊಮೈಜಾ)",
        "vector_status": "Direct Tissue Destruction",
        "vector_status_kn": "ನೇರ ಎಲೆ ಅಂಗಾಂಶ ಹಾನಿ",
        "transmission_explanation": {
            "en": "Liriomyza larvae consume the mesophyll tissue between the upper and lower epidermis, leaving serpentine white tunnels that dry out into brown papery necrosis, destroying chlorophyll.",
            "kn": "ಮರಿಹುಳುಗಳು ಎಲೆಯೊಳಗಿನ ಹಸಿರು ಭಾಗವನ್ನು ತಿನ್ನುವುದರಿಂದ ಬಿಳಿ ಸುರಂಗಗಳಾಗಿ ನಂತರ ಎಲೆ ಕಂದುಬಣ್ಣಕ್ಕೆ ತಿರುಗಿ ಒಣಗುತ್ತದೆ."
        },
        "symptoms": {
            "en": "Whitish serpentine winding mines across the leaf surface, puncture marks from adult feeding, leaves curling from edges, extensive sunscald on fruits due to loss of leaf cover.",
            "kn": "ಎಲೆಯ ಮೇಲೆ ಅಂಕುಡೊಂಕಾದ ಬಿಳಿ ಸುರಂಗದ ಗೆರೆಗಳು, ಎಲೆ ಒಣಗಿ ಉದುರುವುದು, ಎಲೆಗಳ ಕೊರತೆಯಿಂದ ಕಾಯಿಗಳು ಬಿಸಿಲಿಗೆ ಸುಡುವುದು."
        },
        "crop_damage": {
            "en": "Reduces photosynthetic capacity by up to 50%, resulting in smaller fruits and severe fruit sunscald.",
            "kn": "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಸಾಮರ್ಥ್ಯ ಶೇ 50 ರಷ್ಟು ಕಡಿಮೆಯಾಗಿ ಕಾಯಿ ಗಾತ್ರ ಕುಂಠಿತವಾಗುತ್ತದೆ."
        },
        "prevention": [
            {
                "en": "Collect and destroy mined lower leaves during initial infestation.",
                "kn": "ಆರಂಭದಲ್ಲಿ ಸುರಂಗವಿರುವ ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ಕಿತ್ತು ನಾಶಮಾಡಿ."
            },
            {
                "en": "Spray Neem Seed Kernel Extract (NSKE 5%) or Neem Oil 2% as an oviposition deterrent.",
                "kn": "ಬೇವಿನ ಬೀಜದ ಕಷಾಯ (NSKE 5%) ಅಥವಾ ಬೇವಿನ ಎಣ್ಣೆ 2% ಸಿಂಪಡಿಸಿ."
            },
            {
                "en": "Conserve eulophid parasitic wasps (Diglyphus isaea) which naturally parasitize leafminer larvae.",
                "kn": "ಸ್ವಾಭಾವಿಕ ಪರಭಕ್ಷಕ ಕೀಟಗಳನ್ನು ರಕ್ಷಿಸಿ."
            }
        ],
        "expert_consultation": {
            "en": "Consult your agricultural officer if mines cover more than 3 leaflets per leaf across the field.",
            "kn": "ಎಲೆಗೆ 3 ಕ್ಕಿಂತ ಹೆಚ್ಚು ಸುರಂಗಗಳು ಕಂಡುಬಂದರೆ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ."
        },
        "source": "Kerala Agricultural University (KAU) Vegetable Protection Guidelines",
        "source_url": "https://celkau.in/crops/vegetables/tomato/leafminer.php"
    },
    {
        "id": "early_blight",
        "name_en": "Early Blight of Solanaceous Crops",
        "name_kn": "ಟೊಮೆಟೊ ಮುಂಚಿನ ಎಲೆ ಕರಕು ರೋಗ (ಅಲ್ಟರ್ನೇರಿಯಾ ಬ್ಲೈಟ್)",
        "pathogen": "Alternaria solani (Fungal spore pathogen)",
        "crops": ["Tomato", "Potato", "Brinjal"],
        "vector_pest": None,
        "vector_name_en": "Not Insect-Vectored (Airborne / Splash-borne)",
        "vector_name_kn": "ಕೀಟ ವಾಹಕವಲ್ಲ (ಗಾಳಿ ಮತ್ತು ಮಳೆಯಿಂದ ಹರಡುತ್ತದೆ)",
        "vector_status": "Non-Vectored (Environmental)",
        "vector_status_kn": "ಕೀಟವಾಹಕವಲ್ಲ (ಪರಿಸರ ಮತ್ತು ತೇವಾಂಶದಿಂದ)",
        "transmission_explanation": {
            "en": "This disease is caused by fungal spores carried by wind and splashing rain, especially during warm, humid conditions (24-29°C with high RH). It is not transmitted by insects, though insect damage creates additional entry courts.",
            "kn": "ಈ ರೋಗವು ಗಾಳಿ ಮತ್ತು ಮಳೆಯ ಹನಿಗಳಿಂದ ಹರಡುವ ಶಿಲೀಂಧ್ರವಾಗಿದೆ. ಬೆಚ್ಚಗಿನ ಮತ್ತು ತೇವಾಂಶದ ವಾತಾವರಣದಲ್ಲಿ ವೇಗವಾಗಿ ಹರಡುತ್ತದೆ."
        },
        "symptoms": {
            "en": "Circular brown to black spots with characteristic concentric rings (target board effect) starting on lower older leaves, yellow chlorotic halo around spots, stem collar rot.",
            "kn": "ಕೆಳಗಿನ ಎಲೆಗಳ ಮೇಲೆ ವೃತ್ತಾಕಾರದ ಕಂದು-ಕಪ್ಪು ಚುಕ್ಕೆಗಳು (ಟಾರ್ಗೆಟ್ ಬೋರ್ಡ್ ನಂತಹ ರಿಂಗ್‌ಗಳು), ಚುಕ್ಕೆಗಳ ಸುತ್ತ ಹಳದಿ ಬಳೆ."
        },
        "crop_damage": {
            "en": "Defoliation starting from the base of the plant upwards, leading to reduced yield and exposed fruit sunscald.",
            "kn": "ಕೆಳಗಿನಿಂದ ಮೇಲಕ್ಕೆ ಎಲೆಗಳು ಒಣಗಿ ಉದುರುತ್ತವೆ, ಇಳುವರಿ ಕಡಿಮೆಯಾಗುತ್ತದೆ."
        },
        "prevention": [
            {
                "en": "Mulch the soil bed with silver-black polythene or straw to prevent rain splash from soil.",
                "kn": "ಮಣ್ಣಿನಿಂದ ಮಳೆ ಹನಿ ಸಿಡಿಯುವುದನ್ನು ತಡೆಯಲು ಮಲ್ಚಿಂಗ್ ಹಾಳೆ ಬಳಸಿ."
            },
            {
                "en": "Provide drip irrigation rather than overhead sprinklers to keep foliage dry.",
                "kn": "ಎಲೆಗಳು ಒದ್ದೆಯಾಗದಂತೆ ಹನಿ ನೀರಾವರಿ ನೀಡಿ."
            },
            {
                "en": "Apply Mancozeb 75 WP at 2 g/L or Chlorothalonil 75 WP at 2 g/L on initial symptom appearance.",
                "kn": "ಆರಂಭಿಕ ಹಂತದಲ್ಲಿ ಮ್ಯಾಂಕೋಜೆಬ್ (ಲೀಟರಿಗೆ 2 ಗ್ರಾಂ) ಸಿಂಪಡಿಸಿ."
            }
        ],
        "expert_consultation": {
            "en": "Consult your local plant pathologist if concentric ring spots spread above the mid-canopy.",
            "kn": "ಚುಕ್ಕೆಗಳು ಗಿಡದ ಮಧ್ಯಭಾಗಕ್ಕಿಂತ ಮೇಲಕ್ಕೆ ಹರಡಿದರೆ ಸಸ್ಯ ರೋಗಶಾಸ್ತ್ರಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ."
        },
        "source": "ICAR-IIHR Plant Pathology Division & TNAU Agritech",
        "source_url": "https://agritech.tnau.ac.in/crop_protection/tomato/tomato_3.html"
    }
]


def get_diseases(crop=None, pest=None):
    results = []
    for d in DISEASES:
        if crop and crop not in d["crops"]:
            continue
        if pest and d["vector_pest"] and d["vector_pest"] != pest:
            continue
        results.append(d)
    return results


def get_disease(did):
    for d in DISEASES:
        if d["id"] == did:
            return d
    return None
