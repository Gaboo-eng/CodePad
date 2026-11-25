// Inicialización de Firebase (Auth, Firestore, Messaging) - Firebase Modular SDK v10+
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getMessaging, isSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";

// Reemplaza estos valores con la configuración real de tu proyecto Firebase.
// No incluyas credenciales sensibles adicionales ni secretos fuera de esta configuración pública del cliente.
const firebaseConfig = {
  apiKey: "AIzaSyDTFh-hMFb5CNb1XQ5ogLM7N6s4sFZXt0U",
  authDomain: "codepad-ca716.firebaseapp.com",
  projectId: "codepad-ca716",
  storageBucket: "codepad-ca716.firebasestorage.app",
  messagingSenderId: "478995176235",
  appId: "1:478995176235:web:87aa283308e40990ac036e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Cloud Messaging solo está disponible en navegadores compatibles y contextos seguros (HTTPS).
let messaging = null;
export const messagingReady = isSupported()
  .then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
    return messaging;
  })
  .catch((error) => {
    console.warn("Firebase Messaging no es compatible en este entorno:", error);
    return null;
  });

export { app, auth, db };
export function getMessagingInstance() {
  return messaging;
}
