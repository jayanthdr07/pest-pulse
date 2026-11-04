"""Builds one self-contained HTML file of the app in demo mode (for sharing a preview / pitch fallback)."""
import base64, pathlib, sys
app = pathlib.Path(__file__).resolve().parent.parent / "app"
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "pestpulse_app_preview.html")
bg = "data:image/svg+xml;base64," + base64.b64encode((app / "bg.svg").read_bytes()).decode()
css = (app / "styles.css").read_text().replace('url("bg.svg")', f'url("{bg}")')
css += """
:root { color-scheme: dark; }
#app { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.nav { bottom: calc(16px + env(safe-area-inset-bottom, 0px)); }
"""
html = f"""<title>PestPulse App</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#0d1f14">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Noto+Sans+Kannada:wght@400;600;700&display=swap">
<style>{css}</style>
<div id="app"></div>
<nav class="nav" id="nav"></nav>
<div class="toast" id="toast"></div>
<script>window.PP_FORCE_DEMO = true;</script>
<script>{(app / "kb.js").read_text()}</script>
<script>{(app / "demo.js").read_text()}</script>
<script>{(app / "app.js").read_text()}</script>
"""
out.write_text(html)
print("wrote", out, len(html) // 1024, "KB")
