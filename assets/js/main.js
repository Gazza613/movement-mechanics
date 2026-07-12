/* ==========================================================================
   MOVEMENT MECHANICS - main.js
   ========================================================================== */

/* ---- CONFIG ---- */
window.MM_CONFIG = {
  whatsappNumber: "27728232784", // 072 823 2784
  phoneDisplay: "072 823 2784",
  phoneHref: "tel:+27728232784",
  contactEmail: "movementmechanics.sa@gmail.com"
};

document.addEventListener("DOMContentLoaded", function () {
  initPreloader();
  initHeader();
  initNav();
  initReveal();
  initCounters();
  initWhatsApp();
  initYear();
  initPhoneLinks();
  initTabs();
  initCarousel();
  initLightbox();
  initTilt();
  initContactForm();
  initScrollProgress();
  initCustomCursor();
  initMagnetic();
  initHeroSpotlight();
  initHeroReveal();
});

/* ---------------- Preloader (home page only, once per browser session) ---------------- */
function initPreloader() {
  var pre = document.getElementById("preloader");
  if (!pre) return;

  var alreadySeen = sessionStorage.getItem("mm_intro_seen");
  if (alreadySeen) {
    pre.remove();
    return;
  }

  sessionStorage.setItem("mm_intro_seen", "1");
  document.body.style.overflow = "hidden";

  var totalDuration = 2600;
  setTimeout(function () {
    pre.classList.add("hide");
    document.body.style.overflow = "";
    setTimeout(function () { pre.remove(); }, 750);
  }, totalDuration);
}

/* ---------------- Header shrink + mobile nav ---------------- */
function initHeader() {
  var header = document.querySelector(".site-header");
  if (!header) return;
  function onScroll() {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initNav() {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () {
    toggle.classList.toggle("open");
    links.classList.toggle("open");
  });
  links.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      toggle.classList.remove("open");
      links.classList.remove("open");
    });
  });
}

/* ---------------- Scroll reveal ---------------- */
function initReveal() {
  var items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(function (i) { obs.observe(i); });
}

/* ---------------- Count-up stats (also used by dashboard preview) ---------------- */
function initCounters() {
  var nums = document.querySelectorAll("[data-count]");
  if (!nums.length) return;
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      animateCount(e.target);
    });
  }, { threshold: 0.4 });
  nums.forEach(function (n) { obs.observe(n); });
}

function animateCount(el) {
  var target = parseFloat(el.getAttribute("data-count"));
  var suffix = el.getAttribute("data-suffix") || "";
  var duration = 1400;
  var start = null;
  function step(ts) {
    if (!start) start = ts;
    var progress = Math.min((ts - start) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var val = Math.floor(eased * target);
    el.textContent = val + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}

/* ---------------- WhatsApp floating button ---------------- */
function initWhatsApp() {
  var btn = document.querySelector(".wa-float");
  if (!btn) return;
  var num = window.MM_CONFIG && window.MM_CONFIG.whatsappNumber;
  if (num) {
    btn.href = "https://wa.me/" + num + "?text=" + encodeURIComponent("Hi Movement Mechanics, I'd like to find out more about your programmes.");
    btn.classList.add("show");
  }
}

/* ---------------- Phone links (header / footer "Call Now") ---------------- */
function initPhoneLinks() {
  var cfg = window.MM_CONFIG || {};
  document.querySelectorAll("[data-phone-text]").forEach(function (el) {
    el.textContent = cfg.phoneDisplay || "";
  });
  document.querySelectorAll("[data-phone-href]").forEach(function (el) {
    el.setAttribute("href", cfg.phoneHref || "#");
  });
}

/* ---------------- Footer year ---------------- */
function initYear() {
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
}

/* ---------------- Tabs (Programs page: Private / Group / House Calls / Schools) ---------------- */
function initTabs() {
  var groups = document.querySelectorAll("[data-tabs]");
  groups.forEach(function (group) {
    var btns = group.querySelectorAll("[data-tab-btn]");
    var panels = group.querySelectorAll("[data-tab-panel]");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-tab-btn");
        btns.forEach(function (b) { b.classList.remove("active"); });
        panels.forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active");
        var panel = group.querySelector('[data-tab-panel="' + target + '"]');
        if (panel) panel.classList.add("active");
      });
    });
  });
}

