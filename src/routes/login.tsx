import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthDecorPanel } from "@/components/auth/AuthDecorPanel";
import { DojoCheckbox } from "@/components/auth/DojoCheckbox";
import { RotatingText } from "@/components/ui/rotating-text";
import { supabase } from "@/lib/supabase/client";
import dojoLogo from "@/assets/dojo-logo-branca.png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login realizado!");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-[100dvw] overflow-hidden bg-black text-white">
      {/* Form panel */}
      <div className="relative flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:max-w-[560px] lg:shrink-0 lg:px-14 xl:max-w-[520px]">
        <div className="dojo-panel-glow" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-sm">
          <img
            src={dojoLogo}
            alt="DOJO"
            className="mb-16 h-7 w-auto animate-fade-up opacity-0 dojo-stagger-1"
          />

          <h1 className="animate-fade-up text-[2rem] font-light tracking-[-0.04em] text-white opacity-0 dojo-stagger-2">
            Bem-vindo de volta
          </h1>

          <p className="mb-6 mt-2 animate-fade-up text-[0.85rem] text-[#555555] opacity-0 dojo-stagger-3">
            Acesse o painel e gerencie seus{" "}
            <RotatingText
              texts={["streams", "RTMP", "agendamentos", "lives"]}
              interval={2200}
              className="font-medium text-brand-teal/80"
            />
          </p>

          <div className="mb-10 h-px animate-fade-up bg-white/[0.06] opacity-0 dojo-stagger-3" />

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="animate-fade-up opacity-0 dojo-stagger-4">
              <label htmlFor="email" className="dojo-field-label">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="dojo-glass-input h-11 w-full px-3.5"
              />
            </div>

            <div className="animate-fade-up opacity-0 dojo-stagger-5">
              <label htmlFor="password" className="dojo-field-label">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="dojo-glass-input h-11 w-full px-3.5 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/50"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex animate-fade-up items-center justify-between opacity-0 dojo-stagger-6">
              <DojoCheckbox
                id="remember"
                label="Manter conectado"
                checked={remember}
                onChange={setRemember}
              />
              <button
                type="button"
                className="text-[0.7rem] text-white/25 transition-colors hover:text-white/50"
              >
                Esqueceu a senha?
              </button>
            </div>

            <div className="animate-fade-up pt-1 opacity-0 dojo-stagger-6">
              <div className="dojo-btn-border-glow">
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "dojo-btn-primary flex h-[52px] w-full items-center justify-center gap-2 disabled:opacity-60",
                  )}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>

      <AuthDecorPanel />
    </div>
  );
}
