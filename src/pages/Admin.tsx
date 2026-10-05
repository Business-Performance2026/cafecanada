import { useEffect, useState } from "react";
import { Coffee, ExternalLink, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { adminListCafes, adminSetCafeActive, adminDeleteCafe, type Cafe } from "@/lib/store";
import { CafeImage } from "@/lib/storage-image";

type ALang = "en" | "ar";

const adict = {
  en: {
    adminTitle: "Café management", adminSub: "Manage all café owners on the platform",
    viewMenu: "View menu", suspend: "Suspend", activate: "Activate",
    owner: "Owner ID", orders: "Orders", registered: "Registered", status: "Status",
    active: "Active", suspended: "Suspended", cafeName: "Café",
    forbidden: "403 — Admins only", total: "Total cafés", activeCount: "Active",
    suspendedCount: "Suspended", confirmDelete: "Delete this café and all its data?",
  },
  ar: {
    adminTitle: "إدارة المقاهي", adminSub: "إدارة جميع أصحاب المقاهي على المنصة",
    viewMenu: "عرض القائمة", suspend: "إيقاف", activate: "تفعيل",
    owner: "رقم المالك", orders: "الطلبات", registered: "تاريخ التسجيل", status: "الحالة",
    active: "نشط", suspended: "موقوف", cafeName: "المقهى",
    forbidden: "٤٠٣ — للمشرفين فقط", total: "إجمالي المقاهي", activeCount: "نشط",
    suspendedCount: "موقوف", confirmDelete: "حذف هذا المقهى وكل بياناته؟",
  },
} as const;

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState<(Cafe & { orderCount: number })[]>([]);
  const refresh = () => {
    if (isAdmin) adminListCafes().then(setData).catch(() => setData([]));
  };

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (isAdmin) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const [alang, setAlang] = useState<ALang>(() =>
    localStorage.getItem("cafeqr-admin-lang") === "ar" ? "ar" : "en",
  );
  useEffect(() => {
    localStorage.setItem("cafeqr-admin-lang", alang);
    document.documentElement.dir = alang === "ar" ? "rtl" : "ltr";
    return () => { document.documentElement.dir = "ltr"; };
  }, [alang]);
  const at = (k: keyof typeof adict.en) => adict[alang][k];

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Coffee className="h-8 w-8 animate-pulse text-amber-800" />
      </div>
    );
  if (user && !isAdmin)
    return (
      <div className="min-h-screen bg-[#faf7f2]">
        <Header />
        <p className="py-24 text-center text-stone-500">{at("forbidden")}</p>
      </div>
    );
  if (!user) return null;

  const activeCount = data.filter((c) => c.isActive).length;

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8" dir={alang === "ar" ? "rtl" : "ltr"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{at("adminTitle")}</h1>
            <p className="mt-1 text-stone-500">{at("adminSub")}</p>
          </div>
          <Button variant="outline" size="sm" className="min-h-11 font-semibold"
            onClick={() => setAlang((l) => (l === "en" ? "ar" : "en"))}>
            {alang === "en" ? "عربي" : "EN"}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: at("total"), value: data.length },
            { label: at("activeCount"), value: activeCount },
            { label: at("suspendedCount"), value: data.length - activeCount },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-sm text-stone-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:hidden">
          {data.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border bg-white">
                    <CafeImage url={c.logoUrl} alt="" className="h-full w-full object-cover"
                      fallback={<Coffee className="m-3 h-6 w-6 text-stone-300" />} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.nameEn}</p>
                    <p className="text-xs text-stone-400">{at("orders")} {c.orderCount}</p>
                  </div>
                  <Badge className={c.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}>
                    {c.isActive ? at("active") : at("suspended")}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="min-h-11">
                    <Link to={`/c/${c.slug}`}><ExternalLink className="mr-1 h-4 w-4" /> {at("viewMenu")}</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="min-h-11"
                    onClick={() => adminSetCafeActive(c.id, !c.isActive).then(() => refresh())}>
                    {c.isActive ? at("suspend") : at("activate")}
                  </Button>
                  <Button size="sm" variant="outline" className="min-h-11 text-red-600"
                    onClick={() => confirm(at("confirmDelete")) && void adminDeleteCafe(c.id).then(() => refresh())}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{at("cafeName")}</TableHead>
                <TableHead>{at("orders")}</TableHead>
                <TableHead>{at("registered")}</TableHead>
                <TableHead>{at("status")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg border bg-white">
                        <CafeImage url={c.logoUrl} alt="" className="h-full w-full object-cover"
                          fallback={<Coffee className="m-2 h-6 w-6 text-stone-300" />} />
                      </div>
                      <div>
                        <p className="font-medium">{c.nameEn}</p>
                        <a href={`/c/${c.slug}`} className="text-xs text-amber-800 underline">/c/{c.slug}</a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{c.orderCount}</TableCell>
                  <TableCell>
                    {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString(alang === "ar" ? "ar-CA" : "en-CA") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={c.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}>
                      {c.isActive ? at("active") : at("suspended")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => adminSetCafeActive(c.id, !c.isActive).then(() => refresh())}>
                        {c.isActive ? at("suspend") : at("activate")}
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600"
                        onClick={() => confirm(at("confirmDelete")) && void adminDeleteCafe(c.id).then(() => refresh())}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