/* ---------------- Testimonial carousel ---------------- */
function initCarousel() {
  var root = document.querySelector("[data-carousel]");
  if (!root) return;
  var track = root.querySelector("[data-carousel-track]");
  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-slide]"));
  var dotsWrap = root.querySelector("[data-carousel-dots]");
  var prev = root.querySelector("[data-carousel-prev]");
  var next = root.querySelector("[data-carousel-next]");
  if (!slides.length) return;

  var index = 0;
  var dots = [];

  slides.forEach(function (_, i) {
    var d = document.createElement("button");
    d.className = "carousel-dot" + (i === 0 ? " active" : "");
    d.setAttribute("aria-label", "Go to testimonial " + (i + 1));
    d.addEventListener("click", function () { goTo(i); });
    dotsWrap.appendChild(d);
    dots.push(d);
  });

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = "translateX(-" + (index * 100) + "%)";
    dots.forEach(function (d, di) { d.classList.toggle("active", di === index); });
  }

  if (prev) prev.addEventListener("click", function () { goTo(index - 1); resetAuto(); });
  if (next) next.addEventListener("click", function () { goTo(index + 1); resetAuto(); });

  var auto = setInterval(function () { goTo(index + 1); }, 6000);
  function resetAuto() { clearInterval(auto); auto = setInterval(function () { goTo(index + 1); }, 6000); }

  goTo(0);
}

/* ---------------- Gallery lightbox ---------------- */
function initLightbox() {
  var items = document.querySelectorAll("[data-lightbox]");
  if (!items.length) return;

  var overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button>' +
                       '<button class="lightbox-nav prev" aria-label="Previous">&#8249;</button>' +
                       '<img class="lightbox-img" src="" alt="">' +
                       '<button class="lightbox-nav next" aria-label="Next">&#8250;</button>' +
                       '<div class="lightbox-caption"></div>';
  document.body.appendChild(overlay);

  var img = overlay.querySelector(".lightbox-img");
  var caption = overlay.querySelector(".lightbox-caption");
  var list = Array.prototype.slice.call(items);
  var current = 0;

  function open(i) {
    current = i;
    var el = list[current];
    img.src = el.getAttribute("data-lightbox");
    caption.textContent = el.getAttribute("data-caption") || "";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
  function step(dir) { open((current + dir + list.length) % list.length); }

  list.forEach(function (el, i) {
    el.addEventListener("click", function () { open(i); });
  });
  overlay.querySelector(".lightbox-close").addEventListener("click", close);
  overlay.querySelector(".prev").addEventListener("click", function () { step(-1); });
  overlay.querySelector(".next").addEventListener("click", function () { step(1); });
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function (e) {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
}

/* ---------------- Subtle card tilt on hover (desktop only) ---------------- */
function initTilt() {
  if (window.matchMedia("(hover: none)").matches) return;
  var cards = document.querySelectorAll("[data-tilt]");
  cards.forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = "perspective(700px) rotateX(" + (y * -6) + "deg) rotateY(" + (x * 6) + "deg) translateY(-4px)";
    });
    card.addEventListener("mouseleave", function () {
      card.style.transform = "";
    });
  });
}

