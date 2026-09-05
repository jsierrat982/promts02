/* ==========================================================
   Bóveda de Prompts — lógica de la aplicación
   Almacenamiento: localStorage es la fuente de verdad en el
   navegador. data/prompts.json solo se usa como semilla la
   primera vez que se abre la página (o si se borra el storage).
   Exportar/Importar JSON es la vía para respaldar y sincronizar
   entre dispositivos vía el propio repositorio.
   ========================================================== */

const STORAGE_KEY = "promptVaultData";
const SEED_URL = "data/prompts.json";

const state = {
  categories: [],
  prompts: [],
  activeCategory: "all",
  searchQuery: "",
};

// ---------- elementos del DOM ----------

const el = {
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebarScrim: document.getElementById("sidebarScrim"),
  categoryList: document.getElementById("categoryList"),
  newCategoryBtn: document.getElementById("newCategoryBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importInput: document.getElementById("importInput"),
  searchInput: document.getElementById("searchInput"),
  addPromptBtn: document.getElementById("addPromptBtn"),
  themeToggle: document.getElementById("themeToggle"),
  activeCategoryTitle: document.getElementById("activeCategoryTitle"),
  resultsCount: document.getElementById("resultsCount"),
  promptGrid: document.getElementById("promptGrid"),
  emptyState: document.getElementById("emptyState"),
  modal: document.getElementById("promptModal"),
  modalTitle: document.getElementById("modalTitle"),
  form: document.getElementById("promptForm"),
  fieldTitle: document.getElementById("fieldTitle"),
  fieldText: document.getElementById("fieldText"),
  fieldCategory: document.getElementById("fieldCategory"),
  newCategoryField: document.getElementById("newCategoryField"),
  fieldNewCategory: document.getElementById("fieldNewCategory"),
  fieldTags: document.getElementById("fieldTags"),
  fieldId: document.getElementById("fieldId"),
  deleteFromModalBtn: document.getElementById("deleteFromModalBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  toast: document.getElementById("toast"),
  viewModal: document.getElementById("viewModal"),
  viewModalTitle: document.getElementById("viewModalTitle"),
  viewModalCategory: document.getElementById("viewModalCategory"),
  viewModalTags: document.getElementById("viewModalTags"),
  viewModalText: document.getElementById("viewModalText"),
  viewModalDate: document.getElementById("viewModalDate"),
  viewCopyBtn: document.getElementById("viewCopyBtn"),
  viewEditBtn: document.getElementById("viewEditBtn"),
  viewCloseBtn: document.getElementById("viewCloseBtn"),
};

const NEW_CATEGORY_VALUE = "__new__";

// ---------- utilidades ----------

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

let toastTimer = null;
function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove("visible"), 2200);
}

// ---------- carga y persistencia ----------

async function loadInitialData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      state.categories = parsed.categories || [];
      state.prompts = parsed.prompts || [];
      return;
    } catch {
      // storage corrupto: cae a la semilla
    }
  }

  try {
    const res = await fetch(SEED_URL);
    const seed = await res.json();
    state.categories = seed.categories || [];
    state.prompts = seed.prompts || [];
  } catch {
    state.categories = ["Programación", "Escritura creativa", "Análisis de datos", "Marketing", "Educación"];
    state.prompts = [];
  }
  persist();
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ categories: state.categories, prompts: state.prompts })
  );
}

// ---------- filtrado ----------

