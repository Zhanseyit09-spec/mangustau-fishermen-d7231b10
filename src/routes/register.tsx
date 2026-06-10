import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Anchor, Loader2, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFishery } from "@/lib/fishery-store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Тіркелу — Digital Fisherman" },
      { name: "description", content: "Register to access the Mangystau fisherman dashboard." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { registerFisherman } = useFishery();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [iin, setIin] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      toast.error("Аты-жөніңізді енгізіңіз");
      return;
    }
    if (!/^[0-9]{12}$/.test(iin)) {
      toast.error("ИИН 12 саннан тұруы керек");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("fishermen")
      .insert({ first_name: fn, last_name: ln, iin })
      .select("id, first_name, last_name")
      .single();
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("Бұл ИИН тіркелген");
      } else {
        toast.error(error.message);
      }
      return;
    }

    const fullName = `${data.first_name} ${data.last_name}`;
    localStorage.setItem(
      "digital-fisherman:user",
      JSON.stringify({ id: data.id, name: fullName }),
    );
    registerFisherman({ id: data.id, name: fullName, license: `IIN-${iin.slice(-4)}` });
    toast.success("Тіркелу сәтті аяқталды");
    navigate({ to: "/fisherman" });
  };

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center px-4 py-10">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-72 opacity-30 blur-3xl"
        style={{ background: "var(--gradient-teal)" }}
      />
      <Card className="w-full border-border/60 bg-card/70 backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-glow)" }}
          >
            <Anchor className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Тіркелу</CardTitle>
          <CardDescription className="inline-flex items-center justify-center gap-1.5">
            <Waves className="h-3.5 w-3.5 text-primary" />
            Балықшы кабинетіне кіру үшін
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Аты <span className="text-muted-foreground">(First Name)</span></Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Алмас"
                maxLength={100}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Тегі <span className="text-muted-foreground">(Last Name)</span></Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Нұрланұлы"
                maxLength={100}
                autoComplete="family-name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iin">ИИН <span className="text-muted-foreground">(12 сан)</span></Label>
              <Input
                id="iin"
                inputMode="numeric"
                pattern="[0-9]{12}"
                value={iin}
                onChange={(e) => setIin(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="123456789012"
                maxLength={12}
                required
              />
              <p className="text-xs text-muted-foreground">{iin.length}/12</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Тіркелу"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
