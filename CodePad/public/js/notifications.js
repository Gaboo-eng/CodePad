import { reminderDateTime } from "./calendar.js";

const notifiedReminders = new Set();
let activeReminders = [];
let timerId = null;

function formatReminderDate(reminder) {
  const date = reminderDateTime(reminder);
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function renderList(container, reminders, onOpen) {
  container.replaceChildren();
  const upcoming = reminders
    .filter((reminder) => reminderDateTime(reminder).getTime() >= Date.now())
    .sort((a, b) => reminderDateTime(a).getTime() - reminderDateTime(b).getTime());

  if (!upcoming.length) {
    const empty = document.createElement("p");
    empty.className = "notification-empty";
    empty.textContent = "No hay recordatorios próximos.";
    container.append(empty);
    return 0;
  }

  upcoming.slice(0, 10).forEach((reminder) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "notification-item";
    button.addEventListener("click", () => onOpen(reminder));
    const title = document.createElement("strong");
    title.textContent = reminder.title;
    const date = document.createElement("span");
    date.textContent = formatReminderDate(reminder);
    button.append(title, date);
    container.append(button);
  });
  return upcoming.length;
}

export function initializeNotifications({ toggleButton, menu, list, count, permissionButton, onOpen }) {
  toggleButton.addEventListener("click", () => {
    const isOpen = toggleButton.getAttribute("aria-expanded") === "true";
    toggleButton.setAttribute("aria-expanded", String(!isOpen));
    menu.hidden = isOpen;
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !toggleButton.contains(event.target)) {
      menu.hidden = true;
      toggleButton.setAttribute("aria-expanded", "false");
    }
  });

  permissionButton.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      permissionButton.textContent = "No compatible";
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      permissionButton.textContent = permission === "granted" ? "Avisos activados" : "Permiso no concedido";
    } catch (error) {
      console.error("No se pudo solicitar permiso para notificaciones:", error);
      permissionButton.textContent = "No disponible";
    }
  });

  return (reminders) => {
    activeReminders = reminders;
    const upcomingCount = renderList(list, reminders, onOpen);
    count.textContent = String(upcomingCount);
    count.hidden = upcomingCount === 0;
    permissionButton.hidden = !("Notification" in window) || Notification.permission === "granted";
  };
}

export function startReminderChecks() {
  if (timerId !== null) window.clearInterval(timerId);
  timerId = window.setInterval(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const now = Date.now();
    activeReminders.forEach((reminder) => {
      const timestamp = reminderDateTime(reminder).getTime();
      const delta = timestamp - now;
      if (delta <= 0 && delta > -60_000 && !notifiedReminders.has(reminder.id)) {
        notifiedReminders.add(reminder.id);
        new Notification("CodePad · Recordatorio", {
          body: reminder.title,
          tag: `codepad-${reminder.id}`
        });
      }
    });
  }, 15_000);
}
