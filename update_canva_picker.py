from pathlib import Path

root = Path(__file__).resolve().parent
picker_path = root / "picker.js"
css_path = root / "styles.css"
js = picker_path.read_text(encoding="utf-8")

js = js.replace('logo: "door"', 'logo: "box"', 1)

old_logos = """  const LOGOS = {
    door: { src: "assets/mark.svg", label: "Door" },
    panels: { label: "Panels", variants: { color: "assets/logo-opts/canva-panels-color.png" }, wordmark: true },
    sprayer: { label: "Sprayer", variants: { color: "assets/logo-opts/canva-sprayer-color.png", dark: "assets/logo-opts/canva-sprayer-dark.png" }, wordmark: true },
    palm: { label: "Palm", variants: { light: "assets/logo-opts/canva-palm-light.png", dark: "assets/logo-opts/canva-palm-dark.png" }, wordmark: true },
    square: { label: "Square", variants: { light: "assets/logo-opts/canva-square-light.png" }, wordmark: true },
    crest: { src: "assets/logo-opts/nano-1.png", label: "Crest" },
    lockup: { src: "assets/logo-opts/nano-2.png", label: "Lockup" },
    panel: { src: "assets/logo-opts/opt-1.png", label: "Panel" },
    wave: { src: "assets/logo-opts/opt-2.png", label: "Wave" },
    ccp: { src: "assets/logo-opts/opt-3.png", label: "CCP" }
  };
  const WORDMARK = { crest: true, lockup: true };
  const LOGO_ORDER = ["door", "panels", "sprayer", "palm", "square", "crest", "lockup", "panel", "wave", "ccp"];
"""

new_logos = """  const LOGOS = {
    box: { label: "Box", wordmark: true, variants: { color: "assets/logo-opts/canva-box-color.png", light: "assets/logo-opts/canva-box-light.png", dark: "assets/logo-opts/canva-box-dark.png" } },
    panels: { label: "Panels", wordmark: true, variants: { light: "assets/logo-opts/canva-panels-light.png", dark: "assets/logo-opts/canva-panels-dark.png" } },
    crest: { label: "Crest", wordmark: true, variants: { light: "assets/logo-opts/canva-crest-light.png", dark: "assets/logo-opts/canva-crest-dark.png" } },
    sprayer: { label: "Sprayer", wordmark: true, variants: { color: "assets/logo-opts/canva-sprayer-color.png", dark: "assets/logo-opts/canva-sprayer-dark.png" } }
  };
  const WORDMARK = {};
  const LOGO_ORDER = ["box", "panels", "crest", "sprayer"];
"""

if old_logos not in js:
    raise SystemExit("LOGOS block not found; aborting")
js = js.replace(old_logos, new_logos, 1)

js = js.replace("return LOGOS[state.logo] || LOGOS.door;", "return LOGOS[state.logo] || LOGOS.box;")
js = js.replace("return LOGOS.door.src;", "const fallback = LOGOS.box; return fallback.variants[autoVariantKey(fallback)] || firstVariantSrc(fallback.variants);")
js = js.replace("const next = LOGOS[value] || LOGOS.door;", "const next = LOGOS[value] || LOGOS.box;")

picker_path.write_text(js, encoding="utf-8")

css = css_path.read_text(encoding="utf-8")
old_css = ".mark.mark-wordmark img { height: 36px; width: auto; max-width: 14rem; max-height: none; }"
new_css = ".mark.mark-wordmark img { height: 40px; width: auto; max-width: 16rem; max-height: none; object-fit: contain; }"
if old_css not in css:
    raise SystemExit("wordmark CSS not found; aborting")
css_path.write_text(css.replace(old_css, new_css, 1), encoding="utf-8")
print("updated picker.js and styles.css")
