import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot,
  orderBy, query, serverTimestamp, setDoc, updateDoc, where,
  type Timestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "./firebase";

// ---------------- Types ----------------
export interface Cafe {
  id: string;
  ownerId: string;
  slug: string;
  nameEn: string;
  nameFr?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  bannerUrl?: string;
  themeColor: string;
  isActive: boolean;
  createdAt?: Timestamp;
}

export interface Category {
  id: string;
  cafeId: string;
  nameEn: string;
  nameFr?: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  cafeId: string;
  categoryId?: string | null;
  nameEn: string;
  nameFr?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  priceCents: number;
  imageUrl?: string;
  sizes: Option[];
  extras: Option[];
  isAvailable: boolean;
  sortOrder: number;
}

export interface Option { labelEn: string; labelFr?: string; deltaCents: number }

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export interface Order {
  id: string;
  cafeId: string;
  orderNumber: number;
  customerName: string;
  notes?: string;
  status: OrderStatus;
  totalCents: number;
  createdAt?: Timestamp;
}

export interface OrderItem {
  id?: string;
  itemNameEn: string;
  itemNameFr?: string;
  unitPriceCents: number;
  quantity: number;
  optionsText?: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  role: "user" | "admin";
}

// ---------------- Auth ----------------
export function subscribeAuth(cb: (u: AppUser | null, loading: boolean) => void) {
  cb(null, true);
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) return cb(null, false);
    let role: "user" | "admin" = "user";
    try {
      const snap = await getDoc(doc(db, "users", fbUser.uid));
      if (snap.exists() && snap.data().role === "admin") role = "admin";
    } catch { /* rules may restrict; default user */ }
    cb({ uid: fbUser.uid, email: fbUser.email, role }, false);
  });
}

export async function signUp(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), { email, role: "user", createdAt: serverTimestamp() });
  return cred.user;
}

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

// ---------------- Helpers ----------------
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "cafe";

