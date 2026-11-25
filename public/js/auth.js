import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const THEME_STORAGE_KEY = "codepad-theme";

/**
 * Aplica el tema guardado en localStorage (solo preferencia visual, nunca credenciales).
 * @param {"light"|"dark"|null} theme
 */
function applyTheme(theme) {
  if (theme === "dark" || theme === "light") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : null;
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignorar si localStorage no está disponible
  }
}

function getCurrentEffectiveTheme() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeToggleUI(toggle) {
  if (!toggle) return;
  const effective = getCurrentEffectiveTheme();
  const isDark = effective === "dark";
  toggle.setAttribute("aria-pressed", String(isDark));
  toggle.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  const label = toggle.querySelector("#theme-toggle-label");
  if (label) label.textContent = isDark ? "Modo oscuro" : "Modo claro";
}

function initThemeToggle() {
  applyTheme(getSavedTheme());
  const toggle = document.getElementById("theme-toggle");
  updateThemeToggleUI(toggle);
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const next = getCurrentEffectiveTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
    updateThemeToggleUI(toggle);
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (!getSavedTheme()) updateThemeToggleUI(toggle);
    });
  }
}

function getCurrentPageName() {
  const path = window.location.pathname;
  const segment = path.substring(path.lastIndexOf("/") + 1);
  return segment || "index.html";
}

function isLoginPage() {
  const page = getCurrentPageName();
  return page === "login.html";
}

function isProtectedPage() {
  const page = getCurrentPageName();
  // Dashboard principal y cualquier otra vista protegida servida desde la raíz pública
  return page === "index.html" || page === "" || window.location.pathname.endsWith("/");
}

function redirectTo(path) {
  const current = window.location.pathname;
  if (current.endsWith(path) || (path === "index.html" && (current === "/" || current.endsWith("/index.html")))) {
    return;
  }
  window.location.replace(path);
}

function setLoginMessage(message, type = "") {
  const el = document.getElementById("login-message");
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("error", "success");
  if (type) el.classList.add(type);
}

function mapAuthError(error) {
  const code = error?.code || "";
  const messages = {
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
    "auth/user-not-found": "No existe una cuenta con este correo.",
    "auth/wrong-password": "La contraseña es incorrecta.",
    "auth/invalid-credential": "Credenciales inválidas. Verifica tu correo y contraseña.",
    "auth/too-many-requests": "Demasiados intentos fallidos. Intenta nuevamente más tarde.",
    "auth/network-request-failed": "Error de red. Verifica tu conexión e inténtalo de nuevo.",
    "auth/missing-password": "Debes ingresar la contraseña."
  };
  return messages[code] || "No se pudo iniciar sesión. Intenta nuevamente.";
}

function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoginMessage("");

    const email = /** @type {HTMLInputElement|null} */ (document.getElementById("email"))?.value.trim();
    const password = /** @type {HTMLInputElement|null} */ (document.getElementById("password"))?.value;
    const submitBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById("login-submit"));

    if (!email || !password) {
      setLoginMessage("Completa tu correo electrónico y contraseña.", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Iniciando sesión…";
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // La redirección se gestiona en onAuthStateChanged.
    } catch (error) {
      console.error("Error de autenticación:", error);
      setLoginMessage(mapAuthError(error), "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Iniciar sesión";
      }
    }
  });
}

function initLogout() {
  const logoutBtn = document.getElementById("logout-button");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      redirectTo("login.html");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  });
}

// Inicialización de UI común (tema, formularios y acciones disponibles en la página actual)
initThemeToggle();
initLoginForm();
initLogout();

// Protección de rutas y redirecciones basadas en el estado real de sesión (Firebase Auth)
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (isLoginPage()) {
      redirectTo("index.html");
    }
    return;
  }

  if (!user && isProtectedPage() && !isLoginPage()) {
    redirectTo("login.html");
  }
});

export { auth, signOut, onAuthStateChanged };
