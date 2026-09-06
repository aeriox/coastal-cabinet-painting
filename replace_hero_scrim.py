#!/usr/bin/env python3
from pathlib import Path

path = Path("/Users/aeriox/worktrees/coastal-cabinet-painting/styles.css")
text = path.read_text()

old = """.hero img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}
.hero::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(22, 19, 16, 0.72) 0%, rgba(22, 19, 16, 0.08) 48%, transparent 70%);
}
.hero-copy {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 1;
  color: var(--ondark);
  padding: 0 var(--shell-px) 3.4rem;
  max-width: none;
}
.hero-copy h1 { max-width: 11ch; }
.hero-copy .lede { max-width: 36ch; }"""

new = """.hero img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  z-index: 0;
}
.hero::before {
  content: "";
  position: absolute; inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(22, 19, 16, 0.58) 0%,
    rgba(22, 19, 16, 0.34) 26%,
    rgba(22, 19, 16, 0.1) 48%,
    transparent 64%
  );
}
.hero::after {
  content: "";
  position: absolute; inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(to top, rgba(22, 19, 16, 0.72) 0%, rgba(22, 19, 16, 0.08) 48%, transparent 70%);
}
.hero-copy {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 2;
  color: var(--ondark);
  padding: 0 var(--shell-px) 3.4rem;
  max-width: none;
}
.hero-copy h1 { max-width: 11ch; }
.hero-copy .lede { max-width: 36ch; }
.hero-copy h1,
.hero-copy .lede,
.hero-copy .eyebrow {
  text-shadow: 0 2px 28px rgba(22, 19, 16, 0.55), 0 1px 8px rgba(22, 19, 16, 0.4);
}"""

if old not in text:
    raise SystemExit("OLD BLOCK NOT FOUND")
count = text.count(old)
if count != 1:
    raise SystemExit(f"expected 1 occurrence, found {count}")
path.write_text(text.replace(old, new, 1))
print("replaced hero block in", path.resolve())
