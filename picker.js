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
     Joshua (2026-10-01): a pick has to restyle the page wherever he is scrolled to. Nothing here scrolls
     on a pick, but a layout, preset, type or logo pick changes heights above and around the screen, and
     browsers keep the place their own way (Chrome's anchor slips when the layout changes, Safari keeps
     none). So the reader's line, just under the site's header, holds still while the new look, its fonts and
     its logo settle. The line sits under the pinned nav, the floating pill included. What sits on that line
     keeps its place on screen: its top, or, in text that starts above the screen, the character on the line
     (so a paragraph that a new face rewraps stays put where it is being read, not at a top far out of sight).
     When that content starts above the line inside a block that is mostly above it and ends in the top third
     of the screen (the tail of a long quote, a hero or a tall photo mostly above the screen), the outermost
     such block keeps its bottom instead, so what fills most of the screen, below it, stays. When the new look
     hides any of them, the nearest box around it stands in. Places are read as laid out, before any
     transform: the hero's copy replaying its entrance, a hover zoom or a parallax moves what is drawn, not
     the page, so the hold never chases an animation. It is put back every frame and whenever the page
     resizes (a ResizeObserver, so a late change from another script can't show for a frame). The browser's
     own scroll anchoring and smooth scrolling are off for the hold, and a wheel, touch, press or key
     outside the panel lets go at once. (The same hold as the AERIOX offer engine, aeriox-app#110.) */
  var held = null, range = null;
  var INTENT = ["wheel", "touchstart", "pointerdown", "keydown"];
  /* Content a reader sees: text, or a picture, a video or a form field. */
  var REPLACED = /^(img|video|canvas|svg|iframe|input|textarea|select|object|embed)$/i;
  function scrollTopNow() { return window.scrollY || window.pageYOffset || 0; }
  function scrollToY(y) {
    var x = window.scrollX || window.pageXOffset || 0;
    try { window.scrollTo({ top: y, left: x, behavior: "instant" }); } catch (e) { window.scrollTo(x, y); }
  }
  function pinned(node) {
    for (var p = node; p && p !== document.body; p = p.parentElement) {
      var pos = getComputedStyle(p).position;
      if (pos === "fixed" || pos === "sticky") return true;
    }
    return false;
  }
  function isPanel(node) { return node.id === "look-picker"; }
  /* How a box's own transform (with the translate and scale properties) moves what it draws down the
     screen: y -> scale * y + shift, y measured from the box's top; null when it moves nothing. A rotation,
     rare in a reveal, is left out. */
  function moveOf(el, cs) {
    var t = cs.transform, tr = cs.translate || "", sc = cs.scale || "";
    var hasT = !!t && t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)";
    var hasTr = tr !== "" && tr !== "none" && !/^(\s*0(px|%)?)+\s*$/.test(tr);
    var hasSc = sc !== "" && sc !== "none" && !/^(\s*1)+\s*$/.test(sc);
    if (!hasT && !hasTr && !hasSc) return null;
    var d = 1, f = 0, ty = 0, sy = 1, v, p;
    if (hasT) {
      v = t.slice(t.indexOf("(") + 1, -1).split(",").map(parseFloat);
      if (v.length === 6) { d = v[3]; f = v[5]; } else if (v.length === 16) { d = v[5]; f = v[13]; }
    }
    if (hasTr) {
      p = tr.trim().split(/\s+/)[1] || "0";
      ty = /%$/.test(p) ? parseFloat(p) / 100 * (el.offsetHeight || 0) : parseFloat(p) || 0;
    }
    if (hasSc) {
      p = sc.trim().split(/\s+/);
      v = p[1] || p[0];
      sy = /%$/.test(v) ? parseFloat(v) / 100 : parseFloat(v);
      if (!isFinite(sy)) sy = 1;
    }
    var k = sy * d;
    if (!isFinite(k) || Math.abs(k) < .01 || !isFinite(f) || !isFinite(ty)) return null;
    var oy = parseFloat((cs.transformOrigin || "").split(" ")[1]) || 0;
    return [k, oy * (1 - k) + ty + sy * f];
  }
  /* Where a point of el that is at y on screen now sits as laid out, with every transform on el and the
     boxes around it taken off. */
  function laidOut(el, y) {
    var chain = [], c = 0, m = 1;   /* laid out = c + m * on screen */
    for (var n = el; n && n !== document.documentElement; n = n.parentElement) chain.push(n);
    for (var i = chain.length - 1; i >= 0; i--) {
      var mv = moveOf(chain[i], getComputedStyle(chain[i]));
      if (!mv) continue;
      var at = c + m * chain[i].getBoundingClientRect().top;
      c = at - mv[1] + (c - at) / mv[0];
      m = m / mv[0];
    }
    return c + m * y;
  }
  /* The box of one character of a text (null when it draws nothing). */
  function charBox(text, at) {
    if (!range) range = document.createRange();
    range.setStart(text, at);
    range.setEnd(text, at + 1);
    var b = range.getBoundingClientRect();
    return b.height ? b : null;
  }
  /* The first character of el's own text on the reader's line, or after it. */
  function lineChar(el, y) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== 3) continue;
      var s = n.data, idx = [];
      for (var i = 0; i < s.length && idx.length < 20000; i++) {
        var c = s.charCodeAt(i);
        if (c > 32 && (c < 0xd800 || c > 0xdfff)) idx.push(i);
      }
      var lo = 0, hi = idx.length;
      while (lo < hi) {
        var mid = (lo + hi) >> 1, b = charBox(n, idx[mid]);
        if (b && b.bottom > y) hi = mid; else lo = mid + 1;
      }
      if (lo < idx.length && charBox(n, idx[lo])) return { text: n, at: idx[lo] };
    }
    return null;
  }
  /* The bottom of the site's header while it stays on screen: a fixed or sticky header or nav whose top is
     near the top of the screen (the floating pill nav sits a little below the edge). */
  function headerBottom() {
    var band = Math.max(48, innerHeight * .1), bottom = 0;
    document.querySelectorAll("header, nav, [role=banner]").forEach(function (h) {
      if (h.closest("#look-picker") || !pinned(h)) return;
      var cs = getComputedStyle(h);
      if (cs.visibility === "hidden" || parseFloat(cs.opacity) < .1) return;
      var r = h.getBoundingClientRect();
      if (r.top <= band && r.bottom > 0 && r.bottom < innerHeight * .4) bottom = Math.max(bottom, r.bottom);
    });
    return bottom;
  }
  /* The reader's place on the line: the smallest text the line runs through, else text starting just under
     it, else the smallest picture it runs through, else the first text or picture below it on screen. A tall
     photo of which only a sliver still shows under the header doesn't count: the one filling the screen below
     it stays put instead. Walked down from <body> past fixed and sticky boxes (not hit-tested: the panel can
     sit over the line). */
  function contentAt(y) {
    var ih = innerHeight, iw = innerWidth, budget = 8000;
    var text = null, textH = Infinity, pic = null, picH = Infinity, below = null, belowTop = Infinity, next = null, nextTop = Infinity;
    if (!range) range = document.createRange();
    function take(el, t, b, isText) {
      /* on the line, and more of it showing under the header than a sliver on its way out (half of it, or 24 px) */
      if (t <= y && b > y && b - (y - 8) >= Math.min((b - t) / 2, 24)) {
        if (isText && b - t < textH) { text = el; textH = b - t; }
        if (!isText && b - t < picH) { pic = el; picH = b - t; }
      } else if (t > y && t < ih) {
        if (t < belowTop) { below = el; belowTop = t; }
        if (isText && t <= y + 24 && t < nextTop) { next = el; nextTop = t; }
      }
    }
    /* where an element's own text sits (a box can hold its text far from its edges) */
    function textBox(el) {
      var t = Infinity, b = -Infinity;
      for (var n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType !== 3 || !/\S/.test(n.nodeValue || "")) continue;
        range.selectNodeContents(n);
        var r = range.getBoundingClientRect();
        if (r.height) { t = Math.min(t, r.top); b = Math.max(b, r.bottom); }
      }
      return t < b ? [t, b] : null;
    }
    (function walk(node) {
      for (var k = node.firstElementChild; k && budget-- > 0; k = k.nextElementSibling) {
        if (isPanel(k)) continue;
        var cs = getComputedStyle(k);
        if (cs.display === "none") continue;
        if (cs.display === "contents") { walk(k); continue; }
        if (cs.position === "fixed" || cs.position === "sticky") continue;
        var r = k.getBoundingClientRect();
        if (r.height > 0 && (r.bottom <= y || r.top >= ih)) continue;
        var seen = r.width > 0 && r.height > 0 && r.right > 0 && r.left < iw;
        var replaced = REPLACED.test(k.tagName);
        if (seen && replaced) take(k, r.top, r.bottom, false);
        else if (seen) { var tb = textBox(k); if (tb) take(k, tb[0], tb[1], true); }
        if (!replaced) walk(k);
      }
    })(document.body);
    /* Text just under the line beats the photo across it only when it sits beside the photo (another column); a
       caption on the photo, or text under it in the same column, goes with the photo. */
    if (next && pic) {
      var a = pic.getBoundingClientRect(), b = next.getBoundingClientRect();
      if (pic.contains(next) || (b.left < a.right && b.right > a.left)) next = null;
    }
    return text || next || pic || below;
  }
  /* Fallback: the deepest box across the line that is not fixed or sticky. */
  function lineAt(y) {
    var node = document.body, found = null;
    for (;;) {
      var kids = Array.prototype.slice.call(node.children), next = null;
      for (var i = 0; i < kids.length && !next; i++) {
        var k = kids[i], r = k.getBoundingClientRect();
        if (isPanel(k)) continue;
        if (!r.height && !r.width) {
          if (getComputedStyle(k).display === "contents") kids.splice.apply(kids, [i + 1, 0].concat(Array.prototype.slice.call(k.children)));
          continue;
        }
        var pos = getComputedStyle(k).position;
        if (r.top <= y && r.bottom > y && pos !== "fixed" && pos !== "sticky") next = k;
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
    if (held.ro) held.ro.disconnect();
    INTENT.forEach(function (t) { window.removeEventListener(t, onIntent, true); });
    var html = document.documentElement;
    html.style.overflowAnchor = held.anchor;
    html.style.scrollBehavior = held.behavior;
    held = null;
  }
  /* Where a mark is on screen now, as laid out (null when it is gone or hidden). */
  function markTop(c) {
    var b;
    if (c.text) {
      if (!c.text.parentElement || !document.contains(c.text) || c.at >= c.text.length) return null;
      b = charBox(c.text, c.at);
      return b ? laidOut(c.text.parentElement, b.top) : null;
    }
    if (!document.contains(c.el)) return null;
    b = c.el.getBoundingClientRect();
    return b.height || b.width ? laidOut(c.el, c.bottom ? b.bottom : b.top) : null;
  }
  /* At the very top the page stays at the top. Otherwise the reader's line under the header: when the
     content on it starts above it, the bottom of the outermost block around it that is mostly above the line
     and ends in the top third of the screen; else in text its character there; then the content itself and
     each box around it (for when the new look hides it). */
  function holdPlace() {
    letGo();
    if (scrollTopNow() < 1) return;
    var top = Math.min(headerBottom(), innerHeight * .5);
    var el = contentAt(top + 8) || lineAt(top + 8);
    if (!el) return;
    var y = top + 8, elTop = el.getBoundingClientRect().top, marks = [], ends = null, ch, r;
    if (elTop < y) {
      for (var e = el; e && e !== document.body; e = e.parentElement) {
        r = e.getBoundingClientRect();
        if (r.bottom > 0 && y - r.top > r.bottom - y && r.bottom - y < (innerHeight - y) / 3) ends = e;
      }
    }
    if (ends) marks.push({ el: ends, bottom: true });
    /* text that starts above the screen: its line on the reader's line holds (its own top is out of sight) */
    else if (elTop < top - 1 && (ch = lineChar(el, y))) marks.push({ el: el, text: ch.text, at: ch.at });
    for (var n = el; n && n !== document.body; n = n.parentElement) marks.push({ el: n });
    marks = marks.filter(function (m) { m.top = markTop(m); return m.top !== null; });
    var html = document.documentElement;
    var ro = typeof ResizeObserver === "function" ? new ResizeObserver(function () { keepPlace(); }) : null;
    held = { marks: marks, raf: 0, ro: ro, anchor: html.style.overflowAnchor, behavior: html.style.scrollBehavior };
    html.style.overflowAnchor = "none";
    html.style.scrollBehavior = "auto";
    if (ro) {
      ro.observe(html);
      ro.observe(document.body);
      marks.slice(0, 24).forEach(function (m) { ro.observe(m.el); });
    }
    INTENT.forEach(function (t) { window.addEventListener(t, onIntent, { capture: true, passive: true }); });
  }
  /* The first of them still on the page keeps its place. One that rides with the screen once the look
     lands (it turned fixed or sticky: its top on screen doesn't change when the page scrolls) can't be
     held by scrolling, so the page is put back and let go. */
  function keepPlace() {
    if (!held) return;
    var m = null, top = null;
    for (var i = 0; i < held.marks.length && !m; i++) {
      top = markTop(held.marks[i]);
      if (top !== null) m = held.marks[i];
    }
    if (!m) { letGo(); return; }
    var d = top - m.top;
    if (Math.abs(d) < 1) return;
    var y = scrollTopNow();
    scrollToY(y + d);
    var after = markTop(m);
    if (Math.abs(scrollTopNow() - y) >= 1 && after !== null && Math.abs(after - top) < .5) { scrollToY(y); letGo(); }
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
