# Coastal Lighthouse full lockup — Builder handoff (2026-09-15)

Joshua override: keep **their** full mark with readable baked lettering (not icon-only + HTML title).

## Assets (drop into `assets/logo-opts/`)
- `lighthouse-light.png` — teal brush-script lockup (for light theme / cream pill)
- `lighthouse-dark.png` — cream brush-script lockup (for dark theme)
- Keep `fb-lighthouse.png` as picker thumb (or point thumb at light)

Archive prior icon-only cuts as `lighthouse-icon-light.png` / `lighthouse-icon-dark.png` in `_raw/` if needed.

## Wire (`picker.js`)
```js
lighthouse: {
  label: "Lighthouse",
  wordmark: true,  // hide HTML title — baked text is the wordmark
  thumb: "assets/logo-opts/fb-lighthouse.png",
  variants: {
    light: "assets/logo-opts/lighthouse-light.png",
    dark: "assets/logo-opts/lighthouse-dark.png"
  }
}
```

## Size (taller/wider treatment — not another mushy CSS bump of FB)
Stacked 3-line brush lockup is ~square-ish. Target:
- `.mark.mark-wordmark img` for Lighthouse: **64px** desktop / **56px** mobile (above global 52/44 if needed via family class)
- `max-width`: **11–13rem** (lockup is compact width at that height)
- Pill pad stays **0.65rem**
- Do **not** force HTML title when wordmark:true

## Out of scope
- Do not reintroduce "Jupiter, Florida" in nav asset
- Default logo stays Box unless Joshua says otherwise
