/* === Belle Martinée – Main JavaScript === */

"use strict";

// ============================================================
//  Cookie Consent
// ============================================================
const CookieConsent = (() => {
  const STORAGE_KEY = "bellemartinee_cookie_consent";
  const banner = document.getElementById("cookie-banner");

  function getPreferences() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  function savePreferences(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, timestamp: Date.now() }));
  }

  function acceptAll() {
    savePreferences({ necessary: true, analytics: true, marketing: true });
    hideBanner();
  }

  function acceptNecessary() {
    savePreferences({ necessary: true, analytics: false, marketing: false });
    hideBanner();
  }

  function hideBanner() {
    if (banner) {
      banner.classList.remove("show");
    }
  }

  function init() {
    const prefs = getPreferences();
    // Show banner if no consent has been given, or if it's older than 365 days
    const expired = prefs && prefs.timestamp && (Date.now() - prefs.timestamp) > 365 * 24 * 60 * 60 * 1000;
    if (!prefs || expired) {
      setTimeout(() => banner && banner.classList.add("show"), 800);
    }

    const btnAcceptAll = document.getElementById("cookie-accept-all");
    const btnNecessary = document.getElementById("cookie-necessary");

    if (btnAcceptAll) btnAcceptAll.addEventListener("click", acceptAll);
    if (btnNecessary) btnNecessary.addEventListener("click", acceptNecessary);
  }

  return { init, getPreferences, savePreferences };
})();

