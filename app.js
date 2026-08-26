const STORAGE_KEY = "tinned-fish-guide:v1";

const els = {
  openAddTin: document.querySelector("#openAddTin"),
  emptyAddTin: document.querySelector("#emptyAddTin"),
  tinDialog: document.querySelector("#tinDialog"),
  tinForm: document.querySelector("#tinForm"),
  closeDialog: document.querySelector("#closeDialog"),
  cancelDialog: document.querySelector("#cancelDialog"),
  deleteTin: document.querySelector("#deleteTin"),
  dialogTitle: document.querySelector("#dialogTitle"),
  tinId: document.querySelector("#tinId"),
  brand: document.querySelector("#brand"),
  product: document.querySelector("#product"),
  fishType: document.querySelector("#fishType"),
  country: document.querySelector("#country"),
  style: document.querySelector("#style"),
  retailer: document.querySelector("#retailer"),
  price: document.querySelector("#price"),
  tastingDate: document.querySelector("#tastingDate"),
  status: document.querySelector("#status"),
  ratingFields: document.querySelector("#ratingFields"),
  parentRating: document.querySelector("#parentRating"),
  parentRatingOutput: document.querySelector("#parentRatingOutput"),
  daughterRating: document.querySelector("#daughterRating"),
  daughterRatingOutput: document.querySelector("#daughterRatingOutput"),
  notes: document.querySelector("#notes"),
  buyAgain: document.querySelector("#buyAgain"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  fishFilter: document.querySelector("#fishFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  tinGrid: document.querySelector("#tinGrid"),
  emptyState: document.querySelector("#emptyState"),
  resultCount: document.querySelector("#resultCount"),
  statTried: document.querySelector("#statTried"),
  statWishlist: document.querySelector("#statWishlist"),
  statTopScore: document.querySelector("#statTopScore"),
  statSpecies: document.querySelector("#statSpecies"),
  template: document.querySelector("#tinCardTemplate"),
};

let tins = loadTins();

function loadTins() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Could not read saved tins.", error);
    return [];
  }
}

