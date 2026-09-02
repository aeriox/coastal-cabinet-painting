(function () {
  const KEY = "coastal-look";
  const DEFAULTS = {
    layout: "mosaic",
    theme: "light",
    font: "archivo",
    palette: "cream",
    logo: "door"
  };
  const LOGOS = {
    door: { src: "assets/mark.svg", label: "Door" },
    panel: { src: "assets/logo-opts/opt-1.png", label: "Panel" },
    wave: { src: "assets/logo-opts/opt-2.png", label: "Wave" },
    ccp: { src: "assets/logo-opts/opt-3.png", label: "CCP" }
  };

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
        logo: state.logo
      }));
    } catch (e) {}
  }

  function apply(write) {
    const html = document.documentElement;
    html.setAttribute("data-layout", state.layout || DEFAULTS.layout);
    html.setAttribute("data-theme", state.theme || DEFAULTS.theme);
    html.setAttribute("data-font", state.font || DEFAULTS.font);
    html.setAttribute("data-palette", state.palette || DEFAULTS.palette);
    const src = (LOGOS[state.logo] || LOGOS.door).src;
    document.querySelectorAll(".mark img").forEach(function (img) {
      img.src = src;
    });
    if (write) persist();
    syncActive();
  }

  function set(key, value) {
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
    apply(false);
  }

  function syncActive() {
    document.querySelectorAll("[data-look-key]").forEach(function (btn) {
      const key = btn.getAttribute("data-look-key");
      const val = btn.getAttribute("data-look-val");
      btn.classList.toggle("is-active", state[key] === val);
    });
  }

  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "className") n.className = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
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
    const b = el("button", {
      type: "button",
      className: "look-logo",
      "data-look-key": "logo",
      "data-look-val": id,
      title: meta.label
    });
    const img = el("img", { src: meta.src, alt: meta.label });
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
    const toggle = el("button", { type: "button", className: "look-toggle", text: "Look", "aria-expanded": "false", "aria-controls": "look-panel" });
    const panel = el("div", { className: "look-panel", id: "look-panel", hidden: "hidden" });
    const head = el("div", { className: "look-head" }, [
      el("div", { className: "look-title", text: "Look" }),
      el("button", { type: "button", className: "look-close", text: "Close", "aria-label": "Close look picker" })
    ]);

    panel.appendChild(head);
    panel.appendChild(section("Logos", [
      logoChip("door"), logoChip("panel"), logoChip("wave"), logoChip("ccp")
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
    }
    function close() {
      panel.setAttribute("hidden", "hidden");
      root.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
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
  }

  apply(false);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
