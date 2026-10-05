import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Coffee, Plus, Pencil, Trash2, ExternalLink, Copy, Check, Download,
  LayoutDashboard, UtensilsCrossed, ClipboardList, Palette, QrCode, Upload,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import {
  getMyCafe, updateCafe, addCategory, updateCategory, deleteCategory,
  upsertMenuItem, deleteMenuItem, listOrders, setOrderStatus, subscribeOrders,
  getOrderItems, fmtCAD,
  type Cafe, type Category, type MenuItem, type Order, type OrderItem, type Option,
} from "@/lib/store";
import { CafeImage } from "@/lib/storage-image";
import { useUpload } from "@/lib/upload";

type MyData = { cafe: Cafe; categories: Category[]; items: MenuItem[] };

export default function Dashboard() {
  const { t } = useLang();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<MyData | null | undefined>(undefined);

  const refresh = () => user && getMyCafe(user.uid).then(setData).catch(() => setData(null));

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  if (loading || data === undefined)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Coffee className="h-8 w-8 animate-pulse text-amber-800" />
      </div>
    );

  if (user && !data)
    return (
      <div className="min-h-screen bg-[#faf7f2]">
        <Header />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <Coffee className="mx-auto h-12 w-12 text-amber-800" />
          <h1 className="mt-4 text-2xl font-bold">{t("needCafe")}</h1>
          <Button asChild className="mt-6 h-12 bg-amber-800 px-8 hover:bg-amber-900">
            <Link to="/register">{t("registerNow")}</Link>
          </Button>
        </div>
      </div>
    );

  if (!data || !user) return null;
  const { cafe, categories, items } = data;
  const menuUrl = `${window.location.origin}/c/${cafe.slug}`;

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border bg-white shadow-sm">
              <CafeImage
                url={cafe.logoUrl}
                alt=""
                className="h-full w-full object-cover"
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-white" style={{ backgroundColor: cafe.themeColor }}>
                    <Coffee className="h-7 w-7" />
                  </div>
                }
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{cafe.nameEn}</h1>
              <a href={menuUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-amber-800 underline">
                /c/{cafe.slug} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              { v: "orders", icon: ClipboardList, label: t("ordersTab") },
              { v: "menu", icon: UtensilsCrossed, label: t("menuTab") },
              { v: "branding", icon: Palette, label: t("branding") },
              { v: "share", icon: QrCode, label: t("share") },
              { v: "overview", icon: LayoutDashboard, label: t("overview") },
            ].map((tab) => (
              <TabsTrigger
                key={tab.v}
                value={tab.v}
                className="min-h-11 gap-2 rounded-full border bg-white px-4 data-[state=active]:bg-amber-800 data-[state=active]:text-white"
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="orders" className="mt-6"><OrdersTab cafe={cafe} /></TabsContent>
          <TabsContent value="menu" className="mt-6"><MenuTab cafe={cafe} categories={categories} items={items} onChange={refresh} /></TabsContent>
          <TabsContent value="branding" className="mt-6"><BrandingTab cafe={cafe} uid={user.uid} onChange={refresh} /></TabsContent>
          <TabsContent value="share" className="mt-6"><ShareTab url={menuUrl} /></TabsContent>
          <TabsContent value="overview" className="mt-6"><OverviewTab cafe={cafe} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function OverviewTab({ cafe }: { cafe: Cafe }) {
  const { t } = useLang();
  const [stats, setStats] = useState({ totalOrders: 0, revenueCents: 0, activeOrders: 0 });
  useEffect(() => {
    listOrders(cafe.id).then((list) => {
      const valid = list.filter(({ order }) => order.status !== "cancelled");
      setStats({
        totalOrders: valid.length,
        revenueCents: valid.reduce((s, { order }) => s + order.totalCents, 0),
        activeOrders: list.filter(({ order }) => ["pending", "preparing", "ready"].includes(order.status)).length,
      });
    });
  }, [cafe.id]);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: t("activeOrders"), value: stats.activeOrders },
        { label: t("totalOrders"), value: stats.totalOrders },
        { label: t("revenue"), value: fmtCAD(stats.revenueCents) },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent className="p-6">
            <p className="text-sm text-stone-500">{s.label}</p>
            <p className="mt-2 text-3xl font-extrabold">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Orders (live) ---------------- */
function OrdersTab({ cafe }: { cafe: Cafe }) {
  const { t, lang } = useLang();
  const [history, setHistory] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, OrderItem[]>>({});

  useEffect(() => subscribeOrders(cafe.id, async (list) => {
    setOrders(list);
    const map: Record<string, OrderItem[]> = {};
    for (const o of list) map[o.id] = await getOrderItems(o.id);
    setItemsMap(map);
  }), [cafe.id]);

  const statusLabel: Record<string, string> = {
    pending: t("pending"), preparing: t("preparing"), ready: t("ready"),
    completed: t("completed"), cancelled: t("cancelled"),
  };

  const visible = history
    ? orders
    : orders.filter((o) => ["pending", "preparing", "ready"].includes(o.status));

  const ts = (o: Order) =>
    o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString(lang === "fr" ? "fr-CA" : "en-CA") : "";

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setHistory((h) => !h)}>
          {history ? t("hideHistory") : t("showHistory")}
        </Button>
      </div>
      {visible.length === 0 ? (
        <p className="py-16 text-center text-stone-500">{t("noOrders")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((order) => (
            <Card key={order.id} className={order.status === "cancelled" ? "opacity-60" : ""}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-extrabold">#{order.orderNumber}</span>
                    <span className="ml-2 text-stone-600">{order.customerName}</span>
                  </div>
                  <Badge className={{
                    pending: "bg-yellow-100 text-yellow-800", preparing: "bg-blue-100 text-blue-800",
                    ready: "bg-green-100 text-green-800", completed: "bg-stone-100 text-stone-600",
                    cancelled: "bg-red-100 text-red-700",
                  }[order.status]}>
                    {statusLabel[order.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-stone-400">{ts(order)}</p>
                <div className="mt-3 space-y-1 text-sm">
                  {(itemsMap[order.id] ?? []).map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span>
                        {it.quantity}× {lang === "fr" && it.itemNameFr ? it.itemNameFr : it.itemNameEn}
                        {it.optionsText && <span className="text-stone-400"> · {it.optionsText}</span>}
                      </span>
                      <span className="text-stone-500">{fmtCAD(it.unitPriceCents * it.quantity)}</span>
                    </div>
                  ))}
                  {order.notes && <p className="rounded-lg bg-amber-50 p-2 text-amber-900">📝 {order.notes}</p>}
                  <div className="flex justify-between border-t pt-1 font-bold">
                    <span>{t("total")}</span><span>{fmtCAD(order.totalCents)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === "pending" && (
                    <Button size="sm" className="min-h-11 bg-blue-600 hover:bg-blue-700" onClick={() => setOrderStatus(order.id, "preparing")}>
                      {t("markPreparing")}
                    </Button>
                  )}
                  {order.status === "preparing" && (
                    <Button size="sm" className="min-h-11 bg-green-600 hover:bg-green-700" onClick={() => setOrderStatus(order.id, "ready")}>
                      {t("markReady")}
                    </Button>
                  )}
                  {order.status === "ready" && (
                    <Button size="sm" variant="secondary" className="min-h-11" onClick={() => setOrderStatus(order.id, "completed")}>
                      {t("markCompleted")}
                    </Button>
                  )}
                  {(order.status === "pending" || order.status === "preparing") && (
                    <Button size="sm" variant="outline" className="min-h-11 text-red-600" onClick={() => setOrderStatus(order.id, "cancelled")}>
                      {t("cancelOrder")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Menu ---------------- */
function MenuTab({ cafe, categories, items, onChange }: {
  cafe: Cafe; categories: Category[]; items: MenuItem[]; onChange: () => void;
}) {
  const { t, lang } = useLang();
  const [catDialog, setCatDialog] = useState<{ id?: string; nameEn: string; nameFr: string } | null>(null);
  const [itemDialog, setItemDialog] = useState<Partial<MenuItem> | null>(null);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setItemDialog({})} className="min-h-11 bg-amber-800 hover:bg-amber-900">
          <Plus className="mr-1 h-4 w-4" /> {t("addItem")}
        </Button>
        <Button variant="outline" className="min-h-11" onClick={() => setCatDialog({ nameEn: "", nameFr: "" })}>
          <Plus className="mr-1 h-4 w-4" /> {t("addCategory")}
        </Button>
      </div>

      <div className="mt-6 space-y-8">
        {[...categories, null].map((cat) => {
          const catItems = items.filter((i) => (cat ? i.categoryId === cat.id : !i.categoryId));
          return (
            <section key={cat?.id ?? "none"}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {cat ? (lang === "fr" && cat.nameFr ? cat.nameFr : cat.nameEn) : t("uncategorized")}
                </h3>
                {cat && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-11 w-11"
                      onClick={() => setCatDialog({ id: cat.id, nameEn: cat.nameEn, nameFr: cat.nameFr ?? "" })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600"
                      onClick={() => confirm("Delete category?") && deleteCategory(cat.id).then(onChange)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {catItems.length === 0 ? (
                <p className="mt-2 text-sm text-stone-400">—</p>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border bg-white p-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        <CafeImage url={item.imageUrl} alt="" className="h-full w-full object-cover"
                          fallback={<Coffee className="m-4 h-6 w-6 text-stone-300" />} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {item.nameEn}
                          {!item.isAvailable && <Badge className="ml-2 bg-stone-200 text-stone-600">off</Badge>}
                        </p>
                        <p className="text-sm font-semibold text-amber-800">{fmtCAD(item.priceCents)}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => setItemDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600"
                        onClick={() => confirm("Delete item?") && deleteMenuItem(item.id).then(onChange)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <Dialog open={!!catDialog} onOpenChange={() => setCatDialog(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>{t("addCategory")}</DialogTitle></DialogHeader>
          {catDialog && (
            <div className="space-y-3">
              <Input placeholder="Name (EN) *" className="h-12" value={catDialog.nameEn}
                onChange={(e) => setCatDialog({ ...catDialog, nameEn: e.target.value })} />
              <Input placeholder="Nom (FR)" className="h-12" value={catDialog.nameFr}
                onChange={(e) => setCatDialog({ ...catDialog, nameFr: e.target.value })} />
              <Button
                className="h-12 w-full bg-amber-800 hover:bg-amber-900"
                disabled={!catDialog.nameEn.trim()}
                onClick={async () => {
                  if (catDialog.id)
                    await updateCategory(catDialog.id, { nameEn: catDialog.nameEn.trim(), nameFr: catDialog.nameFr.trim() });
                  else
                    await addCategory(cafe.id, catDialog.nameEn.trim(), catDialog.nameFr.trim(), categories.length);
                  setCatDialog(null);
                  onChange();
                }}
              >
                {t("save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {itemDialog && (
        <ItemDialog item={itemDialog} cafe={cafe} categories={categories}
          onClose={() => setItemDialog(null)}
          onSaved={() => { setItemDialog(null); onChange(); }} />
      )}
    </div>
  );
}

function parseLines(s: string): Option[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(.*?)\s+(\d+(?:\.\d+)?)$/);
    if (m) return { labelEn: m[1].trim(), deltaCents: Math.round(parseFloat(m[2]) * 100) };
    return { labelEn: l, deltaCents: 0 };
  });
}

function toLines(opts?: Option[]): string {
  return (opts ?? []).map((o) => `${o.labelEn} ${(o.deltaCents / 100).toFixed(2)}`).join("\n");
}

function ItemDialog({ item, cafe, categories, onClose, onSaved }: {
  item: Partial<MenuItem>; cafe: Cafe; categories: Category[];
  onClose: () => void; onSaved: () => void;
}) {
  const { t } = useLang();
  const { user } = useAuth();
  const isNew = !item.id;
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    nameEn: item.nameEn ?? "",
    nameFr: item.nameFr ?? "",
    descriptionEn: item.descriptionEn ?? "",
    descriptionFr: item.descriptionFr ?? "",
    price: item.priceCents != null ? (item.priceCents / 100).toFixed(2) : "",
    categoryId: item.categoryId ?? null as string | null,
    available: item.isAvailable !== false,
    sizes: toLines(item.sizes),
    extras: toLines(item.extras),
    imageUrl: item.imageUrl ?? null as string | null,
  });
  const { upload, uploading } = useUpload(user?.uid);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    setBusy(true);
    try {
      await upsertMenuItem({
        cafeId: cafe.id,
        categoryId: f.categoryId,
        nameEn: f.nameEn.trim(),
        nameFr: f.nameFr.trim(),
        descriptionEn: f.descriptionEn.trim(),
        descriptionFr: f.descriptionFr.trim(),
        priceCents: Math.round(parseFloat(f.price || "0") * 100),
        imageUrl: f.imageUrl ?? "",
        sizes: parseLines(f.sizes),
        extras: parseLines(f.extras),
        isAvailable: f.available,
      }, item.id);
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto rounded-3xl">
        <DialogHeader><DialogTitle>{isNew ? t("addItem") : t("editItem")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-xl border bg-stone-100">
              <CafeImage url={f.imageUrl} alt="" className="h-full w-full object-cover"
                fallback={<Coffee className="m-6 h-8 w-8 text-stone-300" />} />
            </div>
            <Button variant="outline" className="min-h-11" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> {uploading ? "…" : t("imageOptional")}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await upload(file);
                  setF((p) => ({ ...p, imageUrl: url }));
                } catch { toast.error("Upload failed"); }
              }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{t("itemName")} *</Label>
              <Input className="mt-1 h-12" value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} />
            </div>
            <div>
              <Label>{t("itemNameFr")}</Label>
              <Input className="mt-1 h-12" value={f.nameFr} onChange={(e) => setF({ ...f, nameFr: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{t("price")} *</Label>
              <Input className="mt-1 h-12" inputMode="decimal" value={f.price}
                onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="4.50" />
            </div>
            <div>
              <Label>{t("category")}</Label>
              <Select value={f.categoryId ?? "none"} onValueChange={(v) => setF({ ...f, categoryId: v === "none" ? null : v })}>
                <SelectTrigger className="mt-1 h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("uncategorized")}</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t("description")}</Label>
            <Textarea className="mt-1" rows={2} value={f.descriptionEn} onChange={(e) => setF({ ...f, descriptionEn: e.target.value })} />
          </div>
          <div>
            <Label>{t("descriptionFr")}</Label>
            <Textarea className="mt-1" rows={2} value={f.descriptionFr} onChange={(e) => setF({ ...f, descriptionFr: e.target.value })} />
          </div>
          <div>
            <Label>{t("size")}</Label>
            <Textarea className="mt-1" rows={2} placeholder={t("sizesLabel")} value={f.sizes} onChange={(e) => setF({ ...f, sizes: e.target.value })} />
          </div>
          <div>
            <Label>{t("extras")}</Label>
            <Textarea className="mt-1" rows={2} placeholder={t("extrasLabel")} value={f.extras} onChange={(e) => setF({ ...f, extras: e.target.value })} />
            <p className="mt-1 text-xs text-stone-400">{t("optionsHelp")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={f.available} onCheckedChange={(v) => setF({ ...f, available: v })} />
            <Label>{t("available")}</Label>
          </div>
          <Button className="h-12 w-full bg-amber-800 hover:bg-amber-900"
            disabled={!f.nameEn.trim() || !f.price || busy} onClick={save}>
            {busy ? "…" : t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Branding ---------------- */
function BrandingTab({ cafe, uid, onChange }: { cafe: Cafe; uid: string; onChange: () => void }) {
  const { t } = useLang();
  const [f, setF] = useState({
    nameEn: cafe.nameEn, nameFr: cafe.nameFr ?? "",
    descriptionEn: cafe.descriptionEn ?? "", descriptionFr: cafe.descriptionFr ?? "",
    address: cafe.address ?? "", phone: cafe.phone ?? "", themeColor: cafe.themeColor,
  });
  const { upload, uploading } = useUpload(uid);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const saveInfo = async () => {
    setBusy(true);
    try {
      await updateCafe(cafe.id, {
        nameEn: f.nameEn.trim(), nameFr: f.nameFr.trim(),
        descriptionEn: f.descriptionEn.trim(), descriptionFr: f.descriptionFr.trim(),
        address: f.address.trim(), phone: f.phone.trim(), themeColor: f.themeColor,
      });
      toast.success("✓");
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const saveImg = (field: "logoUrl" | "bannerUrl") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await upload(file);
      await updateCafe(cafe.id, { [field]: url });
      toast.success("✓");
      onChange();
    } catch {
      toast.error("Upload failed");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-5 p-6">
          <h3 className="font-bold">{t("branding")}</h3>
          <div>
            <Label>{t("logo")}</Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border bg-white">
                <CafeImage url={cafe.logoUrl} alt="" className="h-full w-full object-cover"
                  fallback={<Coffee className="m-6 h-8 w-8 text-stone-300" />} />
              </div>
              <Button variant="outline" className="min-h-11" disabled={uploading} onClick={() => logoRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> {t("uploadImage")}
              </Button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={saveImg("logoUrl")} />
            </div>
          </div>
          <div>
            <Label>{t("banner")}</Label>
            <div className="mt-2 overflow-hidden rounded-2xl border bg-stone-100">
              <div className="h-32">
                <CafeImage url={cafe.bannerUrl} alt="" className="h-full w-full object-cover"
                  fallback={<Coffee className="m-12 h-8 w-8 text-stone-300" />} />
              </div>
            </div>
            <Button variant="outline" className="mt-2 min-h-11" disabled={uploading} onClick={() => bannerRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> {t("uploadImage")}
            </Button>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={saveImg("bannerUrl")} />
          </div>
          <div>
            <Label>{t("themeColor")}</Label>
            <div className="mt-2 flex items-center gap-3">
              <input type="color" value={f.themeColor} onChange={(e) => setF({ ...f, themeColor: e.target.value })}
                className="h-12 w-16 cursor-pointer rounded-lg border" />
              <span className="font-mono text-sm">{f.themeColor}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="font-bold">{t("cafeInfo")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("cafeName")}</Label>
              <Input className="mt-1 h-12" value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} />
            </div>
            <div>
              <Label>{t("cafeNameFr")}</Label>
              <Input className="mt-1 h-12" value={f.nameFr} onChange={(e) => setF({ ...f, nameFr: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>{t("description")}</Label>
            <Textarea className="mt-1" rows={2} value={f.descriptionEn} onChange={(e) => setF({ ...f, descriptionEn: e.target.value })} />
          </div>
          <div>
            <Label>{t("descriptionFr")}</Label>
            <Textarea className="mt-1" rows={2} value={f.descriptionFr} onChange={(e) => setF({ ...f, descriptionFr: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("address")}</Label>
              <Input className="mt-1 h-12" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
            </div>
            <div>
              <Label>{t("phone")}</Label>
              <Input className="mt-1 h-12" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
          </div>
          <Button className="h-12 w-full bg-amber-800 hover:bg-amber-900" disabled={busy || !f.nameEn.trim()} onClick={saveInfo}>
            {t("save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Share ---------------- */
function ShareTab({ url }: { url: string }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "cafe-qr.png";
    a.click();
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold">{t("yourLink")}</h3>
          <div className="mt-3 flex items-center gap-2">
            <Input readOnly value={url} className="h-12 font-mono text-sm" onFocus={(e) => e.target.select()} />
            <Button variant="outline" className="h-12 w-12 shrink-0" onClick={copy}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {copied && <p className="mt-2 text-sm text-green-600">{t("copied")}</p>}
          <Button asChild variant="outline" className="mt-3 min-h-11">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1 h-4 w-4" /> {t("viewMenu")}
            </a>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-bold">{t("yourQR")}</h3>
          <div ref={qrRef} className="mx-auto mt-4 inline-block rounded-2xl border bg-white p-4">
            <QRCodeCanvas value={url} size={220} level="H" includeMargin />
          </div>
          <div>
            <Button className="mt-4 min-h-11 bg-amber-800 hover:bg-amber-900" onClick={download}>
              <Download className="mr-1 h-4 w-4" /> {t("downloadQR")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
