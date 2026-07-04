import { createFileRoute } from "@tanstack/react-router";

import { IgBroadcastList } from "@/components/instagram-live/IgBroadcastList";
import { listIgBroadcasts } from "@/lib/api/ig-live.functions";

export const Route = createFileRoute("/admin/instagram-live/")({
  loader: async () => listIgBroadcasts(),
  component: InstagramLiveIndexPage,
});

function InstagramLiveIndexPage() {
  const broadcasts = Route.useLoaderData();
  return <IgBroadcastList broadcasts={broadcasts} />;
}