function filteredPrompts() {
  const q = state.searchQuery.trim().toLowerCase();
  return state.prompts.filter((p) => {
    const matchesCategory = state.activeCategory === "all" || p.category === state.activeCategory;
    if (!matchesCategory) return false;
    if (!q) return true;
    const haystack = [p.title, p.text, p.category, ...(p.tags || [])].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

function countFor(category) {
  if (category === "all") return state.prompts.length;
  return state.prompts.filter((p) => p.category === category).length;
}

// ---------- render ----------

function render() {
  renderCategories();
  renderGrid();
}

function renderCategories() {
  const items = [{ name: "all", label: "Todos" }, ...state.categories.map((c) => ({ name: c, label: c }))];

  el.categoryList.innerHTML = items
    .map((item) => {
      const active = state.activeCategory === item.name;
      const showDelete = item.name !== "all";
      return `
        <li class="category-item">
          <button class="category-btn ${active ? "active" : ""}" data-category="${escapeHtml(item.name)}">
            <span>${escapeHtml(item.label)}</span>
            <span class="category-count">${countFor(item.name)}</span>
          </button>
          ${showDelete ? `<button class="category-delete" data-delete-category="${escapeHtml(item.name)}" aria-label="Eliminar categoría ${escapeHtml(item.name)}" title="Eliminar categoría">×</button>` : ""}
        </li>`;
    })
    .join("");

  el.activeCategoryTitle.textContent =
    state.activeCategory === "all" ? "Todos los prompts" : state.activeCategory;
}

function renderGrid() {
  const results = filteredPrompts();
  el.resultsCount.textContent = `${results.length} resultado${results.length === 1 ? "" : "s"}`;
  el.emptyState.hidden = results.length !== 0;
  el.promptGrid.hidden = results.length === 0;

  el.promptGrid.innerHTML = results
    .map((p) => {
      const tags = (p.tags || [])
        .map((t) => `<span class="card-tag">${escapeHtml(t)}</span>`)
        .join("");
      return `
        <article class="prompt-card" data-id="${p.id}">
          <div class="card-top">
            <button class="card-title-btn" data-view="${p.id}" type="button" title="Ver prompt completo">
              <h3 class="card-title">${escapeHtml(p.title)}</h3>
            </button>
            <span class="card-category">${escapeHtml(p.category)}</span>
          </div>
          <p class="card-text">${escapeHtml(p.text)}</p>
          ${tags ? `<div class="card-tags">${tags}</div>` : ""}
          <div class="card-footer">
            <span class="card-date">${formatDate(p.createdAt)}</span>
            <div class="card-actions">
              <button class="icon-btn icon-btn-view" data-view="${p.id}" type="button">Ver completo</button>
              <button class="icon-btn" data-copy="${p.id}" type="button">Copiar</button>
              <button class="icon-btn" data-edit="${p.id}" type="button">Editar</button>
            </div>
          </div>
        </article>`;
    })
    .join("");
}

// ---------- categorías en el <select> del modal ----------

function populateCategorySelect(selected) {
  const options = state.categories
    .map((c) => `<option value="${escapeHtml(c)}" ${c === selected ? "selected" : ""}>${escapeHtml(c)}</option>`)
    .join("");
  el.fieldCategory.innerHTML = options + `<option value="${NEW_CATEGORY_VALUE}">+ Crear nueva categoría…</option>`;
  el.newCategoryField.hidden = true;
  el.fieldNewCategory.required = false;
}

el.fieldCategory.addEventListener("change", () => {
  const isNew = el.fieldCategory.value === NEW_CATEGORY_VALUE;
  el.newCategoryField.hidden = !isNew;
  el.fieldNewCategory.required = isNew;
  if (isNew) el.fieldNewCategory.focus();
});

// ---------- modal: abrir / cerrar / guardar ----------

function openModalForCreate() {
  el.form.reset();
  el.fieldId.value = "";
  el.modalTitle.textContent = "Nuevo prompt";
  el.deleteFromModalBtn.hidden = true;
  populateCategorySelect(state.activeCategory !== "all" ? state.activeCategory : state.categories[0]);
  el.modal.showModal();
  el.fieldTitle.focus();
}

function openModalForEdit(id) {
  const p = state.prompts.find((x) => x.id === id);
  if (!p) return;
  el.form.reset();
  el.fieldId.value = p.id;
  el.fieldTitle.value = p.title;
  el.fieldText.value = p.text;
  el.fieldTags.value = (p.tags || []).join(", ");
  el.modalTitle.textContent = "Editar prompt";
  el.deleteFromModalBtn.hidden = false;
  populateCategorySelect(p.category);
  el.modal.showModal();
  el.fieldTitle.focus();
}

function closeModal() {
  el.modal.close();
}

// ---------- modal: ver prompt completo ----------

let viewingId = null;

function openViewModal(id) {
  const p = state.prompts.find((x) => x.id === id);
  if (!p) return;

  viewingId = id;
  el.viewModalTitle.textContent = p.title;
  el.viewModalCategory.textContent = p.category;
  el.viewModalText.textContent = p.text;
  el.viewModalDate.textContent = formatDate(p.createdAt);
  el.viewModalTags.innerHTML = (p.tags || [])
    .map((t) => `<span class="card-tag">${escapeHtml(t)}</span>`)
    .join("");

  el.viewModal.showModal();
}

function closeViewModal() {
  el.viewModal.close();
  viewingId = null;
}

el.viewCloseBtn.addEventListener("click", closeViewModal);
el.viewModal.addEventListener("click", (e) => {
  if (e.target === el.viewModal) closeViewModal();
});

el.viewEditBtn.addEventListener("click", () => {
  const id = viewingId;
  closeViewModal();
  if (id) openModalForEdit(id);
});

el.viewCopyBtn.addEventListener("click", async () => {
  const p = state.prompts.find((x) => x.id === viewingId);
  if (!p) return;
  try {
    await navigator.clipboard.writeText(p.text);
    el.viewCopyBtn.textContent = "Copiado ✓";
    setTimeout(() => (el.viewCopyBtn.textContent = "Copiar"), 1400);
  } catch {
    showToast("No se pudo copiar. Copia manualmente el texto.");
  }
});

el.addPromptBtn.addEventListener("click", openModalForCreate);
el.cancelBtn.addEventListener("click", closeModal);
el.modal.addEventListener("click", (e) => {
  if (e.target === el.modal) closeModal();
});

el.form.addEventListener("submit", (e) => {
  e.preventDefault();

  let category = el.fieldCategory.value;
  if (category === NEW_CATEGORY_VALUE) {
    const name = el.fieldNewCategory.value.trim();
    if (!name) {
      el.fieldNewCategory.focus();
      return;
    }
    if (!state.categories.includes(name)) state.categories.push(name);
    category = name;
  }

  const tags = el.fieldTags.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const id = el.fieldId.value;

  if (id) {
    const p = state.prompts.find((x) => x.id === id);
    if (p) {
      p.title = el.fieldTitle.value.trim();
      p.text = el.fieldText.value.trim();
      p.category = category;
      p.tags = tags;
    }
    showToast("Prompt actualizado");
  } else {
    state.prompts.unshift({
      id: uid(),
      title: el.fieldTitle.value.trim(),
      text: el.fieldText.value.trim(),
      category,
      tags,
      createdAt: new Date().toISOString(),
    });
    showToast("Prompt guardado");
  }

  persist();
  closeModal();
  render();
});

el.deleteFromModalBtn.addEventListener("click", () => {
  const id = el.fieldId.value;
  if (!id) return;
  if (!confirm("¿Eliminar este prompt? Esta acción no se puede deshacer.")) return;
  state.prompts = state.prompts.filter((p) => p.id !== id);
  persist();
  closeModal();
  render();
  showToast("Prompt eliminado");
});

// ---------- eventos de la grilla (delegación) ----------

el.promptGrid.addEventListener("click", async (e) => {
  const copyBtn = e.target.closest("[data-copy]");
  const editBtn = e.target.closest("[data-edit]");
  const viewBtn = e.target.closest("[data-view]");

  if (viewBtn) {
    openViewModal(viewBtn.dataset.view);
    return;
  }

  if (copyBtn) {
    const p = state.prompts.find((x) => x.id === copyBtn.dataset.copy);
    if (!p) return;
    try {
      await navigator.clipboard.writeText(p.text);
      copyBtn.textContent = "Copiado ✓";
      copyBtn.classList.add("copied");
      setTimeout(() => {
        copyBtn.textContent = "Copiar";
        copyBtn.classList.remove("copied");
      }, 1400);
    } catch {
      showToast("No se pudo copiar. Copia manualmente el texto.");
    }
  }

  if (editBtn) {
    openModalForEdit(editBtn.dataset.edit);
  }
});

// ---------- categorías: navegación, creación, eliminación ----------

el.categoryList.addEventListener("click", (e) => {
  const catBtn = e.target.closest("[data-category]");
  const delBtn = e.target.closest("[data-delete-category]");

  if (delBtn) {
    e.stopPropagation();
    const name = delBtn.dataset.deleteCategory;
    if (countFor(name) > 0) {
      showToast("Mueve o elimina sus prompts antes de borrar la categoría.");
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    state.categories = state.categories.filter((c) => c !== name);
    if (state.activeCategory === name) state.activeCategory = "all";
    persist();
    render();
    return;
  }

  if (catBtn) {
    state.activeCategory = catBtn.dataset.category;
    renderCategories();
    renderGrid();
    closeSidebarOnMobile();
  }
});

el.newCategoryBtn.addEventListener("click", () => {
  const name = prompt("Nombre de la nueva categoría:");
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  if (state.categories.includes(trimmed)) {
    showToast("Esa categoría ya existe.");
    return;
  }
  state.categories.push(trimmed);
  state.activeCategory = trimmed;
  persist();
  render();
});

// ---------- búsqueda ----------

el.searchInput.addEventListener("input", () => {
  state.searchQuery = el.searchInput.value;
  renderGrid();
});

// ---------- exportar / importar ----------

el.exportBtn.addEventListener("click", () => {
  const payload = JSON.stringify({ categories: state.categories, prompts: state.prompts }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `prompt-vault-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Copia exportada");
});

el.importBtn.addEventListener("click", () => el.importInput.click());

el.importInput.addEventListener("change", async () => {
  const file = el.importInput.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.prompts) || !Array.isArray(parsed.categories)) {
      throw new Error("Formato inválido");
    }
    const replace = confirm(
      "Aceptar = reemplazar todos los datos actuales con el archivo importado.\nCancelar = fusionar (agregar solo lo nuevo)."
    );
    if (replace) {
      state.categories = parsed.categories;
      state.prompts = parsed.prompts;
    } else {
      const existingIds = new Set(state.prompts.map((p) => p.id));
      parsed.prompts.forEach((p) => {
        if (!existingIds.has(p.id)) state.prompts.push(p);
      });
      parsed.categories.forEach((c) => {
        if (!state.categories.includes(c)) state.categories.push(c);
      });
    }
    persist();
    render();
    showToast("Importación completada");
  } catch {
    showToast("El archivo no tiene un formato válido.");
  } finally {
    el.importInput.value = "";
  }
});

// ---------- tema claro / oscuro ----------

const THEME_KEY = "promptVaultTheme";

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  el.themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  el.themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
  );
}

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

// El <script> inline en el <head> ya aplicó el atributo data-theme antes del
// primer render (evita el parpadeo). Aquí solo sincronizamos el botón.
applyTheme(currentTheme());

el.themeToggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

// ---------- sidebar móvil ----------

function openSidebar() {
  el.sidebar.classList.add("open");
  el.sidebarScrim.classList.add("open");
  el.sidebarScrim.hidden = false;
  el.sidebarToggle.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  el.sidebar.classList.remove("open");
  el.sidebarScrim.classList.remove("open");
  el.sidebarScrim.hidden = true;
  el.sidebarToggle.setAttribute("aria-expanded", "false");
}

function closeSidebarOnMobile() {
  if (window.matchMedia("(max-width: 860px)").matches) closeSidebar();
}

el.sidebarToggle.addEventListener("click", () => {
  el.sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
});
el.sidebarScrim.addEventListener("click", closeSidebar);

// ---------- arranque ----------

(async function init() {
  await loadInitialData();
  render();
})();
