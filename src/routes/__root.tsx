import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { getSetupStatus } from "@/lib/api/setup.functions";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-light tracking-tight text-white">404</h1>
        <h2 className="mt-4 text-xl font-light text-white/90">Página não encontrada</h2>
        <p className="mt-2 text-sm text-white/25">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="dojo-btn-primary inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold"
          >
            Ir para login
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const isConfigError =
    /VITE_SUPABASE|SUPABASE_SERVICE_ROLE|OPENROUTER|obrigatóri/i.test(error.message ?? "");

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  if (isConfigError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-light tracking-tight text-white">Ambiente não configurado</h1>
          <p className="mt-2 text-sm text-white/25">
            Faltam secrets ou migrations. Abra a tela de setup para ver o passo a passo.
          </p>
          <div className="mt-6">
            <a
              href="/setup"
              className="dojo-btn-primary inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold"
            >
              Ir para configuração
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-light tracking-tight text-white">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-2 text-sm text-white/25">
          Algo deu errado. Tente atualizar ou volte ao painel.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="dojo-btn-primary inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold"
          >
            Tentar novamente
          </button>
          <a
            href="/admin"
            className="inline-flex items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.04]"
          >
            Ir ao painel
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/setup") return;

    try {
      const status = await getSetupStatus();
      if (!status.ready) {
        throw redirect({ to: "/setup" });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      throw redirect({ to: "/setup" });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DOJO Webinars" },
      { name: "description", content: "Plataforma de webinars ao vivo — DojoDesk" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