// ============================================================
//  Navigation – Scroll behaviour & Mobile drawer
// ============================================================
const Navigation = (() => {
  function init() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav__toggle");
    const mobileNav = document.getElementById("mobile-nav");
    const mobileClose = document.getElementById("mobile-nav-close");
    const overlay = document.getElementById("nav-overlay");

    // Scroll class
    if (header) {
      const onScroll = () => {
        header.classList.toggle("scrolled", window.scrollY > 50);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    // Mobile open
    if (toggle && mobileNav && overlay) {
      toggle.addEventListener("click", () => {
        mobileNav.classList.add("open");
        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
        toggle.setAttribute("aria-expanded", "true");
      });
    }

    // Mobile close
    const closeMobile = () => {
      if (mobileNav) mobileNav.classList.remove("open");
      if (overlay) overlay.classList.remove("open");
      document.body.style.overflow = "";
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    };

    if (mobileClose) mobileClose.addEventListener("click", closeMobile);
    if (overlay) overlay.addEventListener("click", closeMobile);

    // Close mobile nav on link click
    document.querySelectorAll(".mobile-nav__links a").forEach(a => {
      a.addEventListener("click", closeMobile);
    });
  }

  return { init };
})();

// ============================================================
//  Shopping Cart
// ============================================================
const Cart = (() => {
  const STORAGE_KEY = "bellemartinee_cart";
  let items = [];

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      items = saved ? JSON.parse(saved) : [];
    } catch {
      items = [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function addItem(id, name, price, emoji, variant) {
    const existing = items.find(i => i.id === id && i.variant === variant);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ id, name, price, emoji, variant, qty: 1 });
    }
    save();
    render();
    updateCount();
    Toast.show("✅ Produkten tillagd i varukorgen!");
  }

  function removeItem(id, variant) {
    items = items.filter(i => !(i.id === id && i.variant === variant));
    save();
    render();
    updateCount();
  }

  function changeQty(id, variant, delta) {
    const item = items.find(i => i.id === id && i.variant === variant);
    if (item) {
      item.qty = Math.max(1, item.qty + delta);
      save();
      render();
      updateCount();
    }
  }

  function getTotal() {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function updateCount() {
    const countEl = document.querySelector(".nav__cart-count");
    const total = items.reduce((s, i) => s + i.qty, 0);
    if (countEl) {
      countEl.textContent = total;
      countEl.style.display = total > 0 ? "flex" : "none";
    }
  }

  function render() {
    const body = document.querySelector(".cart-sidebar__body");
    const totalEl = document.querySelector(".cart-total span:last-child");
    if (!body) return;

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <span class="cart-empty-icon">🛍️</span>
          <p>Din varukorg är tom</p>
          <a href="#produkter" class="btn btn--primary btn--sm" onclick="Cart.closeSidebar()">Se produkter</a>
        </div>`;
    } else {
      body.innerHTML = items.map(item => `
        <div class="cart-item">
          <div class="cart-item__image" style="background:var(--color-light)">${item.emoji}</div>
          <div class="cart-item__details">
            <div class="cart-item__name">${escapeHtml(item.name)}</div>
            <div class="cart-item__variant">${escapeHtml(item.variant)}</div>
            <div class="cart-item__qty">
              <button class="qty-btn" onclick="Cart.changeQty('${escapeHtml(item.id)}','${escapeHtml(item.variant)}',-1)" aria-label="Minska antal">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="Cart.changeQty('${escapeHtml(item.id)}','${escapeHtml(item.variant)}',1)" aria-label="Öka antal">+</button>
            </div>
          </div>
          <div class="cart-item__price">${formatPrice(item.price * item.qty)}</div>
          <button class="cart-item__remove" onclick="Cart.removeItem('${escapeHtml(item.id)}','${escapeHtml(item.variant)}')" aria-label="Ta bort produkt">✕</button>
        </div>
      `).join("");
    }

    if (totalEl) {
      totalEl.textContent = formatPrice(getTotal());
    }
  }

  function openSidebar() {
    const sidebar = document.getElementById("cart-sidebar");
    const overlay = document.getElementById("cart-overlay");
    if (sidebar) sidebar.classList.add("open");
    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    const sidebar = document.getElementById("cart-sidebar");
    const overlay = document.getElementById("cart-overlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function init() {
    load();
    render();
    updateCount();

    const cartBtn = document.querySelector(".nav__cart");
    if (cartBtn) cartBtn.addEventListener("click", openSidebar);

    const cartClose = document.getElementById("cart-close");
    if (cartClose) cartClose.addEventListener("click", closeSidebar);

    const cartOverlay = document.getElementById("cart-overlay");
    if (cartOverlay) cartOverlay.addEventListener("click", closeSidebar);
  }

  return { init, addItem, removeItem, changeQty, openSidebar, closeSidebar };
})();

// ============================================================
//  Toast Notification
// ============================================================
const Toast = (() => {
  let timer = null;

  function show(message, duration = 3000) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.querySelector(".toast-message").textContent = message;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("show"), duration);
  }

  return { show };
})();

// ============================================================
//  Intersection Observer – Fade-in
// ============================================================
function initFadeIn() {
  const elements = document.querySelectorAll(".fade-in");
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

// ============================================================
//  Product "Add to Cart" Buttons
// ============================================================
function initProductButtons() {
  document.querySelectorAll("[data-add-cart]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.productId;
      const name = btn.dataset.productName;
      const price = parseFloat(btn.dataset.productPrice);
      const emoji = btn.dataset.productEmoji;
      const variant = btn.dataset.productVariant || "Standard";
      Cart.addItem(id, name, price, emoji, variant);
    });
  });
}

// ============================================================
//  Customizer Demo Interactions
// ============================================================
function initCustomizerDemo() {
  const colorDots = document.querySelectorAll(".color-dot");
  const sizeBtns = document.querySelectorAll(".size-btn");
  const demoIcon = document.querySelector(".demo-product__icon");
  const productColors = {
    "#667eea": "👕",
    "#f5576c": "👗",
    "#00f2fe": "🧢",
    "#2d2d2d": "👖",
    "#c9a84c": "🎽",
  };

  colorDots.forEach(dot => {
    dot.addEventListener("click", () => {
      colorDots.forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
      const color = dot.dataset.color;
      const parent = dot.closest(".customize__demo");
      if (parent) {
        const demo = parent.querySelector(".demo-product");
        if (demo) demo.style.background = color;
      }
      if (demoIcon && productColors[color]) demoIcon.textContent = productColors[color];
    });
  });

  sizeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sizeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// ============================================================
//  Newsletter Form
// ============================================================
function initNewsletter() {
  const form = document.getElementById("newsletter-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector(".newsletter__input");
    const email = input ? input.value.trim() : "";
    if (!email) return;
    Toast.show("📧 Tack! Du är nu anmäld till vårt nyhetsbrev.");
    form.reset();
  });
}

// ============================================================
//  Contact Form
// ============================================================
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    Toast.show("✉️ Ditt meddelande har skickats. Vi återkommer snart!");
    form.reset();
  });
}

// ============================================================
//  Cookie Preferences Page
// ============================================================
function initCookiePreferencesForm() {
  const form = document.getElementById("cookie-preferences-form");
  if (!form) return;

  const prefs = CookieConsent.getPreferences() || { necessary: true, analytics: false, marketing: false };
  const analyticsToggle = document.getElementById("toggle-analytics");
  const marketingToggle = document.getElementById("toggle-marketing");

  if (analyticsToggle) analyticsToggle.checked = prefs.analytics;
  if (marketingToggle) marketingToggle.checked = prefs.marketing;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    CookieConsent.savePreferences({
      necessary: true,
      analytics: analyticsToggle ? analyticsToggle.checked : false,
      marketing: marketingToggle ? marketingToggle.checked : false,
    });
    Toast.show("✅ Dina cookie-inställningar har sparats.");
  });
}

// ============================================================
//  Utility helpers
// ============================================================
function formatPrice(amount) {
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ============================================================
//  Init on DOM ready
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  CookieConsent.init();
  Navigation.init();
  Cart.init();
  initFadeIn();
  initProductButtons();
  initCustomizerDemo();
  initNewsletter();
  initContactForm();
  initCookiePreferencesForm();
});

// Expose Cart for inline onclick handlers
window.Cart = Cart;
