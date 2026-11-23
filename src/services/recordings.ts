/**
 * IndexedDB store for lesson mic recordings (bm.js `bmDB`/`bmPut`/`bmGet`).
 * Database "nh-rec" v1, object store "rec": key -> { b: Blob, d: date string }.
 */
export interface RecEntry {
  /** audio blob produced by MediaRecorder */
  b: Blob;
  /** ngày ghi (toLocaleDateString("vi-VN")) */
  d: string;
}

function recDb(): Promise<IDBDatabase> {
  return new Promise((ok, no) => {
    try {
      const r = indexedDB.open("nh-rec", 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("rec");
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => no(r.error);
    } catch (e) {
      no(e);
    }
  });
}

export async function recPut(k: string, v: RecEntry): Promise<void> {
  try {
    const db = await recDb();
    db.transaction("rec", "readwrite").objectStore("rec").put(v, k);
  } catch {
    /* noop */
  }
}

export async function recGet(k: string): Promise<RecEntry | null> {
  try {
    const db = await recDb();
    return await new Promise((ok) => {
      const q = db.transaction("rec").objectStore("rec").get(k);
      q.onsuccess = () => ok((q.result as RecEntry | undefined) || null);
      q.onerror = () => ok(null);
    });
  } catch {
    return null;
  }
}