async function uniqueSlug(base: string): Promise<string> {
  let slug = base, i = 2;
  for (;;) {
    const q = query(collection(db, "cafes"), where("slug", "==", slug), limit(1));
    if ((await getDocs(q)).empty) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function uploadImage(uid: string, file: File): Promise<string> {
  const r = ref(storage, `cafes/${uid}/${Date.now()}-${file.name}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

// ---------------- Cafés ----------------
export async function getCafeBySlug(slug: string) {
  const q = query(collection(db, "cafes"), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const cafe = { id: snap.docs[0].id, ...snap.docs[0].data() } as Cafe;
  if (!cafe.isActive) return null;
  const [cats, items] = await Promise.all([listCategories(cafe.id), listMenuItems(cafe.id, true)]);
  return { cafe, categories: cats, items };
}

export async function listFeaturedCafes(): Promise<Cafe[]> {
  const q = query(collection(db, "cafes"), where("isActive", "==", true), limit(24));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cafe);
}

export async function getMyCafe(uid: string) {
  const q = query(collection(db, "cafes"), where("ownerId", "==", uid), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const cafe = { id: snap.docs[0].id, ...snap.docs[0].data() } as Cafe;
  const [cats, items] = await Promise.all([listCategories(cafe.id), listMenuItems(cafe.id)]);
  return { cafe, categories: cats, items };
}

export async function createCafe(uid: string, data: Partial<Cafe> & { nameEn: string }) {
  const slug = await uniqueSlug(slugify(data.nameEn));
  const refDoc = await addDoc(collection(db, "cafes"), {
    ownerId: uid, slug, themeColor: "#6F4E37", isActive: true,
    ...data, createdAt: serverTimestamp(),
  });
  return { id: refDoc.id, slug };
}

export const updateCafe = (cafeId: string, data: Partial<Cafe>) =>
  updateDoc(doc(db, "cafes", cafeId), data as Record<string, unknown>);

// ---------------- Categories & items ----------------
export async function listCategories(cafeId: string): Promise<Category[]> {
  const q = query(collection(db, "categories"), where("cafeId", "==", cafeId), orderBy("sortOrder"));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
}

export async function listMenuItems(cafeId: string, availableOnly = false): Promise<MenuItem[]> {
  const constraints = [where("cafeId", "==", cafeId), orderBy("sortOrder")];
  if (availableOnly) constraints.splice(1, 0, where("isAvailable", "==", true));
  const q = query(collection(db, "menuItems"), ...constraints);
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }) as MenuItem);
}

export const addCategory = (cafeId: string, nameEn: string, nameFr: string, sortOrder: number) =>
  addDoc(collection(db, "categories"), { cafeId, nameEn, nameFr, sortOrder });

export const updateCategory = (id: string, data: Partial<Category>) =>
  updateDoc(doc(db, "categories", id), data as Record<string, unknown>);

export const deleteCategory = (id: string) => deleteDoc(doc(db, "categories", id));

export const upsertMenuItem = (data: Partial<MenuItem> & { cafeId: string }, id?: string) =>
  id
    ? updateDoc(doc(db, "menuItems", id), data as Record<string, unknown>)
    : addDoc(collection(db, "menuItems"), { ...data, sortOrder: 999 });

export const deleteMenuItem = (id: string) => deleteDoc(doc(db, "menuItems", id));

// ---------------- Orders ----------------
export async function placeOrder(
  slug: string,
  customerName: string,
  notes: string | undefined,
  lines: { itemId: string; quantity: number; sizeLabel?: string; extrasLabels: string[] }[],
) {
  const found = await getCafeBySlug(slug);
  if (!found) throw new Error("Café not found");
  const { cafe, items } = found;

  let total = 0;
  const orderLines: Omit<OrderItem, "id">[] = [];
  for (const line of lines) {
    const item = items.find((i) => i.id === line.itemId);
    if (!item || !item.isAvailable) throw new Error("Item unavailable");
    let unit = item.priceCents;
    const opts: string[] = [];
    if (line.sizeLabel) {
      const s = item.sizes.find((x) => x.labelEn === line.sizeLabel);
      if (s) { unit += s.deltaCents; opts.push(s.labelEn); }
    }
    for (const ex of line.extrasLabels) {
      const e = item.extras.find((x) => x.labelEn === ex);
      if (e) { unit += e.deltaCents; opts.push(`+ ${e.labelEn}`); }
    }
    total += unit * line.quantity;
    orderLines.push({
      itemNameEn: item.nameEn, itemNameFr: item.nameFr,
      unitPriceCents: unit, quantity: line.quantity, optionsText: opts.join(", "),
    });
  }

  const existing = await listOrders(cafe.id);
  const orderNumber = existing.length + 1;
  const orderRef = await addDoc(collection(db, "orders"), {
    cafeId: cafe.id, orderNumber, customerName, notes: notes ?? "",
    status: "pending", totalCents: total, createdAt: serverTimestamp(),
  });
  for (const l of orderLines)
    await addDoc(collection(db, "orders", orderRef.id, "items"), l);
  return { orderId: orderRef.id, orderNumber, totalCents: total };
}

export async function trackOrder(slug: string, orderId: string) {
  const found = await getCafeBySlug(slug);
  if (!found) return null;
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  const order = { id: snap.id, ...snap.data() } as Order;
  if (order.cafeId !== found.cafe.id) return null;
  const itemsSnap = await getDocs(collection(db, "orders", orderId, "items"));
  const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrderItem);
  return { order, items };
}

export async function listOrders(cafeId: string): Promise<{ order: Order; items: OrderItem[] }[]> {
  const q = query(collection(db, "orders"), where("cafeId", "==", cafeId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const result: { order: Order; items: OrderItem[] }[] = [];
  for (const d of snap.docs) {
    const itemsSnap = await getDocs(collection(db, "orders", d.id, "items"));
    result.push({
      order: { id: d.id, ...d.data() } as Order,
      items: itemsSnap.docs.map((x) => ({ id: x.id, ...x.data() }) as OrderItem),
    });
  }
  return result.slice(0, 100);
}

export const setOrderStatus = (orderId: string, status: OrderStatus) =>
  updateDoc(doc(db, "orders", orderId), { status });

/** Live subscription to orders for the owner dashboard. */
export function subscribeOrders(
  cafeId: string,
  cb: (orders: Order[]) => void,
) {
  const q = query(collection(db, "orders"), where("cafeId", "==", cafeId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order).slice(0, 100)),
  );
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const snap = await getDocs(collection(db, "orders", orderId, "items"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrderItem);
}

/** Live subscription for customer order tracking. */
export function subscribeOrder(orderId: string, cb: (order: Order | null) => void) {
  return onSnapshot(doc(db, "orders", orderId), (snap) =>
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null),
  );
}

// ---------------- Admin ----------------
export async function adminListCafes(): Promise<(Cafe & { orderCount: number })[]> {
  const snap = await getDocs(collection(db, "cafes"));
  const cafes = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cafe);
  const ordersSnap = await getDocs(collection(db, "orders"));
  const counts = new Map<string, number>();
  ordersSnap.docs.forEach((d) => {
    const cid = d.data().cafeId as string;
    counts.set(cid, (counts.get(cid) ?? 0) + 1);
  });
  return cafes.map((c) => ({ ...c, orderCount: counts.get(c.id) ?? 0 }));
}

export const adminSetCafeActive = (cafeId: string, isActive: boolean) =>
  updateDoc(doc(db, "cafes", cafeId), { isActive });

export async function adminDeleteCafe(cafeId: string) {
  const ordersSnap = await getDocs(query(collection(db, "orders"), where("cafeId", "==", cafeId)));
  for (const d of ordersSnap.docs) {
    const itemsSnap = await getDocs(collection(db, "orders", d.id, "items"));
    for (const it of itemsSnap.docs) await deleteDoc(it.ref);
    await deleteDoc(d.ref);
  }
  const itemsSnap = await getDocs(query(collection(db, "menuItems"), where("cafeId", "==", cafeId)));
  for (const d of itemsSnap.docs) await deleteDoc(d.ref);
  const catsSnap = await getDocs(query(collection(db, "categories"), where("cafeId", "==", cafeId)));
  for (const d of catsSnap.docs) await deleteDoc(d.ref);
  await deleteDoc(doc(db, "cafes", cafeId));
}

export const fmtCAD = (cents: number) =>
  (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
