import { createFileRoute, notFound } from "@tanstack/react-router";

import { SetupWizard } from "@/components/setup/SetupWizard";
import { getSetupStatus } from "@/lib/api/setup.functions";
import { hydrateEnvFromPersistedSettings } from "@/lib/setup/settings-store.server";
import dojoLogo from "@/assets/dojo-logo-branca.png";

export const Route = createFileRoute("/setup")({
  loader: async () => {
    await hydrateEnvFromPersistedSettings();
    const status = await getSetupStatus();
    if (status.ready) {
      throw notFound();
    }
    return status;
  },
  component: SetupPage,
});

function SetupPage() {
  const status = Route.useLoaderData();

  return (
    <div className="min-h-svh bg-[#0F1114] text-white">
      <header className="border-b border-white/[0.06] px-6 py-5 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <img src={dojoLogo} alt="DOJO" className="h-6 w-auto opacity-90" />
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-white/40">
            Setup — só desenvolvedor
          </span>
        </div>
      </header>

      <main className="px-6 py-8 sm:px-8 sm:py-10">
        <SetupWizard initialStatus={status} />
      </main>
    </div>
  );
}
