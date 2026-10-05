import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { createCafe, getMyCafe } from "@/lib/store";
import { toast } from "sonner";

export default function Register() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    nameEn: "", nameFr: "", descriptionEn: "", descriptionFr: "", address: "", phone: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const existing = await getMyCafe(user.uid);
      if (existing) { navigate("/dashboard"); return; }
      await createCafe(user.uid, {
        nameEn: form.nameEn.trim(),
        nameFr: form.nameFr.trim() || undefined,
        descriptionEn: form.descriptionEn.trim() || undefined,
        descriptionFr: form.descriptionFr.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <Header />
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-800 text-white">
              <Coffee className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">{t("createCafe")}</h1>
            <p className="mt-1 text-stone-500">{t("createCafeSub")}</p>
            <div className="mt-6 space-y-4">
              <div>
                <Label>{t("cafeName")} *</Label>
                <Input className="mt-1 h-12" value={form.nameEn} onChange={set("nameEn")} placeholder="Maple Brew" />
              </div>
              <div>
                <Label>{t("cafeNameFr")}</Label>
                <Input className="mt-1 h-12" value={form.nameFr} onChange={set("nameFr")} placeholder="Brûlerie Érable" />
              </div>
              <div>
                <Label>{t("description")}</Label>
                <Textarea className="mt-1" value={form.descriptionEn} onChange={set("descriptionEn")} rows={2} />
              </div>
              <div>
                <Label>{t("descriptionFr")}</Label>
                <Textarea className="mt-1" value={form.descriptionFr} onChange={set("descriptionFr")} rows={2} />
              </div>
              <div>
                <Label>{t("address")}</Label>
                <Input className="mt-1 h-12" value={form.address} onChange={set("address")} placeholder="123 Queen St W, Toronto" />
              </div>
              <div>
                <Label>{t("phone")}</Label>
                <Input className="mt-1 h-12" value={form.phone} onChange={set("phone")} placeholder="+1 416 555 0100" />
              </div>
              <Button
                className="h-12 w-full bg-amber-800 text-base hover:bg-amber-900"
                disabled={form.nameEn.trim().length < 2 || busy}
                onClick={submit}
              >
                {busy ? "…" : t("create")}
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-stone-500">
          <Link to="/" className="underline">{t("back")}</Link>
        </p>
      </div>
    </div>
  );
}