function saveTins() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tins));
}

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function asNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function averageScore(tin) {
  if (tin.status !== "tried") return null;
  const scores = [tin.parentRating, tin.daughterRating].filter((score) => Number.isFinite(score));
  if (!scores.length) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function formatScore(score) {
  return Number.isFinite(score) ? score.toFixed(1) : "—";
}

function formatPrice(price) {
  return Number.isFinite(price) ? `$${price.toFixed(2)}` : "";
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

function openNewTin() {
  els.tinForm.reset();
  els.tinId.value = "";
  els.dialogTitle.textContent = "Add a tin";
  els.deleteTin.classList.add("hidden");
  els.status.value = "tried";
  els.tastingDate.value = todayLocal();
  els.parentRating.value = "7.5";
  els.daughterRating.value = "7.5";
  syncRatingOutputs();
  syncStatusFields();
  els.tinDialog.showModal();
  requestAnimationFrame(() => els.brand.focus());
}

function openEditTin(id) {
  const tin = tins.find((item) => item.id === id);
  if (!tin) return;

  els.tinId.value = tin.id;
  els.dialogTitle.textContent = "Edit tin";
  els.brand.value = tin.brand || "";
  els.product.value = tin.product || "";
  els.fishType.value = tin.fishType || "";
  els.country.value = tin.country || "";
  els.style.value = tin.style || "";
  els.retailer.value = tin.retailer || "";
  els.price.value = Number.isFinite(tin.price) ? tin.price : "";
  els.tastingDate.value = tin.tastingDate || "";
  els.status.value = tin.status || "tried";
  els.parentRating.value = Number.isFinite(tin.parentRating) ? tin.parentRating : 7.5;
  els.daughterRating.value = Number.isFinite(tin.daughterRating) ? tin.daughterRating : 7.5;
  els.notes.value = tin.notes || "";
  els.buyAgain.checked = Boolean(tin.buyAgain);
  els.deleteTin.classList.remove("hidden");
  syncRatingOutputs();
  syncStatusFields();
  els.tinDialog.showModal();
}

function closeTinDialog() {
  if (els.tinDialog.open) els.tinDialog.close();
}

function syncRatingOutputs() {
  els.parentRatingOutput.value = Number(els.parentRating.value).toFixed(1);
  els.daughterRatingOutput.value = Number(els.daughterRating.value).toFixed(1);
}

function syncStatusFields() {
  const tried = els.status.value === "tried";
  els.ratingFields.classList.toggle("hidden", !tried);
  els.buyAgain.closest("label").classList.toggle("hidden", !tried);
}

function handleSubmit(event) {
  event.preventDefault();

  const existingId = els.tinId.value;
  const existing = tins.find((item) => item.id === existingId);
  const tried = els.status.value === "tried";
  const now = new Date().toISOString();

  const tin = {
    id: existingId || uid(),
    brand: els.brand.value.trim(),
    product: els.product.value.trim(),
    fishType: els.fishType.value.trim(),
    country: els.country.value.trim(),
    style: els.style.value.trim(),
    retailer: els.retailer.value.trim(),
    price: asNumber(els.price.value),
    tastingDate: els.tastingDate.value || "",
    status: els.status.value,
    parentRating: tried ? asNumber(els.parentRating.value) : null,
    daughterRating: tried ? asNumber(els.daughterRating.value) : null,
    notes: els.notes.value.trim(),
    buyAgain: tried ? els.buyAgain.checked : false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (!tin.brand || !tin.product || !tin.fishType) return;

  if (existing) {
    tins = tins.map((item) => item.id === tin.id ? tin : item);
  } else {
    tins = [tin, ...tins];
  }

  saveTins();
  closeTinDialog();
  render();
}

function handleDelete() {
  const id = els.tinId.value;
  const tin = tins.find((item) => item.id === id);
  if (!tin) return;
  if (!window.confirm(`Delete ${tin.brand} — ${tin.product}?`)) return;

  tins = tins.filter((item) => item.id !== id);
  saveTins();
  closeTinDialog();
  render();
}

function getFilteredTins() {
  const query = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const fish = els.fishFilter.value;

  const filtered = tins.filter((tin) => {
    const haystack = [tin.brand, tin.product, tin.fishType, tin.country, tin.style, tin.retailer, tin.notes]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = status === "all" || tin.status === status;
    const matchesFish = fish === "all" || tin.fishType === fish;
    return matchesQuery && matchesStatus && matchesFish;
  });

  return filtered.sort((a, b) => {
    switch (els.sortSelect.value) {
      case "score":
        return (averageScore(b) ?? -1) - (averageScore(a) ?? -1);
      case "price-low":
        return (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY);
      case "brand":
        return (a.brand || "").localeCompare(b.brand || "");
      case "recent":
      default: {
        const aDate = a.tastingDate || a.updatedAt || a.createdAt || "";
        const bDate = b.tastingDate || b.updatedAt || b.createdAt || "";
        return bDate.localeCompare(aDate);
      }
    }
  });
}

function renderFilters() {
  const current = els.fishFilter.value;
  const fishTypes = [...new Set(tins.map((tin) => tin.fishType).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  els.fishFilter.innerHTML = '<option value="all">All fish</option>';
  fishTypes.forEach((fish) => {
    const option = document.createElement("option");
    option.value = fish;
    option.textContent = fish;
    els.fishFilter.append(option);
  });

  els.fishFilter.value = fishTypes.includes(current) ? current : "all";
}

function renderStats() {
  const tried = tins.filter((tin) => tin.status === "tried");
  const wishlist = tins.filter((tin) => tin.status === "wishlist");
  const scores = tried.map(averageScore).filter(Number.isFinite);
  const species = new Set(tried.map((tin) => tin.fishType).filter(Boolean));

  els.statTried.textContent = tried.length;
  els.statWishlist.textContent = wishlist.length;
  els.statTopScore.textContent = scores.length ? Math.max(...scores).toFixed(1) : "—";
  els.statSpecies.textContent = species.size;
}

function makeCard(tin) {
  const fragment = els.template.content.cloneNode(true);
  const card = fragment.querySelector(".tin-card");
  const hit = fragment.querySelector(".card-hit");
  const status = fragment.querySelector(".status-badge");
  const average = averageScore(tin);

  hit.addEventListener("click", () => openEditTin(tin.id));
  hit.setAttribute("aria-label", `Edit ${tin.brand} ${tin.product}`);

  status.textContent = tin.status === "wishlist" ? "Wishlist" : "Tried";
  status.classList.toggle("wishlist", tin.status === "wishlist");
  fragment.querySelector(".country").textContent = tin.country || "";
  fragment.querySelector(".product-name").textContent = tin.product;
  fragment.querySelector(".brand-name").textContent = tin.brand;

  const meta = [tin.fishType, tin.style, formatDate(tin.tastingDate)].filter(Boolean);
  fragment.querySelector(".tin-meta").textContent = meta.join(" · ");
  fragment.querySelector(".parent-score").textContent = formatScore(tin.parentRating);
  fragment.querySelector(".daughter-score").textContent = formatScore(tin.daughterRating);
  fragment.querySelector(".average-score").textContent = formatScore(average);
  fragment.querySelector(".notes-preview").textContent = tin.notes || (tin.status === "wishlist" ? "Waiting to try this one." : "No tasting notes yet.");
  fragment.querySelector(".price").textContent = [formatPrice(tin.price), tin.retailer].filter(Boolean).join(" · ");
  fragment.querySelector(".buy-again").textContent = tin.buyAgain ? "✓ Buy again" : "";

  if (tin.status === "wishlist") {
    card.querySelector(".score-row").classList.add("hidden");
  }

  return fragment;
}

function renderLibrary() {
  const filtered = getFilteredTins();
  els.tinGrid.replaceChildren(...filtered.map(makeCard));
  els.resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "tin" : "tins"}`;

  const hasResults = filtered.length > 0;
  els.tinGrid.classList.toggle("hidden", !hasResults);
  els.emptyState.classList.toggle("hidden", hasResults);

  const emptyTitle = els.emptyState.querySelector("h3");
  const emptyCopy = els.emptyState.querySelector("p");
  const emptyButton = els.emptyState.querySelector("button");

  if (!tins.length) {
    emptyTitle.textContent = "No tins logged yet";
    emptyCopy.textContent = "Add the first tin you try together, or add something to the wishlist.";
    emptyButton.classList.remove("hidden");
  } else if (!hasResults) {
    emptyTitle.textContent = "No matching tins";
    emptyCopy.textContent = "Try changing your search or filters.";
    emptyButton.classList.add("hidden");
  }
}

function render() {
  renderFilters();
  renderStats();
  renderLibrary();
}

els.openAddTin.addEventListener("click", openNewTin);
els.emptyAddTin.addEventListener("click", openNewTin);
els.closeDialog.addEventListener("click", closeTinDialog);
els.cancelDialog.addEventListener("click", closeTinDialog);
els.deleteTin.addEventListener("click", handleDelete);
els.tinForm.addEventListener("submit", handleSubmit);
els.parentRating.addEventListener("input", syncRatingOutputs);
els.daughterRating.addEventListener("input", syncRatingOutputs);
els.status.addEventListener("change", syncStatusFields);

[els.searchInput, els.statusFilter, els.fishFilter, els.sortSelect].forEach((control) => {
  control.addEventListener(control.tagName === "INPUT" ? "input" : "change", renderLibrary);
});

els.tinDialog.addEventListener("click", (event) => {
  const rect = els.tinDialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) closeTinDialog();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

render();
