import { useEffect, useState } from "react";
import { Check, Coffee, BellRing, PackageCheck, XCircle } from "lucide-react";
import { subscribeOrder, getOrderItems, fmtCAD, type Order, type OrderItem } from "@/lib/store";
import { useLang, type TKey } from "@/lib/i18n";

const STEPS: { key: TKey; icon: typeof Coffee }[] = [
  { key: "pending", icon: Check },
  { key: "preparing", icon: Coffee },
  { key: "ready", icon: BellRing },
];

export function OrderTracker({ slug, orderId, accent }: { slug: string; orderId: string; accent: string }) {
  void slug;
  const { t, lang } = useLang();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const unsub = subscribeOrder(orderId, setOrder);
    getOrderItems(orderId).then(setItems).catch(() => {});
    return unsub;
  }, [orderId]);

  if (!order) return null;

  if (order.status === "cancelled")
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
        <XCircle className="h-5 w-5" /> {t("cancelled")}
      </div>
    );

  const stage = order.status === "completed" ? 3 : STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="mt-4">
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const done = i <= stage;
          const Icon = done && i === stage && order.status === "completed" ? PackageCheck : s.icon;
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                    done ? "text-white" : "border-stone-200 bg-white text-stone-300"
                  } ${i === stage && order.status === "ready" ? "animate-pulse" : ""}`}
                  style={done ? { backgroundColor: accent, borderColor: accent } : undefined}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs font-medium ${done ? "text-stone-900" : "text-stone-400"}`}>{t(s.key)}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-1 mb-5 h-1 flex-1 rounded" style={{ backgroundColor: i < stage ? accent : "#e7e5e4" }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-xl bg-stone-50 p-3 text-sm">
        {items.map((it) => (
          <div key={it.id} className="flex justify-between py-0.5">
            <span>
              {it.quantity}× {lang === "fr" && it.itemNameFr ? it.itemNameFr : it.itemNameEn}
              {it.optionsText && <span className="text-stone-400"> · {it.optionsText}</span>}
            </span>
            <span className="text-stone-500">{fmtCAD(it.unitPriceCents * it.quantity)}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t pt-1 font-bold">
          <span>{t("total")}</span>
          <span>{fmtCAD(order.totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
