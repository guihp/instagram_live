import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { AdminSidebar, navItems } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import dojoLogo from "@/assets/dojo-logo-branca.png";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const isLandingPreviewEmbed = useRouterState({
    select: (s) => /\/webinars\/landing-preview\//.test(s.location.pathname),
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/login" });
  };

  if (isLandingPreviewEmbed) {
    return (
      <AdminAuthGuard>
        <Outlet />
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <div className="admin-shell min-h-svh bg-[#0F1114] text-white">
        <AdminSidebar onLogout={handleLogout} />

        <div className="flex min-h-svh flex-col md:pl-[240px]">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0F1114]/95 px-4 backdrop-blur-sm md:hidden">
            <img src={dojoLogo} alt="DOJO" className="h-5 w-auto" />
            <div className="flex shrink-0 items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                >
                  {item.label}
                </Link>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-[#0F1114]">
            <div className="mx-auto w-full max-w-[1100px] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
