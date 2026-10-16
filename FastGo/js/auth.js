/* Local-only authentication demo and ride history rendering. */
(() => {
  const $ = selector => document.querySelector(selector);
  const readUsers = () => {
    try { return JSON.parse(localStorage.getItem("fastgo-users") || "[]"); }
    catch { return []; }
  };
  const saveUsers = users => localStorage.setItem("fastgo-users", JSON.stringify(users));
  const markInvalid = form => {
    form.classList.add("was-validated");
    return form.checkValidity();
  };

  const loginForm = $("#loginForm");
  if (loginForm) loginForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!markInvalid(loginForm)) return;
    const email = $("#loginEmail").value.trim().toLowerCase();
    const password = $("#loginPassword").value;
    const user = readUsers().find(item => item.email === email && item.password === password);
    if (user) {
      localStorage.setItem("fastgo-current-user", JSON.stringify({ name: user.name, email: user.email }));
      FastGo.toast(`Welcome back, ${user.name}!`);
    } else {
      // Demo login deliberately allows any valid credentials, since there is no server.
      localStorage.setItem("fastgo-current-user", JSON.stringify({ name: email.split("@")[0], email }));
      FastGo.toast("Demo login successful. No real account was contacted.");
    }
    loginForm.reset();
    loginForm.classList.remove("was-validated");
  });

  const signupForm = $("#signupForm");
  if (signupForm) {
    const password = $("#signupPassword");
    const strengthBar = $("#strengthBar");
    const strengthText = $("#strengthText");
    password.addEventListener("input", () => {
      const value = password.value;
      let score = 0;
      if (value.length >= 8) score++;
      if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
      if (/[0-9]/.test(value)) score++;
      if (/[^A-Za-z0-9]/.test(value)) score++;
      strengthBar.dataset.strength = String(score);
      strengthText.textContent = ["Use 8+ characters with a number and symbol.", "Weak password", "Fair password", "Good password", "Strong password"][score];
    });
    signupForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!markInvalid(signupForm)) return;
      const name = $("#signupName").value.trim();
      const email = $("#signupEmail").value.trim().toLowerCase();
      const phone = $("#signupPhone").value.trim();
      const pass = password.value;
      if (pass.length < 8 || !/[0-9]/.test(pass) || !/[^A-Za-z0-9]/.test(pass)) {
        password.setCustomValidity("Use at least 8 characters, one number and one symbol.");
        password.classList.add("is-invalid");
        FastGo.toast("Use 8+ characters, including a number and a symbol.");
        return;
      }
      password.setCustomValidity("");
      password.classList.remove("is-invalid");
      const users = readUsers();
      if (users.some(user => user.email === email)) {
        FastGo.toast("That email is already registered in this browser demo.");
        return;
      }
      users.push({ name, email, phone, password: pass });
      saveUsers(users);
      localStorage.setItem("fastgo-current-user", JSON.stringify({ name, email }));
      signupForm.reset();
      signupForm.classList.remove("was-validated");
      strengthBar.dataset.strength = "0";
      strengthText.textContent = "Use 8+ characters with a number and symbol.";
      FastGo.toast("Account created locally. This is not secure authentication.");
    });
  }

  document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
      button.innerHTML = `<i class="bi bi-${show ? "eye-slash" : "eye"}"></i>`;
    });
  });

  const driverForm = $("#driverForm");
  if (driverForm) driverForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!markInvalid(driverForm)) return;
    const applications = JSON.parse(localStorage.getItem("fastgo-driver-applications") || "[]");
    applications.push({
      name: $("#driverName").value.trim(),
      phone: $("#driverPhone").value.trim(),
      city: $("#driverCity").value,
      vehicle: $("#vehicleType").value,
      email: $("#driverEmail").value.trim(),
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem("fastgo-driver-applications", JSON.stringify(applications));
    driverForm.reset();
    driverForm.classList.remove("was-validated");
    FastGo.toast("Thanks! Your demo driver application has been saved in this browser.");
  });

  // Render ride history if the history page is open.
  const historyList = $("#historyList");
  if (historyList) {
    let rides = [];
    try { rides = JSON.parse(localStorage.getItem("fastgo-rides") || "[]"); } catch { rides = []; }
    const empty = $("#emptyHistory");
    if (rides.length) {
      empty.classList.add("d-none");
      $("#historyCount").textContent = rides.length;
      $("#historySpent").textContent = FastGo.money(rides.filter(ride => !String(ride.status).startsWith("Cancelled")).reduce((sum, ride) => sum + Number(ride.fare || 0), 0));
      historyList.innerHTML = rides.map(ride => `
        <article class="history-card">
          <div class="history-type-icon"><i class="bi bi-${ride.type === "Bike" ? "bicycle" : ride.type === "Auto" ? "taxi-front" : "car-front-fill"}"></i></div>
          <div class="history-route"><div class="history-route-point"><span class="history-dot pickup-dot"></span><strong>${escapeHtml(ride.pickup)}</strong></div><div class="history-route-point"><span class="history-dot drop-dot"></span><strong>${escapeHtml(ride.drop)}</strong></div><small>${new Date(ride.date).toLocaleString()} · ${Number(ride.distance).toFixed(1)} km · ${Number(ride.duration)} min</small></div>
          <div class="history-amount"><strong>${FastGo.money(ride.fare)}</strong><span class="status-badge ${String(ride.status).startsWith("Cancelled") ? "cancelled" : ""}">${escapeHtml(ride.status || "Demo ride")}</span><small>${escapeHtml(ride.type)} · ${escapeHtml(ride.driver || "FastGo partner")}</small></div>
        </article>`).join("");
    } else {
      $("#historySummary").classList.add("d-none");
      empty.classList.remove("d-none");
    }
    $("#clearHistory").addEventListener("click", () => {
      if (!rides.length) { FastGo.toast("Your ride history is already empty."); return; }
      if (!window.confirm("Clear all locally saved ride history?")) return;
      localStorage.removeItem("fastgo-rides");
      historyList.innerHTML = "";
      $("#historySummary").classList.add("d-none");
      empty.classList.remove("d-none");
      FastGo.toast("Ride history cleared from this browser.");
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
})();