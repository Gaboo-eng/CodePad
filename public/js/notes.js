const PRIORITIES = {
  none: "Sin clasificar",
  high: "Alta prioridad",
  medium: "Media prioridad",
  done: "Completado"
};

function formatDate(value) {
  if (!value) return "Recientemente";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Recientemente";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

function addCodeBlock(card, note) {
  const blocks = [
    ["HTML", note.codeHtml],
    ["CSS", note.codeCss],
    ["JavaScript", note.codeJs]
  ].filter(([, code]) => Boolean(code));

  if (!blocks.length) return;
  const source = document.createElement("details");
  source.className = "code-preview-source";
  const summary = document.createElement("summary");
  summary.textContent = "Ver código formateado";
  source.append(summary);

  blocks.forEach(([language, code]) => {
    const label = document.createElement("p");
    label.className = "eyebrow";
    label.textContent = language;
    const pre = document.createElement("pre");
    const codeElement = document.createElement("code");
    codeElement.textContent = code;
    pre.append(codeElement);
    source.append(label, pre);
  });
  card.append(source);

  const previewButton = document.createElement("button");
  previewButton.type = "button";
  previewButton.className = "preview-button";
  previewButton.textContent = "Ver interfaz / Previsualizar";
  previewButton.addEventListener("click", () => {
    const existing = card.querySelector(".note-preview-frame");
    if (existing) {
      existing.remove();
      previewButton.textContent = "Ver interfaz / Previsualizar";
      return;
    }

    const frame = document.createElement("iframe");
    frame.className = "note-preview-frame";
    frame.title = `Vista previa: ${note.title}`;
    frame.setAttribute("sandbox", "allow-scripts");
    frame.referrerPolicy = "no-referrer";
    const html = note.codeHtml || "";
    const css = (note.codeCss || "").replace(/<\/style/gi, "<\\/style");
    const js = (note.codeJs || "").replace(/<\/script/gi, "<\\/script");
    frame.srcdoc = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
    previewButton.insertAdjacentElement("afterend", frame);
    previewButton.textContent = "Ocultar vista previa";
  });
  card.append(previewButton);
}

export function renderNotes(container, notes, projects, { onEdit, onDelete }) {
  container.replaceChildren();
  if (!notes.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const heading = document.createElement("h2");
    heading.textContent = "Todavía no hay notas aquí";
    const message = document.createElement("p");
    message.textContent = "Crea una nota para guardar tus apuntes y bloques de código.";
    empty.append(heading, message);
    container.append(empty);
    return;
  }

  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  notes.forEach((note) => {
    const card = document.createElement("article");
    card.className = `note-card priority-${PRIORITIES[note.priority] ? note.priority : "none"}`;
    const body = document.createElement("div");
    body.className = "note-card-body";

    const heading = document.createElement("div");
    heading.className = "note-card-heading";
    const title = document.createElement("h2");
    title.textContent = note.title || "Sin título";
    const priority = document.createElement("span");
    priority.className = `priority-badge${note.priority && note.priority !== "none" ? ` priority-${note.priority}` : ""}`;
    priority.textContent = PRIORITIES[note.priority] || PRIORITIES.none;
    heading.append(title, priority);
    body.append(heading);

    if (note.projectId && projectNames.has(note.projectId)) {
      const projectLabel = document.createElement("p");
      projectLabel.className = "note-project-label";
      projectLabel.textContent = projectNames.get(note.projectId);
      body.append(projectLabel);
    }

    if (note.content) {
      const content = document.createElement("p");
      content.className = "note-content";
      content.textContent = note.content;
      body.append(content);
    }

    addCodeBlock(body, note);

    const footer = document.createElement("footer");
    footer.className = "note-card-footer";
    const date = document.createElement("span");
    date.textContent = `Actualizada ${formatDate(note.updatedAt || note.createdAt)}`;
    const actions = document.createElement("div");
    actions.className = "card-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => onEdit(note));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-action";
    remove.textContent = "Eliminar";
    remove.addEventListener("click", () => onDelete(note));
    actions.append(edit, remove);
    footer.append(date, actions);
    card.append(body, footer);
    container.append(card);
  });
}

export function sortNotes(notes, sortBy) {
  const result = [...notes];
  const timestamp = (value) => {
    if (!value) return 0;
    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  };
  const priorityRank = { high: 0, medium: 1, none: 2, done: 3 };

  if (sortBy === "created-asc") return result.sort((a, b) => timestamp(a.createdAt) - timestamp(b.createdAt));
  if (sortBy === "created-desc") return result.sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
  if (sortBy === "priority") return result.sort((a, b) => (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2));
  return result.sort((a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt));
}
