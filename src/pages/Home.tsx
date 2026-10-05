import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Coffee, QrCode, LayoutDashboard, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { listFeaturedCafes, type Cafe } from "@/lib/store";
import { CafeImage } from "@/lib/storage-image";

export default function Home() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  useEffect(() => {
    listFeaturedCafes().then(setCafes).catch(() => setCafes([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <Header />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-100 via-transparent to-orange-100" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-900">
            <Coffee className="h-4 w-4" /> {t("tagline")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-stone-900 md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-600">{t("heroSub")}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-amber-800 px-8 text-base hover:bg-amber-900">
              <Link to={user ? "/dashboard" : "/login"}>
                {t("getStarted")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
              <a href="#cafes">{t("browseCafes")}</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-stone-900">{t("howItWorks")}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: LayoutDashboard, title: t("step1t"), desc: t("step1d") },
            { icon: Coffee, title: t("step2t"), desc: t("step2d") },
            { icon: QrCode, title: t("step3t"), desc: t("step3d") },
          ].map((s, i) => (
            <Card key={i} className="border-amber-200/60 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-800/10 text-amber-800">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-2 text-stone-600">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="cafes" className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-center text-3xl font-bold text-stone-900">{t("featuredCafes")}</h2>
        {cafes.length === 0 ? (
          <p className="mt-8 text-center text-stone-500">{t("noCafes")}</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cafes.map((c) => (
              <Card key={c.id} className="overflow-hidden border-amber-200/60 bg-white shadow-sm transition hover:shadow-md">
                <div className="relative h-36 bg-gradient-to-br from-amber-200 to-orange-200">
                  {c.bannerUrl && <CafeImage url={c.bannerUrl} alt={c.nameEn} className="h-full w-full object-cover" />}
                  <div className="absolute -bottom-6 left-4 h-14 w-14 overflow-hidden rounded-2xl border-4 border-white bg-white shadow">
                    <CafeImage
                      url={c.logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center bg-amber-800 text-white">
                          <Coffee className="h-6 w-6" />
                        </div>
                      }
                    />
                  </div>
                </div>
                <CardContent className="p-4 pt-8">
                  <h3 className="text-lg font-semibold text-stone-900">
                    {lang === "fr" && c.nameFr ? c.nameFr : c.nameEn}
                  </h3>
                  {c.address && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-stone-500">
                      <MapPin className="h-3.5 w-3.5" /> {c.address}
                    </p>
                  )}
                  <Button asChild className="mt-4 w-full bg-amber-800 hover:bg-amber-900">
                    <Link to={`/c/${c.slug}`}>{t("viewMenu")}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-amber-200/60 bg-white py-8 text-center text-sm text-stone-500">
        Café QR · {t("tagline")}
      </footer>
    </div>
  );
}
