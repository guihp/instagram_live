import { createFileRoute } from "@tanstack/react-router";

import { IgBroadcastEditor } from "@/components/instagram-live/IgBroadcastEditor";
import { getIgBroadcast } from "@/lib/api/ig-live.functions";

export const Route = createFileRoute("/admin/instagram-live/$id")({
  loader: async ({ params }) => getIgBroadcast({ data: { id: params.id } }),
  component: InstagramLiveDetailPage,
});

function InstagramLiveDetailPage() {
  const broadcast = Route.useLoaderData();
  return <IgBroadcastEditor broadcast={broadcast} />;
}
