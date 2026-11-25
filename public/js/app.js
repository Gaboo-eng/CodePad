import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  createNote,
  createProject,
  createReminder,
  deleteNote,
  deleteProject,
  deleteReminder,
  subscribeToUserData,
  updateNote,
  updateProject,
  updateReminder
} from "./db.js";
import { renderProjectNavigation } from "./projects.js";
import { renderNotes, sortNotes } from "./notes.js";
import { localDateKey, renderCalendar } from "./calendar.js";
import { initializeNotifications, startReminderChecks } from "./notifications.js";

const state = {
  uid: null,
  projects: [],
  notes: [],
  reminders: [],
  section: "projects",
  projectId: null,
  query: "",
  sortBy: "updated-desc",
  selectedDate: localDateKey(new Date()),
  visibleMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  editingProjectId: null,
  editingNoteId: null,
  editingReminderId: null,
  unsubscribe: null
};

const elements = {
  status: document.getElementById("app-status"),
  projectNavigation: document.getElementById("project-navigation"),
  projectsOverview: document.getElementById("projects-overview"),
  notesView: document.getElementById("notes-view"),
  calendarView: document.getElementById("calendar-view"),
  title: document.getElementById("page-title"),
  eyebrow: document.getElementById("section-eyebrow"),
  description: document.getElementById("page-description"),
  search: document.getElementById("context-search"),
  sort: document.getElementById("sort-select"),
  sortControl: document.getElementById("sort-control"),
  addNote: document.getElementById("add-note-button"),
  addReminder: document.getElementById("add-reminder-button"),
  projectDialog: document.getElementById("project-dialog"),
  projectForm: document.getElementById("project-form"),
  projectName: document.getElementById("project-name"),
  projectDescription: document.getElementById("project-description"),
  projectDialogTitle: document.getElementById("project-dialog-title"),
  projectError: document.getElementById("project-error"),
  noteDialog: document.getElementById("note-dialog"),
  noteForm: document.getElementById("note-form"),
  noteTitle: document.getElementById("note-title"),
  noteProject: document.getElementById("note-project"),
  notePriority: document.getElementById("note-priority"),
  noteContent: document.getElementById("note-content"),
  noteCodeHtml: document.getElementById("note-code-html"),
  noteCodeCss: document.getElementById("note-code-css"),
  noteCodeJs: document.getElementById("note-code-js"),
  noteDialogTitle: document.getElementById("note-dialog-title"),
  noteError: document.getElementById("note-error"),
  reminderDialog: document.getElementById("reminder-dialog"),
  reminderForm: document.getElementById("reminder-form"),
  reminderTitle: document.getElementById("reminder-title"),
  reminderDate: document.getElementById("reminder-date"),
  reminderTime: document.getElementById("reminder-time"),
  reminderDescription: document.getElementById("reminder-description"),
  reminderDialogTitle: document.getElementById("reminder-dialog-title"),
  reminderError: document.getElementById("reminder-error"),
  accountName: document.getElementById("account-name"),
  accountAvatar: document.getElementById("account-avatar"),
  sidebar: document.getElementById("sidebar"),
  sidebarBackdrop: document.getElementById("sidebar-backdrop"),
  mobileMenu: document.getElementById("mobile-menu-button")
};

function setStatus(message = "", isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("is-visible", Boolean(message));
  elements.status.classList.toggle("is-error", isError);
}

function getErrorMessage(error) {
  console.error("Error en CodePad:", error);
  if (error?.code === "permission-denied") {
    return "Firebase rechazó el acceso. Comprueba que Firestore esté creado y las reglas estén publicadas.";
  }
  if (error?.code === "unavailable") return "No hay conexión con Firebase. Comprueba tu conexión e inténtalo de nuevo.";
  return "No se pudo completar la operación. Revisa la conexión y la configuración de Firebase.";
}

function showOperationError(error) {
  setStatus(getErrorMessage(error), true);
}

function projectById(id) {
  return state.projects.find((project) => project.id === id);
}

function projectNotes(projectId) {
  return state.notes.filter((note) => (note.projectId || null) === projectId);
}

function filterBySearch(items, fields) {
  const term = state.query.trim().toLocaleLowerCase("es");
  if (!term) return items;
  return items.filter((item) => fields(item).some((value) => String(value || "").toLocaleLowerCase("es").includes(term)));
}

