"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, UseFormSetError, useWatch } from "react-hook-form";

import { useTestLorebookConnection } from "@/app/lorebook/_lib/hooks";
import {
  lorebookFormSchema,
  LorebookFormValues,
} from "@/app/lorebook/_lib/schema";
import { FieldInput } from "@/components/form-fields/field-input";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

interface LorebookFormProps {
  defaultValues?: LorebookFormValues;
  formId: string;
  onSubmit: (
    data: LorebookFormValues,
    setError: UseFormSetError<LorebookFormValues>,
  ) => void;
}

export function LorebookForm({
  defaultValues,
  formId,
  onSubmit,
}: LorebookFormProps) {
  const form = useForm<LorebookFormValues>({
    defaultValues: defaultValues || { apiKey: "", name: "", port: 27123 },
    mode: "onTouched",
    resolver: zodResolver(lorebookFormSchema),
  });

  const { isPending: isTestingConnection, testLorebookConnection } =
    useTestLorebookConnection();
  const [verifiedCredentials, setVerifiedCredentials] = useState<null | {
    apiKey: string;
    port: number;
  }>(
    defaultValues
      ? { apiKey: defaultValues.apiKey, port: defaultValues.port }
      : null,
  );

  const port = useWatch({ control: form.control, name: "port" });
  const apiKey = useWatch({ control: form.control, name: "apiKey" });

  const connectionVerified =
    verifiedCredentials?.port === port &&
    verifiedCredentials?.apiKey === apiKey;

  async function handleTestConnection() {
    try {
      await testLorebookConnection({
        apiKey: form.getValues("apiKey"),
        port: form.getValues("port"),
      });
      setVerifiedCredentials({
        apiKey: form.getValues("apiKey"),
        port: form.getValues("port"),
      });
      form.clearErrors("root");
    } catch {
      setVerifiedCredentials(null);
    }
  }

  async function handleSubmit(data: LorebookFormValues) {
    if (!connectionVerified) {
      form.setError("root", {
        message: "Connection must be verified before saving.",
      });
      return;
    }
    onSubmit(data, form.setError);
  }

  return (
    <form id={formId} onSubmit={form.handleSubmit(handleSubmit)}>
      <FieldGroup>
        <FieldInput control={form.control} label="Name" name="name" />
        <FieldInput
          control={form.control}
          label="Port"
          name="port"
          type="number"
        />
        <FieldInput control={form.control} label="API Key" name="apiKey" />
        <div className="flex items-center gap-3">
          <Button
            disabled={isTestingConnection}
            onClick={handleTestConnection}
            size="sm"
            type="button"
            variant="outline"
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
