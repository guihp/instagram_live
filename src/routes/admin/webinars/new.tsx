import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WebinarEditor } from "@/components/admin/WebinarEditor";

export const Route = createFileRoute("/admin/webinars/new")({
  component: NewWebinarPage,
});

function NewWebinarPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-6">
        <AdminBackLink to="/admin/webinars" label="Voltar aos webinars" />
        <AdminPageHeader
          title="Novo webinar"
          subtitle="Configure título, agendamento e conteúdo. O link de compartilhamento aparece após definir o slug."
        />
      </div>

      <WebinarEditor onSaved={() => navigate({ to: "/admin/webinars" })} />
    </div>
  );
}
