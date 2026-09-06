import os, urllib.request
from pathlib import Path

envp = Path("/Users/aeriox/aeriox-studio/.env.local")
for line in envp.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    v = v.strip().strip('"').strip("'")
    if k in ("FAL_KEY", "FAL_API_KEY") and v:
        os.environ["FAL_KEY"] = v
if not os.environ.get("FAL_KEY"):
    raise SystemExit("no FAL_KEY")

import fal_client

out_dir = Path("/Users/aeriox/worktrees/coastal-cabinet-painting/assets/logo-opts")
out_dir.mkdir(exist_ok=True)

prompts = [
    "Professional vector brand mark for Coastal Cabinet Painting, a Jupiter Florida cabinet refinishing company. Flat logo icon of a shaker cabinet door with a subtle ocean-wave grain in sage green and cream. No photoreal kitchen. Clean negative space. Centered on a solid off-white background. High-end interior brand, works at 32px. No extra words besides optional tiny COASTAL.",
    "Luxury logo lockup: the word COASTAL in refined condensed sans, sage green, with a simple painted cabinet-door icon to the left. White background, vector-like, crisp typography, no people, no photo, suitable for a website nav bar.",
    "Minimal emblem: a circle badge, cream field, sage green line drawing of a cabinet door that doubles as a C. Text COASTAL CABINET PAINTING in a small arc. Vector, print-ready, no texture photos.",
]

def extract_url(res):
    if not isinstance(res, dict):
        return None
    img = res.get("image") or res.get("output")
    if isinstance(img, dict):
        return img.get("url")
    if isinstance(img, str):
        return img
    images = res.get("images")
    if images:
        first = images[0]
        return first.get("url") if isinstance(first, dict) else first
    return None

for i, prompt in enumerate(prompts, 1):
    print("nano", i, flush=True)
    res = fal_client.subscribe(
        "fal-ai/nano-banana-pro",
        arguments={
            "prompt": prompt,
            "aspect_ratio": "1:1",
            "resolution": "2K",
            "num_images": 1,
        },
        with_logs=False,
    )
    out = extract_url(res)
    if not out:
        raise SystemExit(f"no url {i} keys={list(res)[:30] if isinstance(res, dict) else res}")
    dest = out_dir / f"nano-{i}.png"
    urllib.request.urlretrieve(out, str(dest))
    print("saved", dest.name, dest.stat().st_size, flush=True)
print("done")
