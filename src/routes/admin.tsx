import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { AdminSidebar, navItems } from "@/components/admin/AdminSidebar";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/login" });
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-svh bg-background">
        <AdminSidebar onLogout={handleLogout} />

        <div className="flex min-h-svh flex-col md:pl-56">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold">Webinar Admin</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <ThemeToggle showLabel={false} className="size-9" />
              <Button variant="ghost" size="icon" className="size-9" onClick={handleLogout}>
                <LogOut className="size-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
