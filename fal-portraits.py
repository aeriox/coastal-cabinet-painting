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

src = Path("/Users/aeriox/worktrees/coastal-cabinet-painting/assets/ref-owners.png")
out_dir = Path("/Users/aeriox/worktrees/coastal-cabinet-painting/assets")
url = fal_client.upload_file(str(src))
print("uploaded ref", flush=True)

jobs = [
    (
        "chris.jpg",
        "Photorealistic square head-and-shoulders portrait of ONLY the man on the LEFT in the reference photo. Keep his exact likeness. KEEP the grey respirator / gas mask on, covering nose and mouth, same as the reference. Safety goggles may rest on his forehead. Bald / closely shaved head. Looking at camera. Navy blue studio backdrop. Chest-up crop, same scale as a website profile photo. No text, no logo, no second person. Do not remove the respirator.",
    ),
    (
        "brandon.jpg",
        "Photorealistic square head-and-shoulders portrait of ONLY the man on the RIGHT in the reference photo. Keep his exact likeness. KEEP the dual-cartridge respirator / gas mask on, covering nose and mouth, same as the reference. White painter hood and safety goggles as in the reference. Red and black plaid shirt if visible. Looking at camera. Dark forest green studio backdrop. Chest-up crop, same scale as a website profile photo. No text, no logo, no second person. Do not remove the respirator.",
    ),
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

for name, prompt in jobs:
    print("gen", name, flush=True)
    res = fal_client.subscribe(
        "openai/gpt-image-2/edit",
        arguments={
            "prompt": prompt,
            "image_urls": [url],
            "image_size": "square_hd",
            "quality": "high",
            "num_images": 1,
            "output_format": "jpeg",
        },
        with_logs=False,
    )
    out = extract_url(res)
    if not out:
        raise SystemExit(f"no url {name} keys={list(res)[:40] if isinstance(res, dict) else type(res)}")
    dest = out_dir / name
    urllib.request.urlretrieve(out, str(dest))
    print("saved", dest.name, dest.stat().st_size, flush=True)
print("done")
