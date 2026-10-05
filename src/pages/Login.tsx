import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { signIn, signUp } from "@/lib/store";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e?.message?.replace("Firebase: ", "") ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <Header />
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-800 text-white">
              <Coffee className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h1>
            <div className="mt-6 space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  className="mt-1 h-12"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@cafe.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  className="mt-1 h-12"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                className="h-12 w-full bg-amber-800 text-base hover:bg-amber-900"
                disabled={busy || !email.includes("@") || password.length < 6}
                onClick={submit}
              >
                {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
              </Button>
              <button
                className="w-full text-center text-sm text-amber-800 underline"
                onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
              >
                {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-stone-500">
          <Link to="/" className="underline">← Back</Link>
        </p>
      </div>
    </div>
  );
}
