import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useCreateEvent, useUpdateEvent } from "../../hooks/useEvents";
import { getApiErrorMessage, getFieldErrors } from "../../lib/errors";
import { fromLocalInput, toLocalInput } from "../../lib/format";
import { eventStatusMeta } from "../../lib/status";
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

const schema = z
  .object({
    name: z.string().trim().min(3, "Enter an event name").max(200),
    description: z.string().trim().max(5000),
    venue: z.string().trim().min(1, "Enter a venue").max(200),
    start_date: z.string().min(1, "Choose a start date and time"),
    end_date: z.string().min(1, "Choose an end date and time"),
    sales_start: z.string(),
    sales_end: z.string(),
    status: z.enum(["draft", "published", "cancelled", "completed"]),
    ticket_text_color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #FFFFFF"),
    ticket_overlay_opacity: z.number().min(0).max(1),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date > v.start_date, {
    path: ["end_date"],
    message: "End must be after the start",
  })
  .refine(
    (v) => !v.sales_start || !v.sales_end || v.sales_end > v.sales_start,
    { path: ["sales_end"], message: "Sales must close after they open" },
  );

const FIELDS = [
  "name",
  "description",
  "venue",
  "start_date",
  "end_date",
  "sales_start",
  "sales_end",
  "status",
  "ticket_text_color",
  "ticket_overlay_opacity",
];

export function EventFormDialog({ open, onOpenChange, event, onSaved }) {
  const isEdit = !!event;
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isPending = createEvent.isPending || updateEvent.isPending;
  const [banner, setBanner] = (useState < File) | (null > null);
  const [preview, setPreview] = (useState < string) | (null > null);
  const [formError, setFormError] = (useState < string) | (null > null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm < Values > { resolver: zodResolver(schema) };
  const textColor = useWatch({ control, name: "ticket_text_color" });
  const opacity = useWatch({ control, name: "ticket_overlay_opacity" });

  useEffect(() => {
    if (!open) return;
    setBanner(null);
    setFormError(null);
    setPreview(event?.banner_image ?? null);
    reset({
      name: event?.name ?? "",
      description: event?.description ?? "",
      venue: event?.venue ?? "",
      start_date: toLocalInput(event?.start_date),
      end_date: toLocalInput(event?.end_date),
      sales_start: toLocalInput(event?.sales_start),
      sales_end: toLocalInput(event?.sales_end),
      status: event?.status ?? "draft",
      ticket_text_color: event?.ticket_text_color || "#FFFFFF",
      ticket_overlay_opacity: Number(event?.ticket_overlay_opacity ?? 0.45),
    });
  }, [open, event, reset]);

  const onFile = (file) => {
    if (!file) return;
    setBanner(file);
    setPreview(URL.createObjectURL(file));
  };

  const onSubmit = (values) => {
    setFormError(null);
    const payload = {
      ...values,
      start_date: fromLocalInput(values.start_date),
      end_date: fromLocalInput(values.end_date),
      sales_start: fromLocalInput(values.sales_start),
      sales_end: fromLocalInput(values.sales_end),
      ...(banner ? { banner_image: banner } : {}),
    };
    const options = {
      onSuccess: (saved) => {
        onOpenChange(false);
        onSaved?.(saved);
      },
      onError: (error) => {
        const fields = getFieldErrors(error);
        FIELDS.forEach((f) => fields[f] && setError(f, { message: fields[f] }));
        if (fields.banner_image || !Object.keys(fields).length)
          setFormError(fields.banner_image ?? getApiErrorMessage(error));
      },
    };
    if (isEdit && event) updateEvent.mutate({ id: event.id, payload }, options);
    else createEvent.mutate(payload, options);
  };

  const dt = (field, label, required = false) => (
    <FormField
      label={label}
      htmlFor={`event-${field}`}
      error={errors[field]?.message}
      required={required}
    >
      <Input
        id={`event-${field}`}
        type="datetime-local"
        aria-invalid={!!errors[field] || undefined}
        {...register(field)}
      />
    </FormField>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !isPending && onOpenChange(next)}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit event" : "Create event"}</DialogTitle>
          <DialogDescription>
            Only published events can take orders. Ticket types are added from
            the event page.
          </DialogDescription>
        </DialogHeader>
        <form
          id="event-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5"
          noValidate
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
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <FormField
              label="Event name"
              htmlFor="event-name"
              error={errors.name?.message}
              required
            >
              <Input
                id="event-name"
                placeholder="e.g. Winter Gala 2026"
                aria-invalid={!!errors.name || undefined}
                {...register("name")}
              />
            </FormField>
            <FormField
              label="Status"
              htmlFor="event-status"
              error={errors.status?.message}
              required
            >
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="event-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(eventStatusMeta).map((s) => (
                        <SelectItem key={s} value={s}>
                          {eventStatusMeta[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
          <FormField
            label="Venue"
            htmlFor="event-venue"
            error={errors.venue?.message}
            required
          >
            <Input
              id="event-venue"
              placeholder="e.g. Great Hall"
              aria-invalid={!!errors.venue || undefined}
              {...register("venue")}
            />
          </FormField>
          <FormField
            label="Description"
            htmlFor="event-description"
            error={errors.description?.message}
          >
            <Textarea
              id="event-description"
              rows={3}
              {...register("description")}
            />
          </FormField>

          <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Event dates
            </legend>
            {dt("start_date", "Starts", true)}
            {dt("end_date", "Ends", true)}
          </fieldset>
          <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sales window (optional)
            </legend>
            {dt("sales_start", "Sales open")}
            {dt("sales_end", "Sales close")}
          </fieldset>

          <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[200px_1fr]">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ticket artwork
            </legend>
            <div
              className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border bg-navy-900 bg-cover bg-center"
              style={
                preview ? { backgroundImage: `url(${preview})` } : undefined
              }
            >
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: preview ? opacity : 0 }}
                aria-hidden
              />
              <span
                className="relative px-3 text-center text-sm font-semibold"
                style={{ color: textColor }}
              >
                Ticket preview
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium hover:bg-slate-50 focus-within:ring-2 focus-within:ring-ring">
                  <ImagePlus className="size-4" aria-hidden />{" "}
                  {preview ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                </label>
                {banner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBanner(null);
                      setPreview(event?.banner_image ?? null);
                    }}
                  >
                    <X className="size-3.5" /> Remove new image
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Uploaded as multipart form data; used on ticket PDFs.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Text colour"
                  htmlFor="event-color"
                  error={errors.ticket_text_color?.message}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Pick text colour"
                      className="h-8 w-10 cursor-pointer rounded border"
                      value={textColor || "#FFFFFF"}
                      onChange={() => undefined}
                      {...register("ticket_text_color")}
                    />
                    <Input
                      id="event-color"
                      className="font-mono uppercase"
                      {...register("ticket_text_color")}
                    />
                  </div>
                </FormField>
                <FormField
                  label={`Overlay opacity · ${Math.round((opacity ?? 0) * 100)}%`}
                  htmlFor="event-opacity"
                  error={errors.ticket_overlay_opacity?.message}
                >
                  <input
                    id="event-opacity"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    className="mt-2 w-full accent-blue-600"
                    {...register("ticket_overlay_opacity", {
                      valueAsNumber: true,
                    })}
                  />
                </FormField>
              </div>
            </div>
          </fieldset>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="event-form" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
