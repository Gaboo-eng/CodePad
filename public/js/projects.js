export function renderProjectNavigation(container, projects, selectedProjectId, { onSelect, onEdit, onDelete }) {
  container.replaceChildren();
  if (!projects.length) {
    const empty = document.createElement("p");
    empty.className = "project-empty";
    empty.textContent = "Aún no hay proyectos.";
    container.append(empty);
    return;
  }

  projects.forEach((project) => {
    const item = document.createElement("div");
    item.className = `project-nav-item${project.id === selectedProjectId ? " is-active" : ""}`;

    const select = document.createElement("button");
    select.type = "button";
    select.className = "project-select";
    select.title = project.name;
    select.setAttribute("aria-current", project.id === selectedProjectId ? "page" : "false");
    select.addEventListener("click", () => onSelect(project.id));

    const dot = document.createElement("span");
    dot.className = "project-dot";
    dot.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = project.name;
    select.append(dot, label);

    const actions = document.createElement("span");
    actions.className = "project-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "small-icon-button";
    edit.textContent = "⋯";
    edit.setAttribute("aria-label", `Editar ${project.name}`);
    edit.title = "Editar proyecto";
    edit.addEventListener("click", (event) => {
      event.stopPropagation();
      onEdit(project);
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "small-icon-button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Eliminar ${project.name}`);
    remove.title = "Eliminar proyecto";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      onDelete(project);
    });

    actions.append(edit, remove);
    item.append(select, actions);
    container.append(item);
  });
}
