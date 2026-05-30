import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Users, Video } from "lucide-react";

import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/webinars", label: "Webinars", icon: Video, exact: false },
  { to: "/admin/leads", label: "Leads", icon: Users, exact: false },
] as const;

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Video className="size-4" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">Webinar Admin</p>
          <p className="truncate text-xs text-sidebar-foreground/55">DojoProjetos</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4" aria-label="Menu principal">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.to || pathname === `${item.to}/`
            : pathname === item.to ||
              pathname.startsWith(`${item.to}/`) ||
              pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground active:scale-[0.99]",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                  active
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-sidebar-accent/80 text-sidebar-foreground/55 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-4" strokeWidth={active ? 2.25 : 2} />
              </span>
              <span className={cn(active && "font-semibold")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-sidebar-border p-3">
        <ThemeToggle showLabel />
        <Separator className="my-2.5 bg-sidebar-border" />
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full justify-start gap-3 rounded-lg px-3 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={onLogout}
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-sidebar-accent/80">
            <LogOut className="size-4" />
          </span>
          Sair
        </Button>
      </div>
    </aside>
  );
}

export { navItems };
