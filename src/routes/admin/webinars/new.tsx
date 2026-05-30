import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { WebinarEditor } from "@/components/admin/WebinarEditor";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/webinars/new")({
  component: NewWebinarPage,
});

function NewWebinarPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-2 text-muted-foreground">
          <Link to="/admin/webinars">
            <ArrowLeft className="size-4" />
            Voltar aos webinars
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo webinar</h1>
          <p className="text-sm text-muted-foreground">
            Configure título, agendamento e conteúdo. O link de compartilhamento aparece após definir o slug.
          </p>
        </div>
      </div>

      <WebinarEditor onSaved={() => navigate({ to: "/admin/webinars" })} />
    </div>
  );
}
