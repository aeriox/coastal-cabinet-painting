(function () {
  const KEY = "coastal-look";
  const DEFAULTS = {
    layout: "mosaic",
    theme: "light",
    font: "archivo",
    palette: "cream",
    logo: "box",
    logoVariant: "",
    nav: "pill"
  };
  const LOGOS = {
    lighthouse: { label: "Lighthouse", wordmark: true, thumb: "assets/logo-opts/fb-lighthouse.png", variants: { light: "assets/logo-opts/lighthouse-light.png", dark: "assets/logo-opts/lighthouse-dark.png" } },
    box: { label: "Box", wordmark: true, variants: { color: "assets/logo-opts/canva-box-color.png", light: "assets/logo-opts/canva-box-light.png", dark: "assets/logo-opts/canva-box-dark.png" } },
    panels: { label: "Panels", wordmark: true, variants: { light: "assets/logo-opts/canva-panels-light.png", dark: "assets/logo-opts/canva-panels-dark.png" } },
    crest: { label: "Crest", wordmark: true, variants: { light: "assets/logo-opts/canva-crest-light.png", dark: "assets/logo-opts/canva-crest-dark.png" } },
    sprayer: { label: "Sprayer", wordmark: true, variants: { light: "assets/logo-opts/canva-sprayer-dark.png", dark: "assets/logo-opts/canva-sprayer-color.png" } }
  };
  const WORDMARK = {};
  const LOGO_ORDER = ["lighthouse", "box", "panels", "crest", "sprayer"];
  const FINISHES = [];

  const state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return Object.assign({}, DEFAULTS);
      return Object.assign({}, DEFAULTS, parsed);
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        layout: state.layout,
        theme: state.theme,
        font: state.font,
        palette: state.palette,
        logo: state.logo,
        logoVariant: state.logoVariant || "",
        nav: state.nav
      }));
    } catch (e) {}
  }

  function currentMeta() {
    return LOGOS[state.logo] || LOGOS.box;
  }

  function firstVariantSrc(variants) {
    if (!variants) return "";
    const keys = Object.keys(variants);
    return keys.length ? variants[keys[0]] : "";
  }

  function autoVariantKey(meta) {
    const v = meta && meta.variants;
    if (!v) return "";
    if (state.theme === "dark") return v.dark ? "dark" : (v.light ? "light" : "");
    if (state.logo === "box" && state.logoVariant === "color" && v.color) return "color";
    if (v.light) return "light";
    if (v.color) return "color";
    const keys = Object.keys(v);
    return keys.length ? keys[0] : "";
  }

  function logoSrc() {
    const meta = currentMeta();
    if (meta.variants) {
      const v = meta.variants;
      const key = autoVariantKey(meta);
      if (key && v[key]) return v[key];
      return v.light || v.dark || v.color || firstVariantSrc(v);
    }
    if (meta.src) return meta.src;
    const fallback = LOGOS.box; return fallback.variants[autoVariantKey(fallback)] || firstVariantSrc(fallback.variants);
  }

  function thumbSrc(meta) {
    if (meta.thumb) return meta.thumb;
    if (meta.variants) {
      const v = meta.variants;
      return v.color || v.light || v.dark || firstVariantSrc(v);
    }
    return meta.src;
  }

  function isWordmark(id, meta) {
    return !!(meta && meta.wordmark) || !!WORDMARK[id];
  }

  /* ---------------- a pick restyles the page where the visitor is ----------------
     Joshua (2026-10-01): a pick has to restyle the page wherever he is scrolled to. A layout, preset,
     type or logo pick changes heights above and around the screen, and browsers keep the place their
     own way (Safari not at all), so the reading line, a third of the way down the screen under the
     site's header, holds still while the new look, its fonts and its logo settle: the deepest steady
     element across that line (not fixed, sticky or moved by a transform, which would chase the scroll)
     keeps the same part of itself on the line, however much it grows or shrinks, with the browser's own
     scroll anchoring and smooth scrolling off for the hold. A wheel, touch, press or key outside the
     panel lets go at once. */
  var held = null;
  var INTENT = ["wheel", "touchstart", "pointerdown", "keydown"];
  function scrollTopNow() { return window.scrollY || window.pageYOffset || 0; }
  function scrollToY(y) {
    var x = window.scrollX || window.pageXOffset || 0;
    try { window.scrollTo({ top: y, left: x, behavior: "instant" }); } catch (e) { window.scrollTo(x, y); }
  }
  function steady(node) {
    var cs = getComputedStyle(node);
    return cs.position !== "fixed" && cs.position !== "sticky" && (cs.transform === "none" || cs.transform === "matrix(1, 0, 0, 1, 0, 0)");
  }
  function pinned(node) {
    for (var p = node; p && p !== document.body; p = p.parentElement) {
      var pos = getComputedStyle(p).position;
      if (pos === "fixed" || pos === "sticky") return true;
    }
    return false;
  }
  /* The bottom of the site's header when it stays on screen (fixed or sticky at the top). */
  function headerBottom() {
    var bottom = 0;
    document.querySelectorAll("header, nav, [role=banner]").forEach(function (h) {
      if (h.closest("#look-picker") || !pinned(h)) return;
      var r = h.getBoundingClientRect();
      if (r.top <= 1 && r.bottom > 0 && r.bottom < innerHeight * .4) bottom = Math.max(bottom, r.bottom);
    });
    return bottom;
  }
  /* Walked down from <body>, not hit-tested: the panel can sit over the line. */
  function lineAt(y) {
    var node = document.body, found = null;
    for (;;) {
      var kids = Array.prototype.slice.call(node.children), next = null;
      for (var i = 0; i < kids.length && !next; i++) {
        var k = kids[i], r = k.getBoundingClientRect();
        if (!r.height && !r.width) {
          if (getComputedStyle(k).display === "contents") kids.splice.apply(kids, [i + 1, 0].concat(Array.prototype.slice.call(k.children)));
          continue;
        }
        if (r.top <= y && r.bottom > y && steady(k)) next = k;
      }
      if (!next) return found;
      found = node = next;
    }
  }
  function onIntent(e) {
    var picker = document.getElementById("look-picker");
    if (!(picker && e.target && e.target.nodeType === 1 && picker.contains(e.target))) letGo();
  }
  function letGo() {
    if (!held) return;
    cancelAnimationFrame(held.raf);
    INTENT.forEach(function (t) { window.removeEventListener(t, onIntent, true); });
    var html = document.documentElement;
    html.style.overflowAnchor = held.anchor;
    html.style.scrollBehavior = held.behavior;
    held = null;
  }
  /* At the very top the page stays at the top. Otherwise the element across the reading line and each
     box around it remember where the line crosses them; the deepest one still on the page keeps that. */
  function holdPlace() {
    letGo();
    if (scrollTopNow() < 1) return;
    var top = Math.min(headerBottom(), innerHeight * .5), line = top + (innerHeight - top) * .3;
    var chain = [];
    for (var n = lineAt(line); n && n !== document.body; n = n.parentElement) {
      var r = n.getBoundingClientRect();
      chain.push({ el: n, at: r.height ? (line - r.top) / r.height : 0 });
    }
    if (!chain.length) return;
    var html = document.documentElement;
    held = { chain: chain, line: line, raf: 0, anchor: html.style.overflowAnchor, behavior: html.style.scrollBehavior };
    html.style.overflowAnchor = "none";
    html.style.scrollBehavior = "auto";
    INTENT.forEach(function (t) { window.addEventListener(t, onIntent, { capture: true, passive: true }); });
  }
  function keepPlace() {
    if (!held) return;
    for (var i = 0; i < held.chain.length; i++) {
      var c = held.chain[i];
      if (!document.contains(c.el)) continue;
      var r = c.el.getBoundingClientRect();
      if (!r.height && !r.width) continue;
      var d = r.top - (held.line - c.at * r.height);
      if (Math.abs(d) >= 1) scrollToY(scrollTopNow() + d);
      return;
    }
    letGo();
  }
  /* Held for 1.2 s at least, and until the fonts and the new logo are in (4 s at most). */
  function settle() {
    var h = held;
    if (!h) return;
    keepPlace();   /* before the fonts are read: this layout is what starts a new face loading */
    var start = Date.now(), done = false, loads = [];
    document.querySelectorAll(".mark img").forEach(function (img) {
      if (!img.complete) loads.push(new Promise(function (r) { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); }));
    });
    if (document.fonts && document.fonts.ready) loads.push(document.fonts.ready);
    Promise.race([Promise.all(loads), new Promise(function (r) { setTimeout(r, 4000); })])
      .then(function () { return new Promise(function (r) { setTimeout(r, 300); }); })
      .then(function () { done = true; });
    function tick() {
      if (held !== h) return;
      keepPlace();
      if (held !== h) return;
      if (done && Date.now() - start >= 1200) { letGo(); return; }
      h.raf = requestAnimationFrame(tick);
    }
    h.raf = requestAnimationFrame(tick);
  }
  /* A pick from the panel: restyle, holding the visitor's place. */
  function restyle(write) {
    holdPlace();
    apply(write);
    settle();
  }

  function apply(write) {
    const html = document.documentElement;
    html.setAttribute("data-layout", state.layout || DEFAULTS.layout);
    html.setAttribute("data-theme", state.theme || DEFAULTS.theme);
    html.setAttribute("data-font", state.font || DEFAULTS.font);
    html.setAttribute("data-palette", state.palette || DEFAULTS.palette);
    html.setAttribute("data-nav", state.nav || DEFAULTS.nav);
    html.setAttribute("data-logo", state.logo || DEFAULTS.logo);
    const id = state.logo;
    const meta = currentMeta();
    const src = logoSrc();
    const word = isWordmark(id, meta);
    document.querySelectorAll(".mark img").forEach(function (img) {
      img.src = src;
    });
    document.querySelectorAll("a.mark").forEach(function (a) {
      a.className = a.className.replace(/\bmark-logo-\S+/g, "").replace(/\s+/g, " ").trim();
      a.classList.add("mark-logo-" + id);
      if (word) a.classList.add("mark-wordmark");
      else a.classList.remove("mark-wordmark");
      for (var i = 0; i < a.childNodes.length; i++) {
        var node = a.childNodes[i];
        if (node.nodeType === 3 && node.textContent.trim()) {
          node.textContent = "Coastal Cabinet Painting";
        }
      }
    });
    if (write) persist();
    syncActive();
  }

  function set(key, value) {
    if (key === "logo") {
      if (value !== "box") state.logoVariant = "";
    }
    if (key === "theme" && value === "dark" && state.logoVariant === "color") {
      state.logoVariant = "";
    }
    if (key === "logoVariant" && state.logoVariant === value) {
      state.logoVariant = "";
      restyle(true);
      return;
    }
    state[key] = value;
    restyle(true);
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    state.layout = DEFAULTS.layout;
    state.theme = DEFAULTS.theme;
    state.font = DEFAULTS.font;
    state.palette = DEFAULTS.palette;
    state.logo = DEFAULTS.logo;
    state.logoVariant = "";
    state.nav = DEFAULTS.nav;
    restyle(false);
  }

  function syncActive() {
    const colorRow = document.getElementById("look-box-color");
    if (colorRow) {
      const show = state.logo === "box" && state.theme !== "dark";
      if (show) colorRow.removeAttribute("hidden");
      else colorRow.setAttribute("hidden", "hidden");
    }
    document.querySelectorAll("[data-look-key]").forEach(function (btn) {
      const key = btn.getAttribute("data-look-key");
      const val = btn.getAttribute("data-look-val");
      if (key === "logoVariant") {
        btn.classList.toggle("is-active", state.logo === "box" && state.theme !== "dark" && state.logoVariant === "color");
        return;
      }
      btn.classList.toggle("is-active", state[key] === val);
    });
  }

  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "className") n.className = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function chip(key, val, label) {
    const b = el("button", {
      type: "button",
      className: "look-chip",
      "data-look-key": key,
      "data-look-val": val,
      text: label
    });
    b.addEventListener("click", function () { set(key, val); });
    return b;
  }

  function logoChip(id) {
    const meta = LOGOS[id];
    const src = thumbSrc(meta);
    const usesDark = !!(meta.variants && src === meta.variants.dark);
    const b = el("button", {
      type: "button",
      className: "look-logo" + (usesDark ? " look-logo-on-dark is-on-dark" : ""),
      "data-look-key": "logo",
      "data-look-val": id,
      title: meta.label
    });
    const img = el("img", { src: src, alt: meta.label });
    b.appendChild(img);
    b.appendChild(el("span", { text: meta.label }));
    b.addEventListener("click", function () { set("logo", id); });
    return b;
  }

  function section(label, kids) {
    return el("div", { className: "look-section" }, [
      el("div", { className: "look-label", text: label }),
      el("div", { className: "look-row" }, kids)
    ]);
  }

  function build() {
    const root = el("div", { className: "look-picker", id: "look-picker" });
    const toggle = el("button", { type: "button", className: "look-toggle", text: "Choose a look", "aria-expanded": "false", "aria-controls": "look-panel" });
    const panel = el("div", { className: "look-panel", id: "look-panel" });
    const head = el("div", { className: "look-head" }, [
      el("div", { className: "look-title", text: "Look" }),
      el("button", { type: "button", className: "look-close", text: "Close", "aria-label": "Close look picker" })
    ]);

    panel.appendChild(head);
    panel.appendChild(section("Logos", LOGO_ORDER.map(logoChip)));
    const colorSec = section("Box", [chip("logoVariant", "color", "Color")]);
    colorSec.id = "look-box-color";
    panel.appendChild(colorSec);
    panel.appendChild(section("Header", [
      chip("nav", "pill", "Pill"),
      chip("nav", "bar", "Full width")
    ]));
    panel.appendChild(section("Theme", [
      chip("theme", "light", "Light"),
      chip("theme", "dark", "Dark")
    ]));
    panel.appendChild(section("Layout", [
      chip("layout", "mosaic", "Mosaic"),
      chip("layout", "editorial", "Editorial"),
      chip("layout", "magazine", "Magazine"),
      chip("layout", "minimalist", "Minimalist")
    ]));
    panel.appendChild(section("Type", [
      chip("font", "archivo", "Archivo"),
      chip("font", "fraunces", "Fraunces"),
      chip("font", "syne", "Syne"),
      chip("font", "newsreader", "Newsreader")
    ]));
    panel.appendChild(section("Palette", [
      chip("palette", "cream", "Cream"),
      chip("palette", "harbor", "Harbor"),
      chip("palette", "gulf", "Gulf"),
      chip("palette", "dune", "Dune")
    ]));

    const resetBtn = el("button", { type: "button", className: "look-reset", text: "Reset to current" });
    resetBtn.addEventListener("click", reset);
    panel.appendChild(resetBtn);


    function open() {
      panel.removeAttribute("hidden");
      root.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "Choose a look";
    }
    function close() {
      panel.setAttribute("hidden", "hidden");
      root.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Choose a look";
    }
    toggle.addEventListener("click", function () {
      if (root.classList.contains("is-open")) close();
      else open();
    });
    panel.querySelector(".look-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    root.appendChild(panel);
    root.appendChild(toggle);
    document.body.appendChild(root);
    syncActive();
    close();
  }

  apply(false);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
