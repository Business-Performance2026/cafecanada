import { Link } from "react-router";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { t, lang, toggle } = useLang();
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-800 text-white">
            <Coffee className="h-5 w-5" />
          </span>
          Café QR
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggle} className="font-semibold">
            {lang === "en" ? "FR" : "EN"}
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">{t("dashboard")}</Link>
              </Button>
              {user.role === "admin" && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">{t("admin")}</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                {t("logout")}
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">{t("login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
