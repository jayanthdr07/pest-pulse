"""Copies the pest knowledge base (cloud/pests.py) into app/kb.js for the app's demo mode. Run after editing pests.py."""
import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / "cloud"))
import pests  # noqa: E402
kb = {k: {kk: v[kk] for kk in ("en", "kn", "latin", "why", "non_chemical", "chemical")} for k, v in pests.PESTS.items()}
(root / "app" / "kb.js").write_text("/* generated from cloud/pests.py by tools/export_kb.py - do not edit by hand */\nwindow.PP_KB = "
                                    + json.dumps({"pests": kb, "safety": pests.SAFETY, "trap_pest": pests.TRAP_DEFAULT_PEST},
                                                 ensure_ascii=False) + ";\n")
print("app/kb.js updated")
