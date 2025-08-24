// services/qrLib.ts
// pass funcstion form fSCofnig file--
import { db, auth, signInAnon } from "./firebaseConfig";

// actula furstore functiosns---
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  limit as qLimit, // Alias to avoid name collisions
  type QueryConstraint, // for typing the constraints array??
} from "firebase/firestore";

// feth data from qrServiec--- we'll store
import type { DecodedQR } from "./qrService";

// VAlue/Types from the DAta we'll storeu
export type StoredScan = {
  id: string;
  type: DecodedQR["type"];
  value: string;
  label: DecodedQR["label"];
  raw: string;
  createdAt: number; //tmispmt
};

/** ---- chekfor auth user */
async function ensureAuthed() {
  if (!auth.currentUser) {
    await signInAnon();
  }
}

/** Save e/a Scan --> current user */
export async function saveScan(decoded: {
  type: DecodedQR["type"];
  value: string;
  label: DecodedQR["label"];
  raw: string;
}) {
  // check for user-logIn (anon OK)
  await ensureAuthed();

  // fetch their ID
  const uid = auth.currentUser!.uid;

  // wait for newScan to pass --
  await addDoc(collection(db, "users", uid, "scans"), {
    type: decoded.type,
    value: decoded.value,
    label: decoded.label,
    raw: decoded.raw,
    createdAt: serverTimestamp(),
  });
}
/** Fetch Saved QR scans Max/limti @10==> current user */
/** Fetch Saved QR scans Max/limti @10==> current user */
export async function listScans(
  opts: { limit?: number } = {}
): Promise<StoredScan[]> {
  // confrim logged in
  await ensureAuthed();
  //   userID
  const uid = auth.currentUser!.uid;

  // build constraints (avoid undefined)
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (typeof opts.limit === "number") constraints.push(qLimit(opts.limit));

  const q = query(collection(db, "users", uid, "scans"), ...constraints);

  // functoun to to handle new Scans --
  const snap = await getDocs(q); //get list@firestore db--

  // loop==> e/a doc @ firesotre db--
  return snap.docs.map((d) => {
    const data = d.data() as any;
    // Timestamp hadnlign — serverTimestamp() value can be null locally once
    const ts =
      (data.createdAt?.toMillis?.() as number | undefined) ?? Date.now();
    return {
      id: d.id,
      type: data.type,
      value: data.value,
      label: data.label,
      raw: data.raw,
      createdAt: ts,
    };
  });
}
