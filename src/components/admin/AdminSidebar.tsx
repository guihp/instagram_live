import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Radio } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import dojoLogo from "@/assets/dojo-logo-branca.png";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin/instagram-live", label: "Instagram Live", icon: Radio, exact: false },
] as const;

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-white/[0.05] bg-[#1A1C22] md:flex">
      <div className="flex h-[72px] shrink-0 items-center px-6">
        <img src={dojoLogo} alt="DOJO DESK" className="h-[22px] w-auto" />
      </div>

      <div className="px-6 pb-2">
        <p className="text-[0.75rem] text-[#606270]">Dojo · owner</p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-2" aria-label="Menu principal">
        {navItems.map((item) => {
          const active =
            pathname === item.to ||
            pathname.startsWith(`${item.to}/`) ||
            pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-[0.875rem] transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/30",
                active
                  ? "bg-white/[0.06] font-medium text-white"
                  : "font-normal text-[#606270] hover:bg-white/[0.03] hover:text-white/80",
              )}
            >
              <item.icon
                className={cn("size-[18px] shrink-0", active ? "text-white/80" : "text-[#606270]")}
                strokeWidth={1.75}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-4">
        {userEmail && (
          <div className="mb-3 flex items-center gap-2.5 px-1">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#17181A] text-[0.7rem] font-medium uppercase text-[#606270]">
              {userEmail.charAt(0)}
            </span>
            <span className="min-w-0 truncate text-[0.75rem] text-[#606270]">{userEmail}</span>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full justify-start gap-2.5 rounded-lg px-2 text-[0.8rem] text-[#606270] hover:bg-white/[0.03] hover:text-white/80"
          onClick={onLogout}
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          Sair
        </Button>
      </div>
    </aside>
  );
}

export { navItems };
