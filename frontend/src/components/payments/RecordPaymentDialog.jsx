import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useRecordPayment } from "../../hooks/usePayments";
import { getApiErrorMessage, getFieldErrors } from "../../lib/errors";
import { formatCurrency } from "../../lib/format";
import { paymentMethodLabels } from "../../lib/status";
import { FormField } from "../common/FormField";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { Input } from "../ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Textarea } from "../ui/Textarea";

const METHODS = Object.keys(paymentMethodLabels);

const schema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount such as 150.00")
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than zero"),
  method: z.enum(["cash", "bank_transfer", "cheque", "card", "other"]),
  reference: z.string().trim().max(100),
  notes: z.string().trim().max(500),
});

export function RecordPaymentDialog({
  order,
  outstanding,
  open,
  onOpenChange,
}) {
  const record = useRecordPayment();
  const [formError, setFormError] = (useState < string) | (null > null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm < Values > { resolver: zodResolver(schema) };

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    reset({
      amount: outstanding > 0 ? outstanding.toFixed(2) : "",
      method: "cash",
      reference: "",
      notes: "",
    });
  }, [open, outstanding, reset]);

  const onSubmit = (values) => {
    setFormError(null);
    record.mutate(
      {
        order: order.id,
        amount: Number(values.amount).toFixed(2),
        method: values.method,
        reference: values.reference,
        notes: values.notes,
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          const fields = getFieldErrors(error);
          ["amount", "method", "reference", "notes"].forEach(
            (f) => fields[f] && setError(f, { message: fields[f] }),
          );
          const unmapped = Object.keys(fields).some(
            (f) => !["amount", "method", "reference", "notes"].includes(f),
          );
          if (!Object.keys(fields).length || unmapped)
            setFormError(getApiErrorMessage(error));
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !record.isPending && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {order.order_number} · Outstanding{" "}
            <strong className="text-foreground">
              {formatCurrency(outstanding)}
            </strong>{" "}
            of {formatCurrency(order.total)}
          </DialogDescription>
        </DialogHeader>
        <form
          id="record-payment-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="grid gap-4"
        >
          {formError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{" "}
              {formError}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Amount"
              htmlFor="pay-amount"
              error={errors.amount?.message}
              required
            >
              <Input
                id="pay-amount"
                inputMode="decimal"
                className="tabular-nums"
                aria-invalid={!!errors.amount || undefined}
                {...register("amount")}
              />
            </FormField>
            <FormField
              label="Method"
              htmlFor="pay-method"
              error={errors.method?.message}
              required
            >
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="pay-method" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {paymentMethodLabels[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
          <FormField
            label="Reference"
            htmlFor="pay-reference"
            error={errors.reference?.message}
            hint="Receipt, transfer or cheque number, if any."
          >
            <Input id="pay-reference" {...register("reference")} />
          </FormField>
          <FormField
            label="Notes"
            htmlFor="pay-notes"
            error={errors.notes?.message}
          >
            <Textarea
              id="pay-notes"
              rows={2}
              placeholder="e.g. Cash received at front office"
              {...register("notes")}
            />
          </FormField>
          <p className="text-xs text-muted-foreground">
            Recorded payments stay pending until an event manager verifies them.
          </p>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={record.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="record-payment-form"
            disabled={record.isPending}
          >
            {record.isPending && <Loader2 className="size-4 animate-spin" />}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
