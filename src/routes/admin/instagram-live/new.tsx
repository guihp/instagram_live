import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createIgBroadcast } from "@/lib/api/ig-live.functions";

export const Route = createFileRoute("/admin/instagram-live/new")({
  component: InstagramLiveNewPage,
});

function InstagramLiveNewPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const row = await createIgBroadcast({
        data: { title: title.trim(), loop_enabled: true },
      });
      toast.success("Transmissão criada");
      navigate({ to: "/admin/instagram-live/$id", params: { id: row.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-white/50 hover:text-white">
        <Link to="/admin/instagram-live">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>

      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-white">Nova transmissão Instagram Live</CardTitle>
          <CardDescription className="text-white/45">
            Depois de criar, envie o vídeo vertical e conecte ao Live Producer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Live de lançamento — Oferta especial"
                required
              />
            </div>
            <Button type="submit" disabled={creating || !title.trim()} className="w-full">
              {creating && <Loader2 className="size-4 animate-spin" />}
              Criar transmissão
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
