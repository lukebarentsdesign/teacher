"use client";

/**
 * Minimal IndexedDB wrapper for caching the "My Day" view-only offline snapshot. Deliberately not
 * a general-purpose offline layer — one object store, one record per teacher, convenience-only
 * (not encrypted at rest). Cleared on sign-out (see user-menu.tsx) so a lost/shared device doesn't
 * retain guardian contact info after logout.
 */

const DB_NAME = "learnio-offline";
const STORE = "today-snapshot";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTodaySnapshot<T>(teacherId: string, data: T): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ data, cachedAt: new Date().toISOString() }, teacherId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadTodaySnapshot<T>(
  teacherId: string
): Promise<{ data: T; cachedAt: string } | null> {
  const db = await openDb();
  const result = await new Promise<{ data: T; cachedAt: string } | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(teacherId);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function clearOfflineCache(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
