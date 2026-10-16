/* Booking page: simulated routing, fare estimates, driver matching and ride history. */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const pickupInput = $("#pickup");
  const dropInput = $("#drop");
  const distanceLabel = $("#distanceLabel");
  const timeLabel = $("#timeLabel");
  const surgeToggle = $("#surgeToggle");
  const bookingForm = $("#bookingForm");
  if (!bookingForm) return;

  const locations = {
    "Shivaji Chowk, Solapur": [17.6599, 75.9064],
    "Solapur Railway Station": [17.6598, 75.9064],
    "Siddheshwar Temple, Solapur": [17.6738, 75.9069],
    "Solapur Airport": [17.6277, 75.9348],
    "Hotgi Road, Solapur": [17.6420, 75.9192],
    "Pune Railway Station": [18.5289, 73.8744],
    "Pune Airport": [18.5793, 73.9089],
    "MG Road, Pune": [18.5167, 73.8777],
    "Dadar Station, Mumbai": [19.0183, 72.8422],
    "Mumbai Airport": [19.0896, 72.8656]
  };
  const rideRates = {
    Bike: { base: 18, km: 5.2, minute: 0.55, multiplier: 1.0 },
    Auto: { base: 25, km: 8.5, minute: 0.75, multiplier: 1.15 },
    Mini: { base: 40, km: 11.5, minute: 1.0, multiplier: 1.35 },
    Sedan: { base: 55, km: 14.0, minute: 1.2, multiplier: 1.65 },
    Premium: { base: 85, km: 20.0, minute: 1.6, multiplier: 2.3 }
  };
  let distanceKm = 4.8;
  let durationMin = 16;
  let map;
  let routeLine;
  let pickupMarker;
  let dropMarker;

  const normalise = value => value.trim().toLowerCase();
  const coordinatesFor = value => {
    if (locations[value]) return locations[value];
    const known = Object.keys(locations).find(name => normalise(name) === normalise(value));
    if (known) return locations[known];
    // Unknown typed places get a deterministic nearby coordinate for demo purposes.
    const seed = [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return [17.659 + ((seed % 17) - 8) * 0.0017, 75.906 + ((seed % 13) - 6) * 0.0019];
  };

  function computeRoute() {
    const start = coordinatesFor(pickupInput.value);
    const end = coordinatesFor(dropInput.value);
    const rawDistance = map ? map.distance(start, end) / 1000 : 4.8;
    // Keep unknown routes useful and avoid zero-distance fares.
    distanceKm = Math.max(1.2, Math.min(38, rawDistance * 1.22));
    durationMin = Math.max(5, Math.round(distanceKm * 3.25 + 2));
    distanceLabel.textContent = `${distanceKm.toFixed(1)} km`;
    timeLabel.textContent = `${durationMin} min`;
    if (map) {
      if (routeLine) map.removeLayer(routeLine);
      if (pickupMarker) map.removeLayer(pickupMarker);
      if (dropMarker) map.removeLayer(dropMarker);
      pickupMarker = L.circleMarker(start, { radius: 7, color: "#ffffff", weight: 3, fillColor: "#00C896", fillOpacity: 1 }).addTo(map).bindPopup("Pickup: " + pickupInput.value);
      dropMarker = L.circleMarker(end, { radius: 7, color: "#ffffff", weight: 3, fillColor: "#FF6A00", fillOpacity: 1 }).addTo(map).bindPopup("Drop: " + dropInput.value);
      routeLine = L.polyline([start, end], { color: "#FF6A00", weight: 4, dashArray: "8 8" }).addTo(map);
      map.fitBounds(L.latLngBounds(start, end).pad(0.35), { maxZoom: 14 });
    }
    updateFares();
  }

  function fareFor(type) {
    const rate = rideRates[type];
    const base = rate.base + rate.km * distanceKm + rate.minute * durationMin;
    return Math.round(base * rate.multiplier * (surgeToggle.checked ? 1.35 : 1));
  }
  function updateFares() {
    $$("[data-fare]").forEach(el => { el.textContent = FastGo.money(fareFor(el.dataset.fare)); });
  }
  function markSelectedRide() {
    $$(".ride-option").forEach(label => label.classList.toggle("selected", $("input", label).checked));
  }

  const query = new URLSearchParams(window.location.search);
  if (query.get("pickup")) pickupInput.value = query.get("pickup");
  if (query.get("drop")) dropInput.value = query.get("drop");
  const requestedDate = query.get("date");
  if (requestedDate) FastGo.toast(`Scheduled ride selected for ${new Date(requestedDate).toLocaleString()}. Demo only.`);

  if (window.L) {
    map = L.map("rideMap", { scrollWheelZoom: false }).setView([17.6599, 75.9064], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);
    computeRoute();
  } else {
    $("#rideMap").innerHTML = '<div class="map-fallback"><i class="bi bi-map"></i><strong>Map unavailable</strong><span>Check your internet connection to load OpenStreetMap tiles.</span></div>';
    computeRoute();
  }

  [pickupInput, dropInput].forEach(input => {
    input.addEventListener("change", computeRoute);
    input.addEventListener("blur", computeRoute);
  });
  surgeToggle.addEventListener("change", updateFares);
  $$('input[name="rideType"]').forEach(input => input.addEventListener("change", markSelectedRide));
  $("#swapLocations").addEventListener("click", () => {
    const oldPickup = pickupInput.value;
    pickupInput.value = dropInput.value;
    dropInput.value = oldPickup;
    computeRoute();
  });

  bookingForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;
    if (!pickupInput.value.trim() || !dropInput.value.trim()) {
      FastGo.toast("Please enter both pickup and destination.");
      return;
    }
    if (normalise(pickupInput.value) === normalise(dropInput.value)) {
      FastGo.toast("Pickup and destination should be different.");
      return;
    }
    const rideType = $('input[name="rideType"]:checked').value;
    const fare = fareFor(rideType);
    const modal = bootstrap.Modal.getOrCreateInstance($("#driverModal"));
    const body = $("#driverModalBody");
    $("#driverModalTitle").textContent = "Your ride is on the way";
    body.innerHTML = '<div class="finding-state"><div class="finding-spinner"></div><h3>Finding your driver...</h3><p>Matching you with a nearby ride partner.</p><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>';
    modal.show();
    $("#confirmBooking").disabled = true;
    try {
      // Must be served from localhost for fetch() to read the local JSON file.
      const response = await fetch("data/drivers.json");
      if (!response.ok) throw new Error("Driver data could not be loaded");
      const drivers = await response.json();
      await new Promise(resolve => setTimeout(resolve, 1600));
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const ride = {
        id: "FG" + Date.now().toString().slice(-7),
        pickup: pickupInput.value.trim(),
        drop: dropInput.value.trim(),
        type: rideType,
        fare,
        distance: Number(distanceKm.toFixed(1)),
        duration: durationMin,
        date: new Date().toISOString(),
        driver: driver.name,
        status: "Completed (demo)"
      };
      const history = JSON.parse(localStorage.getItem("fastgo-rides") || "[]");
      history.unshift(ride);
      localStorage.setItem("fastgo-rides", JSON.stringify(history.slice(0, 30)));
      body.innerHTML = `
        <div class="driver-found-banner"><i class="bi bi-check-circle-fill"></i><span><strong>Driver found!</strong><small>Your driver is heading your way.</small></span><span class="driver-eta">${driver.eta} min</span></div>
        <div class="driver-profile"><img src="${driver.photo}" alt="Portrait of ${escapeHtml(driver.name)}"><div class="driver-profile-info"><h3>${escapeHtml(driver.name)}</h3><div class="driver-rating"><i class="bi bi-star-fill"></i> ${driver.rating} <span>· ${driver.trips} trips</span></div><p>${escapeHtml(driver.vehicle)} · ${escapeHtml(driver.plate)}</p></div></div>
        <div class="otp-panel"><div><small>YOUR RIDE OTP</small><strong>${driver.otp}</strong></div><div class="otp-note"><i class="bi bi-shield-lock"></i> Share this code<br>with your driver.</div></div>
        <div class="ride-receipt"><div><span>${escapeHtml(rideType)} ride · ${distanceKm.toFixed(1)} km</span><strong>${FastGo.money(fare)}</strong></div><div><span>Pickup</span><strong>${escapeHtml(pickupInput.value)}</strong></div><div><span>Destination</span><strong>${escapeHtml(dropInput.value)}</strong></div></div>
        <div class="driver-actions"><button class="btn btn-outline-secondary" type="button" data-driver-action="Call"><i class="bi bi-telephone me-1"></i> Call</button><button class="btn btn-outline-secondary" type="button" data-driver-action="Chat"><i class="bi bi-chat-dots me-1"></i> Chat</button><button class="btn btn-outline-danger" type="button" data-driver-action="Cancel"><i class="bi bi-x-circle me-1"></i> Cancel</button></div>
        <a class="history-link" href="history.html">View ride history <i class="bi bi-arrow-up-right"></i></a>`;
      body.querySelectorAll("[data-driver-action]").forEach(button => button.addEventListener("click", () => {
        if (button.dataset.driverAction === "Cancel") {
          const current = JSON.parse(localStorage.getItem("fastgo-rides") || "[]");
          if (current[0] && current[0].id === ride.id) current[0].status = "Cancelled (demo)";
          localStorage.setItem("fastgo-rides", JSON.stringify(current));
          FastGo.toast("Ride cancelled in the demo.");
          button.disabled = true;
        } else {
          FastGo.toast(`${button.dataset.driverAction} is a UI-only demo action.`);
        }
      }));
      FastGo.toast("Demo booking created and saved to ride history.");
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 800));
      body.innerHTML = '<div class="empty-state modal-error"><div class="empty-icon"><i class="bi bi-exclamation-circle"></i></div><h3>Could not load driver details</h3><p>Run FastGo through a local server (not by double-clicking the HTML file) so the browser can fetch data/drivers.json.</p><button type="button" class="btn btn-primary rounded-pill px-4" data-bs-dismiss="modal">Got it</button></div>';
    } finally {
      $("#confirmBooking").disabled = false;
    }
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
})();