/* ---------------- Contact form: success message + service pre-select via ?service= ---------------- */
function initContactForm() {
  var form = document.getElementById("inquiryForm");
  if (!form) return;
  var success = document.getElementById("formSuccess");
  var params = new URLSearchParams(window.location.search);

  if (params.get("sent") === "1" && success) {
    success.classList.add("show");
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  var wantedService = params.get("service");
  if (wantedService) {
    var select = form.querySelector("#service");
    if (select) {
      Array.prototype.slice.call(select.options).forEach(function (opt) {
        if (opt.value.toLowerCase().indexOf(wantedService.toLowerCase()) !== -1 ||
            opt.text.toLowerCase().indexOf(wantedService.toLowerCase()) !== -1) {
          select.value = opt.value;
        }
      });
    }
  }
}

/* ---------------- Scroll progress: the runner himself IS the indicator (vertical, right edge) ---------------- */
function initScrollProgress() {
  var track = document.createElement("div");
  track.className = "scroll-progress-track";

  var runner = document.createElement("img");
  runner.className = "scroll-runner";
  runner.src = "assets/img/runner-solo-lime.png";
  runner.alt = "";

  var finish = document.createElement("span");
  finish.className = "scroll-finish";
  finish.textContent = "🏁"; /* checkered flag emoji, marks the bottom of the page */

  track.appendChild(runner);
  track.appendChild(finish);
  document.body.appendChild(track);

  function update() {
    var h = document.documentElement;
    var scrolled = h.scrollTop;
    var height = h.scrollHeight - h.clientHeight;
    var pct = height > 0 ? (scrolled / height) * 100 : 0;
    /* keep the runner clear of the flag until it actually finishes at the bottom */
    var runnerPct = pct >= 99.5 ? 100 : Math.min(pct * 0.95, 95);
    runner.style.top = runnerPct + "%";
  }
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

/* ---------------- Custom cursor (fine pointer / hover-capable devices only) ---------------- */
function initCustomCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.documentElement.classList.add("has-custom-cursor");

  var dot = document.createElement("div");
  dot.className = "cursor-dot";
  var ring = document.createElement("div");
  ring.className = "cursor-ring";
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  var mouseX = -100, mouseY = -100;
  var ringX = -100, ringY = -100;

  window.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = "translate(" + mouseX + "px," + mouseY + "px) translate(-50%,-50%)";
  });

  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  var hoverables = document.querySelectorAll("a, button, [data-tab-btn], .gallery-item, input, select, textarea");
  hoverables.forEach(function (el) {
    el.addEventListener("mouseenter", function () { ring.classList.add("hover"); });
    el.addEventListener("mouseleave", function () { ring.classList.remove("hover"); });
  });

  document.addEventListener("mouseleave", function () { dot.style.opacity = 0; ring.style.opacity = 0; });
  document.addEventListener("mouseenter", function () { dot.style.opacity = 1; ring.style.opacity = 1; });
}

/* ---------------- Magnetic buttons ---------------- */
function initMagnetic() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var els = document.querySelectorAll(".magnetic");
  els.forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      el.style.transform = "translate(" + (x * 0.25) + "px," + (y * 0.35) + "px)";
    });
    el.addEventListener("mouseleave", function () {
      el.style.transform = "";
    });
  });
}

/* ---------------- Hero spotlight follows cursor ---------------- */
function initHeroSpotlight() {
  var hero = document.querySelector(".hero");
  var spot = document.querySelector(".hero-spotlight");
  if (!hero || !spot) return;
  hero.addEventListener("mousemove", function (e) {
    var r = hero.getBoundingClientRect();
    var x = ((e.clientX - r.left) / r.width) * 100;
    var y = ((e.clientY - r.top) / r.height) * 100;
    spot.style.setProperty("--x", x + "%");
    spot.style.setProperty("--y", y + "%");
  });
}

/* ---------------- Hero heading staggered word reveal ---------------- */
function initHeroReveal() {
  var els = document.querySelectorAll("[data-reveal-text]");
  els.forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w, i) {
      return '<span class="reveal-word"><span style="animation-delay:' + (0.15 + i * 0.06) + 's">' + w + '</span></span>';
    }).join(" ");
  });
}
