(function () {
  const KEY = "coastal-look";
  const DEFAULTS = {
    layout: "mosaic",
    theme: "light",
    font: "archivo",
    palette: "cream",
    logo: "door",
    logoVariant: "",
    nav: "pill"
  };
  const LOGOS = {
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
  const FINISHES = [
    { val: "light", label: "Light" },
    { val: "dark", label: "Dark" },
    { val: "color", label: "Color" }
  ];

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
    return LOGOS[state.logo] || LOGOS.door;
  }

  function firstVariantSrc(variants) {
    if (!variants) return "";
    const keys = Object.keys(variants);
    return keys.length ? variants[keys[0]] : "";
  }

  function autoVariantKey(meta) {
    const v = meta && meta.variants;
    if (!v) return "";
    if (state.theme === "dark" && v.dark) return "dark";
    if (v.light) return "light";
    if (v.color) return "color";
    const keys = Object.keys(v);
    return keys.length ? keys[0] : "";
  }

  function logoSrc() {
    const meta = currentMeta();
    if (meta.variants) {
      const v = meta.variants;
      if (state.logoVariant && v[state.logoVariant]) return v[state.logoVariant];
      if (state.theme === "dark" && v.dark) return v.dark;
      return v.light || v.color || firstVariantSrc(v);
    }
    if (meta.src) return meta.src;
    return LOGOS.door.src;
  }

  function thumbSrc(meta) {
    if (meta.variants) {
      const v = meta.variants;
      return v.color || v.light || v.dark || firstVariantSrc(v);
    }
    return meta.src;
  }

  function isWordmark(id, meta) {
    return !!(meta && meta.wordmark) || !!WORDMARK[id];
  }

  function apply(write) {
    const html = document.documentElement;
    html.setAttribute("data-layout", state.layout || DEFAULTS.layout);
    html.setAttribute("data-theme", state.theme || DEFAULTS.theme);
    html.setAttribute("data-font", state.font || DEFAULTS.font);
    html.setAttribute("data-palette", state.palette || DEFAULTS.palette);
    html.setAttribute("data-nav", state.nav || DEFAULTS.nav);
    const id = state.logo;
    const meta = currentMeta();
    const src = logoSrc();
    const word = isWordmark(id, meta);
    document.querySelectorAll(".mark img").forEach(function (img) {
      img.src = src;
    });
    document.querySelectorAll("a.mark").forEach(function (a) {
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
      const next = LOGOS[value] || LOGOS.door;
      if (!next.variants || !state.logoVariant || !next.variants[state.logoVariant]) {
        state.logoVariant = "";
      }
    }
    state[key] = value;
    apply(true);
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
    apply(false);
  }

  function syncActive() {
    const meta = currentMeta();
    const autoKey = autoVariantKey(meta);
    document.querySelectorAll("[data-look-key]").forEach(function (btn) {
      const key = btn.getAttribute("data-look-key");
      const val = btn.getAttribute("data-look-val");
      if (key === "logoVariant") {
        const has = !!(meta.variants && meta.variants[val]);
        btn.classList.toggle("is-disabled", !has);
        if (!has) btn.setAttribute("aria-disabled", "true");
        else btn.removeAttribute("aria-disabled");
        const chosen = state.logoVariant || autoKey;
        btn.classList.toggle("is-active", has && chosen === val && (state.logoVariant === val || (!state.logoVariant && autoKey === val)));
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
    const toggle = el("button", { type: "button", className: "look-toggle", text: "Choose a look", "aria-expanded": "true", "aria-controls": "look-panel" });
    const panel = el("div", { className: "look-panel", id: "look-panel" });
    const head = el("div", { className: "look-head" }, [
      el("div", { className: "look-title", text: "Look" }),
      el("button", { type: "button", className: "look-close", text: "Close", "aria-label": "Close look picker" })
    ]);

    panel.appendChild(head);
    panel.appendChild(section("Logos", LOGO_ORDER.map(logoChip)));
    panel.appendChild(section("Logo finish", FINISHES.map(function (f) {
      return chip("logoVariant", f.val, f.label);
    })));
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

    const buy = el("a", {
      className: "look-buy",
      href: "contact.html",
      text: "Buy this site · $2,500"
    });
    const note = el("p", {
      className: "look-buy-note",
      text: "Site Sprint. Chris and Brandon keep the look you pick."
    });
    panel.appendChild(buy);
    panel.appendChild(note);

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
    open();
  }

  apply(false);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
