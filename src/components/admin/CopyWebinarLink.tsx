import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CopyWebinarLinkProps {
  slug: string;
  published?: boolean;
  variant?: "default" | "inline";
}

export function CopyWebinarLink({ slug, published = true, variant = "default" }: CopyWebinarLinkProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/webinar/${slug}`
      : `/webinar/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copiado! Cole no grupo.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  if (variant === "inline") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-white/90">
          <Link2 className="size-4 text-brand-teal" />
          Link para compartilhar no grupo
        </div>
        {!published && (
          <p className="text-xs text-amber-400/90">
            Publique o webinar para que o link funcione para os participantes.
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input readOnly value={fullUrl} className="h-9 font-mono text-xs" />
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="shrink-0 gap-2 border-white/[0.08] bg-[#17181A] sm:w-auto"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dojo-surface-card space-y-3 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white/90">
        <Link2 className="size-4 text-brand-teal" />
        Link para compartilhar no grupo
      </div>
      {!published && (
        <p className="text-xs text-amber-400/90">
          Publique o webinar para que o link funcione para os participantes.
        </p>
      )}
      <div className="flex gap-2">
        <Input readOnly value={fullUrl} className="font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          className="shrink-0 gap-2 border-white/[0.08] bg-[#17181A]"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
