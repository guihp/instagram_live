import { createFileRoute } from "@tanstack/react-router";

import { IgBroadcastList } from "@/components/instagram-live/IgBroadcastList";
import { listIgBroadcasts } from "@/lib/api/ig-live.functions";
import { fetchSetupStatus } from "@/lib/api/setup.functions";

export const Route = createFileRoute("/admin/instagram-live/")({
  loader: async () => {
    const setup = await fetchSetupStatus();
    if (!setup.ready) {
      return { broadcasts: [], setupBlocked: true as const };
    }
    const broadcasts = await listIgBroadcasts();
    return { broadcasts, setupBlocked: false as const };
  },
  component: InstagramLiveIndexPage,
});

function InstagramLiveIndexPage() {
  const { broadcasts, setupBlocked } = Route.useLoaderData();

  if (setupBlocked) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-white/50">
          Complete o checklist acima para listar e criar transmissões.
        </p>
      </div>
    );
  }

  return <IgBroadcastList broadcasts={broadcasts} />;
}
