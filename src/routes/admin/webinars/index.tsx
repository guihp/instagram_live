import { createFileRoute } from "@tanstack/react-router";

import { WebinarsList } from "@/components/admin/WebinarsList";
import { listWebinarsWithStats } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/admin/webinars/")({
  loader: () => listWebinarsWithStats(),
  component: WebinarsListPage,
});

function WebinarsListPage() {
  const webinars = Route.useLoaderData();
  return <WebinarsList webinars={webinars} />;
}