function renderProjectOverview() {
  elements.projectsOverview.replaceChildren();
  const projects = filterBySearch(state.projects, (project) => {
    const projectNotesForSearch = projectNotes(project.id);
    return [
      project.name,
      project.description,
      ...projectNotesForSearch.flatMap((note) => [note.title, note.content, note.codeHtml, note.codeCss, note.codeJs])
    ];
  });
  if (!projects.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const heading = document.createElement("h2");
    heading.textContent = state.query ? "No hay proyectos que coincidan" : "Empieza creando un proyecto";
    const message = document.createElement("p");
    message.textContent = state.query ? "Prueba con otros términos." : "Agrupa tus notas técnicas por proyecto para encontrarlas fácilmente.";
    empty.append(heading, message);
    elements.projectsOverview.append(empty);
    return;
  }

  const heading = document.createElement("div");
  heading.className = "section-subheading";
  const title = document.createElement("h2");
  title.textContent = "Tus proyectos";
  const count = document.createElement("span");
  count.textContent = `${projects.length} ${projects.length === 1 ? "proyecto" : "proyectos"}`;
  heading.append(title, count);
  elements.projectsOverview.append(heading);

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "overview-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Abrir proyecto ${project.name}`);
    const open = () => selectProject(project.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    const top = document.createElement("div");
    top.className = "overview-card-top";
    const name = document.createElement("h2");
    name.textContent = project.name;
    const icon = document.createElement("span");
    icon.className = "project-card-icon";
    icon.textContent = "▣";
    icon.setAttribute("aria-hidden", "true");
    top.append(name, icon);
    const description = document.createElement("p");
    description.textContent = project.description || "Sin descripción.";
    const meta = document.createElement("div");
    meta.className = "overview-meta";
    const noteCount = projectNotes(project.id).length;
    const noteText = document.createElement("span");
    noteText.textContent = `${noteCount} ${noteCount === 1 ? "nota" : "notas"}`;
    const openText = document.createElement("span");
    openText.textContent = "Abrir →";
    meta.append(noteText, openText);
    card.append(top, description, meta);
    elements.projectsOverview.append(card);
  });
}

function renderProjectNav() {
  renderProjectNavigation(elements.projectNavigation, state.projects, state.section === "projects" ? state.projectId : null, {
    onSelect: selectProject,
    onEdit: openProjectDialog,
    onDelete: removeProject
  });
}

function renderActiveSection() {
  renderProjectNav();
  const isProjectOverview = state.section === "projects" && !state.projectId;
  const isNotes = state.section === "notes" || (state.section === "projects" && Boolean(state.projectId));
  const isCalendar = state.section === "calendar";
  elements.projectsOverview.hidden = !isProjectOverview;
  elements.notesView.hidden = !isNotes;
  elements.calendarView.hidden = !isCalendar;
  elements.sortControl.hidden = !isNotes;
  elements.addNote.hidden = !isNotes;
  elements.addReminder.hidden = !isCalendar;

  if (isProjectOverview) {
    elements.eyebrow.textContent = "ESPACIO DE TRABAJO";
    elements.title.textContent = "Proyectos";
    elements.description.textContent = "Organiza tus proyectos y sus apuntes técnicos.";
    renderProjectOverview();
    return;
  }

  if (isNotes) {
    const project = state.projectId ? projectById(state.projectId) : null;
    elements.eyebrow.textContent = project ? "PROYECTO" : "BIBLIOTECA PERSONAL";
    elements.title.textContent = project ? project.name : "Notas";
    elements.description.textContent = project?.description || (project ? "Apuntes y bloques de código de este proyecto." : "Apuntes generales independientes de tus proyectos.");
    const scopedNotes = filterBySearch(projectNotes(project?.id || null), (note) => [note.title, note.content, note.codeHtml, note.codeCss, note.codeJs]);
    renderNotes(elements.notesView, sortNotes(scopedNotes, state.sortBy), state.projects, {
      onEdit: openNoteDialog,
      onDelete: removeNote
    });
    return;
  }

  elements.eyebrow.textContent = "PLANIFICACIÓN";
  elements.title.textContent = "Calendario";
  elements.description.textContent = "Programa recordatorios y consulta tus próximos eventos.";
  const visibleReminders = filterBySearch(state.reminders, (reminder) => [reminder.title, reminder.description, reminder.date, reminder.time]);
  renderCalendar(elements.calendarView, visibleReminders, state.selectedDate, state.visibleMonth, {
    onSelectDate: (date, selectDay) => {
      state.visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      if (selectDay) state.selectedDate = localDateKey(date);
      renderActiveSection();
    },
    onAdd: openReminderDialog,
    onEdit: openReminderDialog,
    onDelete: removeReminder
  });
}

