import { db } from "./firebase-config.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function userCollection(uid, name) {
  if (!uid) throw new Error("Se requiere una sesión autenticada para acceder a Firestore.");
  return collection(db, "users", uid, name);
}

function userDocument(uid, name, id) {
  if (!uid || !id) throw new Error("Se requiere una sesión y un identificador de documento.");
  return doc(db, "users", uid, name, id);
}

export function subscribeToUserData(uid, { onProjects, onNotes, onReminders, onError }) {
  const subscriptions = [
    [userCollection(uid, "projects"), onProjects],
    [userCollection(uid, "notes"), onNotes],
    [userCollection(uid, "reminders"), onReminders]
  ].map(([ref, callback]) => onSnapshot(
    ref,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    (error) => onError(error)
  ));

  return () => subscriptions.forEach((unsubscribe) => unsubscribe());
}

export async function createProject(uid, values) {
  const now = serverTimestamp();
  return addDoc(userCollection(uid, "projects"), {
    name: values.name.trim(),
    description: values.description.trim(),
    createdAt: now,
    updatedAt: now
  });
}

export async function updateProject(uid, id, values) {
  return updateDoc(userDocument(uid, "projects", id), {
    name: values.name.trim(),
    description: values.description.trim(),
    updatedAt: serverTimestamp()
  });
}

export async function deleteProject(uid, id) {
  const notesSnapshot = await getDocs(query(userCollection(uid, "notes"), where("projectId", "==", id)));
  const docs = notesSnapshot.docs;

  for (let offset = 0; offset < docs.length; offset += 450) {
    const batch = writeBatch(db);
    docs.slice(offset, offset + 450).forEach((note) => {
      batch.update(note.ref, { projectId: null, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }

  return deleteDoc(userDocument(uid, "projects", id));
}

export async function createNote(uid, values) {
  const now = serverTimestamp();
  return addDoc(userCollection(uid, "notes"), {
    title: values.title.trim(),
    content: values.content.trim(),
    projectId: values.projectId || null,
    priority: values.priority || "none",
    codeHtml: values.codeHtml || "",
    codeCss: values.codeCss || "",
    codeJs: values.codeJs || "",
    createdAt: now,
    updatedAt: now
  });
}

export async function updateNote(uid, id, values) {
  return updateDoc(userDocument(uid, "notes", id), {
    title: values.title.trim(),
    content: values.content.trim(),
    projectId: values.projectId || null,
    priority: values.priority || "none",
    codeHtml: values.codeHtml || "",
    codeCss: values.codeCss || "",
    codeJs: values.codeJs || "",
    updatedAt: serverTimestamp()
  });
}

export async function deleteNote(uid, id) {
  return deleteDoc(userDocument(uid, "notes", id));
}

export async function createReminder(uid, values) {
  const now = serverTimestamp();
  return addDoc(userCollection(uid, "reminders"), {
    title: values.title.trim(),
    description: values.description.trim(),
    date: values.date,
    time: values.time,
    createdAt: now,
    updatedAt: now
  });
}

export async function updateReminder(uid, id, values) {
  return updateDoc(userDocument(uid, "reminders", id), {
    title: values.title.trim(),
    description: values.description.trim(),
    date: values.date,
    time: values.time,
    updatedAt: serverTimestamp()
  });
}

export async function deleteReminder(uid, id) {
  return deleteDoc(userDocument(uid, "reminders", id));
}
