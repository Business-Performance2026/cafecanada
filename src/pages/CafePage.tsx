import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Coffee, Minus, Plus, ShoppingBag, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { getCafeBySlug, placeOrder, fmtCAD, type Cafe, type Category, type MenuItem, type Option } from "@/lib/store";
import { CafeImage } from "@/lib/storage-image";
import { OrderTracker } from "@/components/OrderTracker";

type CartLine = {
  itemId: string;
  nameEn: string;
  nameFr?: string;
  imageUrl?: string;
  unitCents: number;
  quantity: number;
  sizeLabel?: string;
  extrasLabels: string[];
  optionsText: string;
};

type CafeData = { cafe: Cafe; categories: Category[]; items: MenuItem[] };

export default function CafePage() {
  const { slug = "" } = useParams();
  const { t, lang, toggle } = useLang();
  const [data, setData] = useState<CafeData | null | undefined>(undefined);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ orderId: string; orderNumber: number } | null>(null);

  useEffect(() => {
    getCafeBySlug(slug).then((d) => setData(d)).catch(() => setData(null));
  }, [slug]);

  const cafe = data?.cafe;
  const L = (en: string, fr?: string | null) => (lang === "fr" && fr ? fr : en);

  const grouped = useMemo(() => {
    if (!data) return [];
    const cats = data.categories.map((c) => ({
      id: c.id,
      name: L(c.nameEn, c.nameFr),
      items: data.items.filter((i) => i.categoryId === c.id),
    }));
    const unc = data.items.filter((i) => !i.categoryId);
    if (unc.length) cats.push({ id: "none", name: t("uncategorized"), items: unc });
    return cats.filter((c) => c.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lang]);

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.unitCents * l.quantity, 0);

  const addLine = (line: Omit<CartLine, "quantity">) =>
    setCart((c) => {
      const idx = c.findIndex(
        (x) => x.itemId === line.itemId && x.sizeLabel === line.sizeLabel && x.extrasLabels.join() === line.extrasLabels.join(),
      );
      if (idx >= 0) {
        const next = [...c];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...c, { ...line, quantity: 1 }];
    });

  const changeQty = (idx: number, delta: number) =>
    setCart((c) => c.map((l, i) => (i === idx ? { ...l, quantity: l.quantity + delta } : l)).filter((l) => l.quantity > 0));

  const submitOrder = async () => {
    setPlacing(true);
    try {
      const r = await placeOrder(
        slug,
        name.trim(),
        notes.trim() || undefined,
        cart.map((l) => ({ itemId: l.itemId, quantity: l.quantity, sizeLabel: l.sizeLabel, extrasLabels: l.extrasLabels })),
      );
      setPlaced({ orderId: r.orderId, orderNumber: r.orderNumber });
      setCart([]);
      setCartOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setPlacing(false);
    }
  };

  if (data === undefined)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Coffee className="h-8 w-8 animate-pulse text-amber-800" />
      </div>
    );
  if (!data || !cafe)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <Coffee className="h-12 w-12 text-stone-300" />
        <p className="text-stone-600">Café not found.</p>
        <Button asChild variant="outline"><Link to="/">{t("back")}</Link></Button>
      </div>
    );

  const theme = cafe.themeColor || "#6F4E37";

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      <div className="relative h-44 w-full overflow-hidden md:h-60" style={{ backgroundColor: theme }}>
        {cafe.bannerUrl && <CafeImage url={cafe.bannerUrl} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <Button asChild size="icon" variant="secondary" className="h-11 w-11 rounded-full bg-white/90">
            <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
        </div>
        <Button size="sm" variant="secondary" onClick={toggle} className="absolute right-4 top-4 bg-white/90 font-semibold">
          {lang === "en" ? "FR" : "EN"}
        </Button>
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <div className="-mt-12 flex items-end gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-lg">
            <CafeImage
              url={cafe.logoUrl}
              alt=""
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: theme }}>
                  <Coffee className="h-10 w-10 text-white" />
                </div>
              }
            />
          </div>
          <div className="pb-1 pt-14">
            <h1 className="text-2xl font-extrabold text-stone-900">{L(cafe.nameEn, cafe.nameFr)}</h1>
            {cafe.address && <p className="text-sm text-stone-500">{cafe.address}</p>}
          </div>
        </div>
        {(cafe.descriptionEn || cafe.descriptionFr) && (
          <p className="mt-3 text-stone-600">{L(cafe.descriptionEn ?? "", cafe.descriptionFr)}</p>
        )}
      </div>

      {placed && (
        <div className="mx-auto mt-6 max-w-3xl px-4">
          <div className="rounded-2xl border-2 p-5" style={{ borderColor: theme }}>
            <p className="text-lg font-bold text-stone-900">
              {t("orderPlaced")} {t("orderNumber")}{placed.orderNumber}
            </p>
            <p className="mt-1 text-sm text-stone-500">{t("trackBelow")}</p>
            <OrderTracker slug={slug} orderId={placed.orderId} accent={theme} />
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 mt-6 border-b bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3">
          <button
            onClick={() => setActiveCat("all")}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition ${activeCat === "all" ? "text-white" : "bg-white text-stone-700 border"}`}
            style={activeCat === "all" ? { backgroundColor: theme } : undefined}
          >
            {t("all")}
          </button>
          {grouped.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition ${activeCat === c.id ? "text-white" : "bg-white text-stone-700 border"}`}
              style={activeCat === c.id ? { backgroundColor: theme } : undefined}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4">
        {grouped.filter((g) => activeCat === "all" || g.id === activeCat).map((g) => (
          <section key={g.id} className="mt-8">
            <h2 className="text-xl font-bold text-stone-900">{g.name}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {g.items.map((item) => (
                <MenuCard key={item.id} item={item} lang={lang} theme={theme} onAdd={(line) => addLine({ ...line, itemId: item.id })} />
              ))}
            </div>
          </section>
        ))}
      </main>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between rounded-2xl px-6 text-base shadow-xl"
            style={{ backgroundColor: theme }}
            onClick={() => setCartOpen(true)}
          >
            <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> {cartCount}</span>
            <span>{t("yourOrder")}</span>
            <span className="font-bold">{fmtCAD(cartTotal)}</span>
          </Button>
        </div>
      )}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader><SheetTitle>{t("yourOrder")}</SheetTitle></SheetHeader>
          {cart.length === 0 ? (
            <p className="py-8 text-center text-stone-500">{t("cartEmpty")}</p>
          ) : (
            <div className="mt-4 space-y-4">
              {cart.map((l, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    <CafeImage url={l.imageUrl} alt="" className="h-full w-full object-cover" fallback={<Coffee className="m-4 h-6 w-6 text-stone-300" />} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{L(l.nameEn, l.nameFr)}</p>
                    {l.optionsText && <p className="truncate text-xs text-stone-500">{l.optionsText}</p>}
                    <p className="text-sm font-semibold" style={{ color: theme }}>{fmtCAD(l.unitCents * l.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(i, -1)} className="flex h-11 w-11 items-center justify-center rounded-full border" aria-label="minus">
                      {l.quantity === 1 ? <X className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </button>
                    <span className="w-6 text-center font-semibold">{l.quantity}</span>
                    <button onClick={() => changeQty(i, 1)} className="flex h-11 w-11 items-center justify-center rounded-full border" aria-label="plus">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="space-y-3 pt-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} className="h-12" />
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPh")} rows={2} />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>{t("total")}</span><span>{fmtCAD(cartTotal)}</span>
                </div>
                <Button
                  className="h-14 w-full rounded-2xl text-base"
                  style={{ backgroundColor: theme }}
                  disabled={!name.trim() || placing}
                  onClick={submitOrder}
                >
                  {placing ? "…" : `${t("placeOrder")} · ${fmtCAD(cartTotal)}`}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MenuCard({ item, lang, theme, onAdd }: {
  item: MenuItem;
  lang: string;
  theme: string;
  onAdd: (line: Omit<CartLine, "quantity" | "itemId">) => void;
}) {
  const { t } = useLang();
  const sizes: Option[] = item.sizes ?? [];
  const extras: Option[] = item.extras ?? [];
  const hasOptions = sizes.length > 0 || extras.length > 0;
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<Option | null>(null);
  const [picked, setPicked] = useState<Option[]>([]);
  const L = (en: string, fr?: string | null) => (lang === "fr" && fr ? fr : en);

  const confirm = () => {
    const unit = item.priceCents + (size?.deltaCents ?? 0) + picked.reduce((s, e) => s + e.deltaCents, 0);
    const optionsText = [size && L(size.labelEn, size.labelFr), ...picked.map((e) => `+ ${L(e.labelEn, e.labelFr)}`)]
      .filter(Boolean).join(", ");
    onAdd({
      nameEn: item.nameEn, nameFr: item.nameFr, imageUrl: item.imageUrl,
      unitCents: unit, sizeLabel: size?.labelEn, extrasLabels: picked.map((e) => e.labelEn), optionsText,
    });
    setOpen(false); setSize(null); setPicked([]);
  };

  const quickAdd = () =>
    hasOptions ? setOpen(true) : onAdd({ nameEn: item.nameEn, nameFr: item.nameFr, imageUrl: item.imageUrl, unitCents: item.priceCents, extrasLabels: [], optionsText: "" });

  const liveUnit = item.priceCents + (size?.deltaCents ?? 0) + picked.reduce((s, e) => s + e.deltaCents, 0);

  return (
    <>
      <div className="flex gap-3 rounded-2xl border bg-white p-3 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-900">{L(item.nameEn, item.nameFr)}</p>
          {(item.descriptionEn || item.descriptionFr) && (
            <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">{L(item.descriptionEn ?? "", item.descriptionFr)}</p>
          )}
          <p className="mt-1 font-bold" style={{ color: theme }}>{fmtCAD(item.priceCents)}</p>
        </div>
        <div className="flex w-24 shrink-0 flex-col items-end gap-2">
          <div className="h-20 w-24 overflow-hidden rounded-xl bg-stone-100">
            <CafeImage url={item.imageUrl} alt="" className="h-full w-full object-cover" fallback={<Coffee className="m-7 h-8 w-8 text-stone-300" />} />
          </div>
          <Button size="sm" className="h-11 w-full rounded-xl" style={{ backgroundColor: theme }} onClick={quickAdd}>
            <Plus className="mr-1 h-4 w-4" /> {t("addToCart")}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader><DialogTitle>{L(item.nameEn, item.nameFr)}</DialogTitle></DialogHeader>
          {sizes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">{t("size")}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.labelEn}
                    onClick={() => setSize(s.labelEn === size?.labelEn ? null : s)}
                    className={`min-h-11 rounded-full border px-4 text-sm ${size?.labelEn === s.labelEn ? "text-white" : ""}`}
                    style={size?.labelEn === s.labelEn ? { backgroundColor: theme, borderColor: theme } : undefined}
                  >
                    {L(s.labelEn, s.labelFr)}{s.deltaCents > 0 && ` +${fmtCAD(s.deltaCents)}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          {extras.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold">{t("extras")}</p>
              <div className="flex flex-wrap gap-2">
                {extras.map((e) => {
                  const on = picked.some((p) => p.labelEn === e.labelEn);
                  return (
                    <button
                      key={e.labelEn}
                      onClick={() => setPicked((p) => (on ? p.filter((x) => x.labelEn !== e.labelEn) : [...p, e]))}
                      className={`min-h-11 rounded-full border px-4 text-sm ${on ? "text-white" : ""}`}
                      style={on ? { backgroundColor: theme, borderColor: theme } : undefined}
                    >
                      {L(e.labelEn, e.labelFr)}{e.deltaCents > 0 && ` +${fmtCAD(e.deltaCents)}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Button className="mt-6 h-12 w-full rounded-xl" style={{ backgroundColor: theme }} onClick={confirm}>
            {t("addToCart")} · {fmtCAD(liveUnit)}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
