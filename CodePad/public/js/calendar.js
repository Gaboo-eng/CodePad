function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("es", { dateStyle: "full" }).format(date);
}

function reminderDateTime(reminder) {
  return new Date(`${reminder.date}T${reminder.time || "00:00"}`);
}

export function renderCalendar(container, reminders, selectedDate, visibleMonth, { onSelectDate, onAdd, onEdit, onDelete }) {
  container.replaceChildren();
  const panel = document.createElement("section");
  panel.className = "calendar-panel";
  panel.setAttribute("aria-label", "Calendario mensual");

  const toolbar = document.createElement("div");
  toolbar.className = "calendar-toolbar";
  const monthTitle = document.createElement("h2");
  monthTitle.textContent = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(visibleMonth);
  monthTitle.textContent = monthTitle.textContent.charAt(0).toUpperCase() + monthTitle.textContent.slice(1);
  const actions = document.createElement("div");
  actions.className = "calendar-month-actions";

  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "‹";
  previous.setAttribute("aria-label", "Mes anterior");
  previous.addEventListener("click", () => onSelectDate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1), false));
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "›";
  next.setAttribute("aria-label", "Mes siguiente");
  next.addEventListener("click", () => onSelectDate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1), false));
  const todayButton = document.createElement("button");
  todayButton.type = "button";
  todayButton.textContent = "Hoy";
  todayButton.addEventListener("click", () => onSelectDate(new Date(), true));
  actions.append(previous, todayButton, next);
  toolbar.append(monthTitle, actions);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  grid.setAttribute("role", "grid");
  ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].forEach((weekday) => {
    const label = document.createElement("div");
    label.className = "calendar-weekday";
    label.setAttribute("role", "columnheader");
    label.textContent = weekday;
    grid.append(label);
  });

  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const todayKey = localDateKey(new Date());
  const eventCounts = new Map();
  reminders.forEach((reminder) => eventCounts.set(reminder.date, (eventCounts.get(reminder.date) || 0) + 1));

  for (let index = 0; index < cells; index += 1) {
    const dayNumber = index - startOffset + 1;
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), dayNumber);
    const dateKey = localDateKey(date);
    const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    if (!inMonth) button.classList.add("is-outside");
    if (dateKey === todayKey) button.classList.add("is-today");
    if (dateKey === selectedDate) button.classList.add("is-selected");
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", `${formatLongDate(date)}${eventCounts.has(dateKey) ? `, ${eventCounts.get(dateKey)} recordatorios` : ""}`);
    button.addEventListener("click", () => onSelectDate(date, true));

    const number = document.createElement("span");
    number.textContent = String(date.getDate());
    button.append(number);
    const dots = document.createElement("span");
    dots.className = "day-event-dots";
    dots.setAttribute("aria-hidden", "true");
    for (let dotIndex = 0; dotIndex < Math.min(eventCounts.get(dateKey) || 0, 3); dotIndex += 1) {
      dots.append(document.createElement("span"));
    }
    button.append(dots);
    grid.append(button);
  }
  panel.append(toolbar, grid);

  const agenda = document.createElement("section");
  agenda.className = "calendar-agenda";
  const agendaTitle = document.createElement("h2");
  agendaTitle.textContent = "Agenda";
  const dateLabel = document.createElement("p");
  dateLabel.className = "agenda-date";
  const selected = new Date(`${selectedDate}T12:00:00`);
  dateLabel.textContent = formatLongDate(selected);
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "primary-button";
  addButton.textContent = "+ Añadir recordatorio";
  addButton.addEventListener("click", () => onAdd(selectedDate));
  const list = document.createElement("div");
  list.className = "agenda-list";

  const dayReminders = reminders
    .filter((reminder) => reminder.date === selectedDate)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  if (!dayReminders.length) {
    const empty = document.createElement("p");
    empty.className = "agenda-empty";
    empty.textContent = "No hay recordatorios para este día.";
    list.append(empty);
  } else {
    dayReminders.forEach((reminder) => {
      const item = document.createElement("article");
      item.className = "agenda-item";
      const time = document.createElement("time");
      time.className = "agenda-time";
      time.textContent = reminder.time || "Todo el día";
      const details = document.createElement("div");
      details.className = "agenda-details";
      const title = document.createElement("strong");
      title.textContent = reminder.title;
      details.append(title);
      if (reminder.description) {
        const description = document.createElement("p");
        description.textContent = reminder.description;
        details.append(description);
      }
      const itemActions = document.createElement("div");
      itemActions.className = "agenda-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Editar";
      edit.addEventListener("click", () => onEdit(reminder));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-action";
      remove.textContent = "Eliminar";
      remove.addEventListener("click", () => onDelete(reminder));
      itemActions.append(edit, remove);
      details.append(itemActions);
      item.append(time, details);
      list.append(item);
    });
  }
  agenda.append(agendaTitle, dateLabel, addButton, list);
  container.append(panel, agenda);
}

export { localDateKey, reminderDateTime };
