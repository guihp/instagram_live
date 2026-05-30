import { createFileRoute } from "@tanstack/react-router";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getDashboardStats } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/admin/")({
  loader: () => getDashboardStats(),
  staleTime: 0,
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const data = Route.useLoaderData();
  return <AdminDashboard data={data} />;
}
