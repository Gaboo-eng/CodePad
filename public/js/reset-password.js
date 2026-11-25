import { auth } from "./firebase-config.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const form = document.getElementById("password-reset-form");
const emailInput = document.getElementById("reset-email");
const message = document.getElementById("reset-message");
const submitButton = document.getElementById("reset-submit");
const genericSuccess = "Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer la contraseña.";

function showMessage(text, type = "") {
  message.textContent = text;
  message.classList.remove("error", "success");
  if (type) message.classList.add(type);
}

function getErrorMessage(error) {
  switch (error?.code) {
    case "auth/invalid-email":
      return "Escribe un correo electrónico válido.";
    case "auth/too-many-requests":
      return "Se han realizado demasiadas solicitudes. Inténtalo más tarde.";
    case "auth/network-request-failed":
      return "No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.";
    default:
      return "No se pudo enviar el correo. Inténtalo de nuevo más tarde.";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");

  if (!form.reportValidity()) return;

  const email = emailInput.value.trim();
  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(genericSuccess, "success");
    form.reset();
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      showMessage(genericSuccess, "success");
    } else {
      console.error("Error al solicitar el restablecimiento de contraseña:", error);
      showMessage(getErrorMessage(error), "error");
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar enlace de recuperación";
  }
});
