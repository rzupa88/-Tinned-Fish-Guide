(() => {
  const PHOTO_STORAGE_KEY = "tinned-fish-guide:photos-v1";
  const TIN_STORAGE_KEY = "tinned-fish-guide:v1";
  const MAX_SIDE = 900;
  const JPEG_QUALITY = 0.72;

  const form = document.querySelector("#tinForm");
  const dialog = document.querySelector("#tinDialog");
  const tinId = document.querySelector("#tinId");
  const deleteButton = document.querySelector("#deleteTin");
  const tinGrid = document.querySelector("#tinGrid");

  if (!form || !dialog || !tinId || !tinGrid) return;

  let photoMap = loadPhotoMap();
  let draftPhotos = { cover: null, contents: null };

  injectStyles();
  const ui = injectPhotoFields();
  wirePhotoEvents();
  watchDialog();
  watchLibrary();
  decorateCards();

  function loadPhotoMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function savePhotoMap() {
    try {
      localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photoMap));
      return true;
    } catch (error) {
      console.error("Could not save tin photos.", error);
      window.alert("The photos could not be saved because this browser is running low on storage. Try using smaller photos or removing an older photo.");
      return false;
    }
  }

  function loadTins() {
    try {
      const parsed = JSON.parse(localStorage.getItem(TIN_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .photo-fieldset { background: #fbfaf5; }
      .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .photo-panel { min-width: 0; padding: 14px; border: 1px solid #ded8ca; border-radius: 16px; background: #fff; }
      .photo-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
      .photo-heading strong { color: var(--ink); font-size: .92rem; }
      .photo-heading small { color: var(--muted); font-size: .72rem; }
      .photo-upload {
        position: relative; display: flex; align-items: center; justify-content: center; min-height: 44px;
        padding: 10px 13px; border-radius: 12px; background: #e8f1ef; color: var(--sea-dark);
        font-size: .82rem; font-weight: 800; cursor: pointer;
      }
      .photo-upload input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
      .photo-preview {
        display: grid; place-items: center; min-height: 175px; margin-top: 10px; overflow: hidden;
        border: 1px solid #e2dccf; border-radius: 14px; background: #f2efe7;
      }
      .photo-preview img { display: block; width: 100%; height: 175px; object-fit: cover; }
      .photo-preview span { padding: 16px; color: var(--muted); font-size: .82rem; text-align: center; }
      .photo-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
      .photo-remove { border: 0; background: transparent; color: var(--danger); font-size: .78rem; font-weight: 800; padding: 7px 4px; }
      .photo-saving-note { margin: 10px 0 0; color: var(--muted); font-size: .72rem; line-height: 1.4; }
      .tin-art.has-cover { position: relative; min-height: 176px; overflow: hidden; }
      .tin-art.has-cover > span { display: none; }
      .tin-cover-photo { width: 100%; height: 176px; object-fit: cover; }
      .tin-contents-photo {
        position: absolute; right: 10px; bottom: 10px; width: 62px; height: 62px; object-fit: cover;
        border: 3px solid rgba(255,253,248,.96); border-radius: 14px; background: #fff;
        box-shadow: 0 8px 18px rgba(23,49,45,.2);
      }
      .tin-art.has-contents-only { position: relative; }
      .tin-art.has-contents-only .tin-contents-photo { width: 74px; height: 74px; right: 12px; bottom: 12px; }
      @media (max-width: 820px) { .photo-grid { grid-template-columns: 1fr; } }
      @media (max-width: 560px) {
        .photo-fieldset { margin-inline: -4px; padding: 12px; }
        .photo-panel { padding: 11px 8px; }
        .photo-preview, .photo-preview img { min-height: 155px; height: 155px; }
      }
    `;
    document.head.append(style);
  }

  function injectPhotoFields() {
    const ratingFields = document.querySelector("#ratingFields");
    const fieldset = document.createElement("fieldset");
    fieldset.className = "photo-fieldset";
    fieldset.innerHTML = `
      <legend>Photos</legend>
      <p class="rating-help">Add a cover photo of the label/packaging and a photo of the opened tin.</p>
      <div class="photo-grid">
        ${photoPanelMarkup("cover", "Cover photo", "Label / packaging", "Choose cover photo")}
        ${photoPanelMarkup("contents", "Contents photo", "Opened tin", "Choose contents photo")}
      </div>
      <p class="photo-saving-note">Photos are resized before saving so they use less space on your phone.</p>
    `;
    ratingFields.before(fieldset);

    return {
      fieldset,
      coverInput: fieldset.querySelector("#photoCoverInput"),
      contentsInput: fieldset.querySelector("#photoContentsInput"),
      coverPreview: fieldset.querySelector("#photoCoverPreview"),
      contentsPreview: fieldset.querySelector("#photoContentsPreview"),
      coverRemove: fieldset.querySelector("#photoCoverRemove"),
      contentsRemove: fieldset.querySelector("#photoContentsRemove"),
    };
  }

  function photoPanelMarkup(key, title, subtitle, buttonText) {
    const cap = key[0].toUpperCase() + key.slice(1);
    return `
      <section class="photo-panel">
        <div class="photo-heading"><strong>${title}</strong><small>${subtitle}</small></div>
        <label class="photo-upload">
          <input id="photo${cap}Input" type="file" accept="image/*" />
          <span>${buttonText}</span>
        </label>
        <div class="photo-preview" id="photo${cap}Preview"><span>No ${key} photo yet</span></div>
        <div class="photo-actions"><button class="photo-remove hidden" id="photo${cap}Remove" type="button">Remove photo</button></div>
      </section>
    `;
  }

  function wirePhotoEvents() {
    ui.coverInput.addEventListener("change", () => handleFile("cover", ui.coverInput));
    ui.contentsInput.addEventListener("change", () => handleFile("contents", ui.contentsInput));
    ui.coverRemove.addEventListener("click", () => setDraftPhoto("cover", null));
    ui.contentsRemove.addEventListener("click", () => setDraftPhoto("contents", null));

    form.addEventListener("submit", () => {
      const existingId = tinId.value;
      const snapshot = {
        existingId,
        brand: document.querySelector("#brand")?.value.trim() || "",
        product: document.querySelector("#product")?.value.trim() || "",
        fishType: document.querySelector("#fishType")?.value.trim() || "",
        photos: { ...draftPhotos },
      };

      setTimeout(() => persistSubmittedPhotos(snapshot), 0);
    }, true);

    deleteButton?.addEventListener("click", () => {
      const idAtClick = tinId.value;
      if (!idAtClick) return;
      setTimeout(() => {
        if (loadTins().some((tin) => tin.id === idAtClick)) return;
        if (photoMap[idAtClick]) {
          delete photoMap[idAtClick];
          savePhotoMap();
        }
        decorateCards();
      }, 0);
    });
  }

  async function handleFile(key, input) {
    const file = input.files?.[0];
    if (!file) return;

    try {
      input.disabled = true;
      const dataUrl = await compressPhoto(file);
      setDraftPhoto(key, dataUrl);
    } catch (error) {
      console.error(error);
      window.alert("That photo could not be added. Please try a different image.");
    } finally {
      input.disabled = false;
      input.value = "";
    }
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Could not read image."));
      reader.readAsDataURL(file);
    });
  }

  async function compressPhoto(file) {
    const source = await readAsDataUrl(file);
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load image."));
      img.src = source;
    });

    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable.");
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }

  function setDraftPhoto(key, dataUrl) {
    draftPhotos[key] = dataUrl;
    renderPreview(key);
  }

  function renderPreview(key) {
    const dataUrl = draftPhotos[key];
    const preview = key === "cover" ? ui.coverPreview : ui.contentsPreview;
    const remove = key === "cover" ? ui.coverRemove : ui.contentsRemove;
    preview.replaceChildren();

    if (dataUrl) {
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = key === "cover" ? "Cover photo preview" : "Contents photo preview";
      preview.append(img);
      remove.classList.remove("hidden");
    } else {
      const span = document.createElement("span");
      span.textContent = key === "cover" ? "No cover photo yet" : "No contents photo yet";
      preview.append(span);
      remove.classList.add("hidden");
    }
  }

  function watchDialog() {
    const observer = new MutationObserver(() => {
      if (!dialog.open) return;
      const id = tinId.value;
      const saved = id ? photoMap[id] : null;
      draftPhotos = {
        cover: saved?.cover || null,
        contents: saved?.contents || null,
      };
      renderPreview("cover");
      renderPreview("contents");
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
  }

  function persistSubmittedPhotos(snapshot) {
    const tins = loadTins();
    let id = snapshot.existingId;

    if (!id) {
      const match = tins.find((tin) =>
        tin.brand === snapshot.brand &&
        tin.product === snapshot.product &&
        tin.fishType === snapshot.fishType
      );
      id = match?.id || "";
    }

    if (!id || !tins.some((tin) => tin.id === id)) return;

    if (snapshot.photos.cover || snapshot.photos.contents) {
      photoMap[id] = {
        cover: snapshot.photos.cover || null,
        contents: snapshot.photos.contents || null,
      };
    } else {
      delete photoMap[id];
    }

    if (savePhotoMap()) decorateCards();
  }

  function watchLibrary() {
    const observer = new MutationObserver(() => decorateCards());
    observer.observe(tinGrid, { childList: true });

    ["searchInput", "statusFilter", "fishFilter", "sortSelect"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => setTimeout(decorateCards, 0));
      document.getElementById(id)?.addEventListener("change", () => setTimeout(decorateCards, 0));
    });
  }

  function getVisibleTins() {
    const tins = loadTins();
    const searchInput = document.querySelector("#searchInput");
    const statusFilter = document.querySelector("#statusFilter");
    const fishFilter = document.querySelector("#fishFilter");
    const sortSelect = document.querySelector("#sortSelect");
    const query = searchInput?.value.trim().toLowerCase() || "";
    const status = statusFilter?.value || "all";
    const fish = fishFilter?.value || "all";

    const filtered = tins.filter((tin) => {
      const haystack = [tin.brand, tin.product, tin.fishType, tin.country, tin.style, tin.retailer, tin.notes]
        .filter(Boolean).join(" ").toLowerCase();
      return (!query || haystack.includes(query)) &&
        (status === "all" || tin.status === status) &&
        (fish === "all" || tin.fishType === fish);
    });

    return filtered.sort((a, b) => {
      switch (sortSelect?.value) {
        case "score": return (averageScore(b) ?? -1) - (averageScore(a) ?? -1);
        case "price-low": return (a.price ?? Infinity) - (b.price ?? Infinity);
        case "brand": return (a.brand || "").localeCompare(b.brand || "");
        default: {
          const aDate = a.tastingDate || a.updatedAt || a.createdAt || "";
          const bDate = b.tastingDate || b.updatedAt || b.createdAt || "";
          return bDate.localeCompare(aDate);
        }
      }
    });
  }

  function averageScore(tin) {
    if (tin.status !== "tried") return null;
    const scores = [tin.parentRating, tin.daughterRating].filter(Number.isFinite);
    if (!scores.length) return null;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  function decorateCards() {
    const cards = [...tinGrid.querySelectorAll(".tin-card")];
    const visibleTins = getVisibleTins();

    cards.forEach((card, index) => {
      const tin = visibleTins[index];
      if (!tin) return;
      const art = card.querySelector(".tin-art");
      if (!art) return;
      art.querySelectorAll(".tin-cover-photo, .tin-contents-photo").forEach((node) => node.remove());
      art.classList.remove("has-cover", "has-contents-only");

      const photos = photoMap[tin.id];
      if (!photos) return;

      if (photos.cover) {
        const cover = document.createElement("img");
        cover.className = "tin-cover-photo";
        cover.src = photos.cover;
        cover.alt = `${tin.brand} ${tin.product} packaging`;
        art.prepend(cover);
        art.classList.add("has-cover");
      }

      if (photos.contents) {
        const contents = document.createElement("img");
        contents.className = "tin-contents-photo";
        contents.src = photos.contents;
        contents.alt = `${tin.brand} ${tin.product} contents`;
        art.append(contents);
        if (!photos.cover) art.classList.add("has-contents-only");
      }
    });
  }
})();