function selectSection(section) {
  state.section = section;
  state.projectId = null;
  document.querySelectorAll(".nav-link[data-section]").forEach((button) => {
    const active = button.dataset.section === section;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  closeMobileNavigation();
  renderActiveSection();
}

function selectProject(projectId) {
  state.section = "projects";
  state.projectId = projectId;
  document.querySelectorAll(".nav-link[data-section]").forEach((button) => {
    const active = button.dataset.section === "projects" && !projectId;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  closeMobileNavigation();
  renderActiveSection();
}

function openProjectDialog(project = null) {
  state.editingProjectId = project?.id || null;
  elements.projectDialogTitle.textContent = project ? "Editar proyecto" : "Nuevo proyecto";
  elements.projectName.value = project?.name || "";
  elements.projectDescription.value = project?.description || "";
  elements.projectError.textContent = "";
  elements.projectDialog.showModal();
  elements.projectName.focus();
}

async function removeProject(project) {
  const noteCount = projectNotes(project.id).length;
  const detail = noteCount ? ` Sus ${noteCount} notas pasarán a la sección Notas generales.` : "";
  if (!window.confirm(`¿Eliminar el proyecto “${project.name}”?${detail}`)) return;
  try {
    await deleteProject(state.uid, project.id);
    if (state.projectId === project.id) state.projectId = null;
    setStatus("");
  } catch (error) {
    showOperationError(error);
  }
}

function updateProjectOptions(selectedId = "") {
  elements.noteProject.replaceChildren();
  const general = document.createElement("option");
  general.value = "";
  general.textContent = "Nota general";
  elements.noteProject.append(general);
  state.projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    elements.noteProject.append(option);
  });
  elements.noteProject.value = selectedId;
}

function openNoteDialog(note = null) {
  state.editingNoteId = note?.id || null;
  elements.noteDialogTitle.textContent = note ? "Editar nota" : "Nueva nota";
  elements.noteTitle.value = note?.title || "";
  elements.noteContent.value = note?.content || "";
  elements.notePriority.value = note?.priority || "none";
  elements.noteCodeHtml.value = note?.codeHtml || "";
  elements.noteCodeCss.value = note?.codeCss || "";
  elements.noteCodeJs.value = note?.codeJs || "";
  updateProjectOptions(note?.projectId || (state.section === "projects" ? state.projectId || "" : ""));
  elements.noteError.textContent = "";
  elements.noteDialog.showModal();
  elements.noteTitle.focus();
}

async function removeNote(note) {
  if (!window.confirm(`¿Eliminar la nota “${note.title}”? Esta acción no se puede deshacer.`)) return;
  try {
    await deleteNote(state.uid, note.id);
    setStatus("");
  } catch (error) {
    showOperationError(error);
  }
}

function openReminderDialog(reminderOrDate = null) {
  const reminder = reminderOrDate && typeof reminderOrDate === "object" ? reminderOrDate : null;
  const date = typeof reminderOrDate === "string" ? reminderOrDate : state.selectedDate;
  state.editingReminderId = reminder?.id || null;
  elements.reminderDialogTitle.textContent = reminder ? "Editar recordatorio" : "Nuevo recordatorio";
  elements.reminderTitle.value = reminder?.title || "";
  elements.reminderDate.value = reminder?.date || date;
  elements.reminderTime.value = reminder?.time || "09:00";
  elements.reminderDescription.value = reminder?.description || "";
  elements.reminderError.textContent = "";
  elements.reminderDialog.showModal();
  elements.reminderTitle.focus();
}

async function removeReminder(reminder) {
  if (!window.confirm(`¿Eliminar el recordatorio “${reminder.title}”?`)) return;
  try {
    await deleteReminder(state.uid, reminder.id);
    setStatus("");
  } catch (error) {
    showOperationError(error);
  }
}

function bindForms() {
  document.getElementById("add-project-button").addEventListener("click", () => openProjectDialog());
  elements.addNote.addEventListener("click", () => openNoteDialog());
  elements.addReminder.addEventListener("click", () => openReminderDialog());

  elements.projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = {
      name: elements.projectName.value.trim(),
      description: elements.projectDescription.value
    };
    if (!values.name) {
      elements.projectError.textContent = "Escribe un nombre para el proyecto.";
      return;
    }
    try {
      if (state.editingProjectId) await updateProject(state.uid, state.editingProjectId, values);
      else await createProject(state.uid, values);
      elements.projectDialog.close();
      setStatus("");
    } catch (error) {
      elements.projectError.textContent = getErrorMessage(error);
    }
  });

  elements.noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = {
      title: elements.noteTitle.value.trim(),
      content: elements.noteContent.value,
      projectId: elements.noteProject.value || null,
      priority: elements.notePriority.value,
      codeHtml: elements.noteCodeHtml.value,
      codeCss: elements.noteCodeCss.value,
      codeJs: elements.noteCodeJs.value
    };
    if (!values.title) {
      elements.noteError.textContent = "Escribe un título para la nota.";
      return;
    }
    try {
      if (state.editingNoteId) await updateNote(state.uid, state.editingNoteId, values);
      else await createNote(state.uid, values);
      elements.noteDialog.close();
      setStatus("");
    } catch (error) {
      elements.noteError.textContent = getErrorMessage(error);
    }
  });

  elements.reminderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = {
      title: elements.reminderTitle.value.trim(),
      date: elements.reminderDate.value,
      time: elements.reminderTime.value,
      description: elements.reminderDescription.value
    };
    if (!values.title || !values.date || !values.time) {
      elements.reminderError.textContent = "Completa el título, la fecha y la hora.";
      return;
    }
    try {
      if (state.editingReminderId) await updateReminder(state.uid, state.editingReminderId, values);
      else await createReminder(state.uid, values);
      state.selectedDate = values.date;
      const selected = new Date(`${values.date}T12:00:00`);
      state.visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
      elements.reminderDialog.close();
      setStatus("");
    } catch (error) {
      elements.reminderError.textContent = getErrorMessage(error);
    }
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });
  [elements.projectDialog, elements.noteDialog, elements.reminderDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

function closeMobileNavigation() {
  elements.sidebar.classList.remove("is-open");
  elements.mobileMenu.setAttribute("aria-expanded", "false");
  elements.sidebarBackdrop.hidden = true;
}

function bindNavigation() {
  document.querySelectorAll(".nav-link[data-section]").forEach((button) => {
    button.addEventListener("click", () => selectSection(button.dataset.section));
  });
  elements.search.addEventListener("input", () => {
    state.query = elements.search.value;
    renderActiveSection();
  });
  elements.sort.addEventListener("change", () => {
    state.sortBy = elements.sort.value;
    renderActiveSection();
  });
  elements.mobileMenu.addEventListener("click", () => {
    const isOpen = elements.sidebar.classList.toggle("is-open");
    elements.mobileMenu.setAttribute("aria-expanded", String(isOpen));
    elements.sidebarBackdrop.hidden = !isOpen;
  });
  elements.sidebarBackdrop.addEventListener("click", closeMobileNavigation);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      elements.search.focus();
    }
    if (event.key === "Escape") closeMobileNavigation();
  });
}

