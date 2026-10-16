/* Shared UI behaviour for all FastGo pages. */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  window.FastGo = {
    toast(message) {
      const toastEl = $("#appToast");
      const messageEl = $("#toastMessage");
      if (!toastEl || !messageEl || !window.bootstrap) return;
      messageEl.textContent = message;
      bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3200 }).show();
    },
    money(value) {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
    }
  };

  // Persisted light/dark theme, with a safe light-mode fallback.
  const savedTheme = localStorage.getItem("fastgo-theme");
  if (savedTheme === "dark") document.documentElement.dataset.theme = "dark";
  $$("[data-theme-toggle]").forEach(button => {
    const icon = $("i", button);
    const updateIcon = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      if (icon) icon.className = dark ? "bi bi-sun" : "bi bi-moon-stars";
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    };
    updateIcon();
    button.addEventListener("click", () => {
      const dark = document.documentElement.dataset.theme !== "dark";
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      localStorage.setItem("fastgo-theme", dark ? "dark" : "light");
      updateIcon();
    });
  });

  $$("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });

  // Reveal elements only when motion is allowed.
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(el => observer.observe(el));
  } else {
    $$(".reveal").forEach(el => el.classList.add("is-visible"));
  }

  // Animate demo metrics once they enter the viewport.
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        const duration = 1200;
        const tick = now => {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => counterObserver.observe(el));
  }

  // Home booking card sends selected locations to the booking page.
  const homeForm = $("#homeBookingForm");
  if (homeForm) {
    const modeButtons = $$("[data-mode]");
    const scheduleField = $(".schedule-field");
    modeButtons.forEach(button => button.addEventListener("click", () => {
      modeButtons.forEach(item => item.classList.toggle("active", item === button));
      if (scheduleField) scheduleField.classList.toggle("d-none", button.dataset.mode !== "schedule");
    }));
    homeForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!homeForm.reportValidity()) return;
      const pickup = $("#homePickup").value.trim();
      const drop = $("#homeDrop").value.trim();
      if (pickup.toLowerCase() === drop.toLowerCase()) {
        FastGo.toast("Pickup and destination should be different.");
        return;
      }
      const params = new URLSearchParams({ pickup, drop });
      const date = $("#rideDate")?.value;
      if (date && !scheduleField.classList.contains("d-none")) params.set("date", date);
      window.location.href = `booking.html?${params.toString()}`;
    });
  }

  const newsletter = $("#newsletterForm");
  if (newsletter) newsletter.addEventListener("submit", event => {
    event.preventDefault();
    if (!newsletter.reportValidity()) return;
    FastGo.toast("Thanks for subscribing! This is a demo, so no email was sent.");
    newsletter.reset();
  });

  $$("[data-demo-link]").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    FastGo.toast("This is a UI placeholder in the FastGo demo.");
  }));
})();