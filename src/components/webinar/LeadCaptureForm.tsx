import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/webinar/PhoneInput";
import type { PhoneRegion, WebinarFormField } from "@/lib/supabase/database.types";
import { phoneValidationMessage, validatePhone } from "@/lib/webinar/phone";
import { cn } from "@/lib/utils";

interface LeadCaptureFormProps {
  fields: WebinarFormField[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  loading?: boolean;
  title?: string;
  description?: string;
  /** Sem card externo — para embed na landing page */
  embedded?: boolean;
  variant?: "default" | "popup";
  submitLabel?: string;
}

export function LeadCaptureForm({
  fields,
  onSubmit,
  loading,
  title = "Inscreva-se para assistir",
  description = "Preencha seus dados para acessar o webinar.",
  embedded = false,
  variant = "default",
  submitLabel = "Continuar",
}: LeadCaptureFormProps) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    if (field.field_type === "email") {
      let validator = z.string().email("E-mail inválido");
      if (field.required) validator = validator.min(1, `${field.label} é obrigatório`);
      else validator = validator.optional().or(z.literal(""));
      schemaShape[field.field_key] = validator;
      return;
    }

    if (field.field_type === "tel") {
      const region = (field.phone_region ?? "BR") as PhoneRegion;
      let validator = z.string().refine(
        (v) => !field.required && !v ? true : validatePhone(v, region),
        phoneValidationMessage(region),
      );
      if (field.required) {
        validator = z
          .string()
          .min(1, `${field.label} é obrigatório`)
          .refine((v) => validatePhone(v, region), phoneValidationMessage(region));
      }
      schemaShape[field.field_key] = validator;
      return;
    }

    let validator = z.string();
    if (field.required) validator = validator.min(1, `${field.label} é obrigatório`);
    else validator = validator.optional().or(z.literal(""));
    schemaShape[field.field_key] = validator;
  });

  const schema = z.object(schemaShape);
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map((f) => [f.field_key, ""])),
  });

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values as Record<string, string>);
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={cn("space-y-4", variant === "popup" && "space-y-5")}>
        {fields.map((field) => (
          <FormField
            key={field.id}
            control={form.control}
            name={field.field_key as keyof FormValues}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className={cn(variant === "popup" && "text-sm font-semibold")}>
                  {field.label}
                </FormLabel>
                <FormControl>
                  {field.field_type === "textarea" ? (
                    <Textarea
                      {...formField}
                      value={formField.value ?? ""}
                      className={cn(variant === "popup" && "min-h-[100px] rounded-xl")}
                    />
                  ) : field.field_type === "tel" ? (
                    <PhoneInput
                      region={(field.phone_region ?? "BR") as PhoneRegion}
                      value={formField.value ?? ""}
                      onChange={formField.onChange}
                      onBlur={formField.onBlur}
                      name={formField.name}
                      ref={formField.ref}
                      className={cn(variant === "popup" && "h-12 rounded-xl text-base")}
                    />
                  ) : (
                    <Input
                      {...formField}
                      type={field.field_type === "email" ? "email" : "text"}
                      value={formField.value ?? ""}
                      className={cn(variant === "popup" && "h-12 rounded-xl text-base")}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button
          type="submit"
          className={cn(
            "w-full",
            variant === "popup" &&
              "h-12 gap-2 rounded-xl bg-webinar-accent text-base font-bold shadow-[0_8px_24px_-8px_oklch(0.62_0.19_250/0.55)] hover:bg-webinar-accent/90",
          )}
          size="lg"
          disabled={loading}
        >
          {loading ? "Enviando..." : submitLabel}
          {variant === "popup" && !loading && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </Form>
  );

  if (embedded) return formContent;

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {formContent}
    </div>
  );
}
