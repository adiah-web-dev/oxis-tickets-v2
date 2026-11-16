import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSaveTicketType } from "../../hooks/useEvents";
import { getApiErrorMessage, getFieldErrors } from "../../lib/errors";
import {
  TICKET_TYPE_FIELDS,
  ticketTypeSchema,
  toNullableInt,
} from "../../lib/ticketTypeSchema";
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
import { Textarea } from "../ui/Textarea";

export function TicketTypeFormDialog({
  eventId,
  ticketType,
  open,
  onOpenChange,
}) {
  const save = useSaveTicketType();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(ticketTypeSchema) });

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    reset({
      name: ticketType?.name ?? "",
      price: ticketType?.price ?? "",
      description: ticketType?.description ?? "",
      quantity: ticketType?.quantity != null ? String(ticketType.quantity) : "",
      max_per_order:
        ticketType?.max_per_order != null
          ? String(ticketType.max_per_order)
          : "",
    });
  }, [open, ticketType, reset]);

  const onSubmit = (values) => {
    setFormError(null);
    save.mutate(
      {
        id: ticketType?.id,
        payload: {
          event: eventId,
          name: values.name,
          price: Number(values.price).toFixed(2),
          description: values.description,
          quantity_available: toNullableInt(values.quantity),
          max_per_order: toNullableInt(values.max_per_order),
        },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          const fields = getFieldErrors(error);
          TICKET_TYPE_FIELDS.forEach(
            (f) => fields[f] && setError(f, { message: fields[f] }),
          );
          if (!Object.keys(fields).some((f) => TICKET_TYPE_FIELDS.includes(f)))
            setFormError(getApiErrorMessage(error));
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !save.isPending && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {ticketType ? "Edit ticket type" : "Add ticket type"}
          </DialogTitle>
          <DialogDescription>
            Prices set here are used by the server when orders are created.
          </DialogDescription>
        </DialogHeader>
        <form
          id="ticket-type-form"
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
          <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
            <FormField
              label="Name"
              htmlFor="tt-name"
              error={errors.name?.message}
              required
            >
              <Input
                id="tt-name"
                placeholder="e.g. Adult"
                aria-invalid={!!errors.name || undefined}
                {...register("name")}
              />
            </FormField>
            <FormField
              label="Price"
              htmlFor="tt-price"
              error={errors.price?.message}
              required
            >
              <Input
                id="tt-price"
                inputMode="decimal"
                placeholder="0.00"
                className="tabular-nums"
                aria-invalid={!!errors.price || undefined}
                {...register("price")}
              />
            </FormField>
          </div>
          <FormField
            label="Description"
            htmlFor="tt-description"
            error={errors.description?.message}
          >
            <Textarea
              id="tt-description"
              rows={2}
              {...register("description")}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Total available"
              htmlFor="tt-quantity"
              error={errors.quantity?.message}
              hint="Leave blank for unlimited"
            >
              <Input
                id="tt-quantity"
                inputMode="numeric"
                {...register("quantity")}
              />
            </FormField>
            <FormField
              label="Max per order"
              htmlFor="tt-max"
              error={errors.max_per_order?.message}
              hint="Leave blank for no limit"
            >
              <Input
                id="tt-max"
                inputMode="numeric"
                {...register("max_per_order")}
              />
            </FormField>
          </div>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="ticket-type-form"
            disabled={save.isPending}
          >
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {ticketType ? "Save changes" : "Add ticket type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
