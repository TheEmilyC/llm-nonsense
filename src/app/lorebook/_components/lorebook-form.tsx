"use client";

import { useTestLorebookConnection } from "@/app/lorebook/_lib/hooks";
import {
  lorebookDbFormSchema,
  LorebookDbFormValues,
} from "@/app/lorebook/_lib/schema";
import { FieldInput } from "@/components/form-fields/field-input";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

interface LorebookFormProps {
  formId: string;
  defaultValues?: LorebookDbFormValues;
  onSubmit: (data: LorebookDbFormValues) => void;
}

export function LorebookForm({
  formId,
  defaultValues,
  onSubmit,
}: LorebookFormProps) {
  const form = useForm<LorebookDbFormValues>({
    resolver: zodResolver(lorebookDbFormSchema),
    mode: "onTouched",
    defaultValues: defaultValues || { name: "", apiKey: "", port: 27123 },
  });

  const { testLorebookConnection, isPending: isTestingConnection } =
    useTestLorebookConnection();
  const [verifiedCredentials, setVerifiedCredentials] = useState<{
    port: number;
    apiKey: string;
  } | null>(
    defaultValues ? { port: defaultValues.port, apiKey: defaultValues.apiKey } : null,
  );

  const port = useWatch({ control: form.control, name: "port" });
  const apiKey = useWatch({ control: form.control, name: "apiKey" });

  const connectionVerified =
    verifiedCredentials?.port === port &&
    verifiedCredentials?.apiKey === apiKey;

  async function handleTestConnection() {
    try {
      await testLorebookConnection({
        port: form.getValues("port"),
        apiKey: form.getValues("apiKey"),
      });
      setVerifiedCredentials({ port: form.getValues("port"), apiKey: form.getValues("apiKey") });
      form.clearErrors("root");
    } catch {
      setVerifiedCredentials(null);
    }
  }

  async function handleSubmit(data: LorebookDbFormValues) {
    if (!connectionVerified) {
      form.setError("root", {
        message: "Connection must be verified before saving.",
      });
      return;
    }
    onSubmit(data);
  }

  return (
    <form id={formId} onSubmit={form.handleSubmit(handleSubmit)}>
      <FieldGroup>
        <FieldInput control={form.control} name="name" label="Name" />
        <FieldInput
          control={form.control}
          name="port"
          label="Port"
          type="number"
        />
        <FieldInput control={form.control} name="apiKey" label="API Key" />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTestingConnection}
            onClick={handleTestConnection}
          >
            {isTestingConnection
              ? "Testing..."
              : connectionVerified
                ? "Connection Verified"
                : "Test Connection"}
          </Button>
          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