const renderNotifications = initializeNotifications({
  toggleButton: document.getElementById("notification-toggle"),
  menu: document.getElementById("notification-menu"),
  list: document.getElementById("notification-list"),
  count: document.getElementById("notification-count"),
  permissionButton: document.getElementById("enable-notifications"),
  onOpen: (reminder) => {
    selectSection("calendar");
    state.selectedDate = reminder.date;
    state.visibleMonth = new Date(`${reminder.date}T12:00:00`);
    renderActiveSection();
    document.getElementById("notification-menu").hidden = true;
    document.getElementById("notification-toggle").setAttribute("aria-expanded", "false");
  }
});

function subscribeUser(user) {
  if (state.unsubscribe) state.unsubscribe();
  state.uid = user.uid;
  const displayName = user.displayName || user.email || "Usuario";
  elements.accountName.textContent = displayName;
  elements.accountAvatar.textContent = displayName.trim().charAt(0).toLocaleUpperCase("es") || "C";
  setStatus("Cargando tus proyectos y notas...");

  state.unsubscribe = subscribeToUserData(user.uid, {
    onProjects: (projects) => {
      state.projects = projects.sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));
      renderActiveSection();
      setStatus("");
    },
    onNotes: (notes) => {
      state.notes = notes;
      renderActiveSection();
      setStatus("");
    },
    onReminders: (reminders) => {
      state.reminders = reminders;
      renderNotifications(reminders);
      renderActiveSection();
      setStatus("");
    },
    onError: (error) => setStatus(getErrorMessage(error), true)
  });
}

bindForms();
bindNavigation();
renderNotifications([]);
startReminderChecks();

onAuthStateChanged(auth, (user) => {
  if (!user) {
    if (state.unsubscribe) state.unsubscribe();
    return;
  }
  subscribeUser(user);
});
