import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { FormField } from "../components/common/FormField";
import { OrderConfirmation } from "../components/orders/create/OrderConfirmation";
import { OrderItemRow } from "../components/orders/create/OrderItemRow";
import {
  OrderSummaryPanel,
  estimateOrder,
} from "../components/orders/create/OrderSummaryPanel";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import { useEventFilter } from "../contexts/EventFilterContext";
import { useEvents } from "../hooks/useEvents";
import { useCreateOrder } from "../hooks/useOrders";
import { getApiErrorMessage, getFieldErrors } from "../lib/errors";
import { formatCurrency, formatDate, isPastDate } from "../lib/format";
import { emptyItem, orderFormSchema, toOrderPayload } from "../lib/orderSchema";
import { eventStatusMeta } from "../lib/status";

const FORM_ID = "create-order-form";
const CUSTOMER_FIELDS = [
  "event",
  "customer_name",
  "customer_email",
  "customer_phone",
];

function unavailableReason(event) {
  if (event.status !== "published")
    return eventStatusMeta[event.status].label.toLowerCase();
  if (event.sales_start && !isPastDate(event.sales_start))
    return `sales open ${formatDate(event.sales_start)}`;
  if (event.sales_end && isPastDate(event.sales_end)) return "sales closed";
  return null;
}

export function CreateOrderPage() {
  const [searchParams] = useSearchParams();
  const { selectedEventId } = useEventFilter();
  const [createdOrder, setCreatedOrder] = useState(null);
  const [serverError, setServerError] = useState(null);

  const events = useEvents();
  const createOrder = useCreateOrder();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitted },
  } = useForm({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      event: searchParams.get("event") ?? selectedEventId ?? "",
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      items: [{ ...emptyItem }],
    },
    mode: "onTouched",
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const eventId = useWatch({ control, name: "event" });
  const items = useWatch({ control, name: "items" }) ?? [];
  const selectedEvent = events.data?.find((e) => e.id === eventId);
  const ticketTypes = selectedEvent?.ticket_types ?? [];
  const hasErrors = isSubmitted && Object.keys(errors).length > 0;
  const estimate = estimateOrder(items, ticketTypes);

  const onSubmit = (values) => {
    setServerError(null);
    createOrder.mutate(toOrderPayload(values), {
      onSuccess: (order) => {
        setCreatedOrder(order);
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      onError: (error) => {
        const fieldErrors = getFieldErrors(error);
        CUSTOMER_FIELDS.forEach(
          (f) => fieldErrors[f] && setError(f, { message: fieldErrors[f] }),
        );
        const others = Object.entries(fieldErrors).filter(
          ([f]) => !CUSTOMER_FIELDS.includes(f),
        );
        if (!Object.keys(fieldErrors).length || others.length)
          setServerError(
            others.length
              ? others.map(([, m]) => m).join(" ")
              : getApiErrorMessage(error),
          );
      },
    });
  };

  const startNew = () => {
    reset({
      event: eventId,
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      items: [{ ...emptyItem }],
    });
    setServerError(null);
    setCreatedOrder(null);
  };

  if (createdOrder)
    return (
      <OrderConfirmation order={createdOrder} onCreateAnother={startNew} />
    );

  const ariaFor = (field) => ({
    "aria-invalid": !!errors[field] || undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  return (
    <div className="pb-24 lg:pb-0">
      <p className="mb-6 text-sm text-muted-foreground">
        Reserve tickets for a customer. Payment is recorded next; tickets are
        issued once it’s verified.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form
          id={FORM_ID}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">The order couldn’t be created</p>
                <p>{serverError}</p>
              </div>
            </div>
          )}

          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-[15px]">1. Event</CardTitle>
              <CardDescription>
                Only published events with open sales can take orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                label="Event"
                htmlFor="event"
                error={errors.event?.message}
                required
              >
                <Controller
                  control={control}
                  name="event"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setValue("items", [{ ...emptyItem }]);
                      }}
                      disabled={events.isLoading}
                    >
                      <SelectTrigger
                        id="event"
                        className="h-10 w-full"
                        aria-invalid={!!errors.event || undefined}
                      >
                        <SelectValue
                          placeholder={
                            events.isLoading
                              ? "Loading events…"
                              : "Select an event"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {events.data?.map((event) => {
                          const reason = unavailableReason(event);
                          return (
                            <SelectItem
                              key={event.id}
                              value={event.id}
                              disabled={!!reason}
                            >
                              {event.name} — {formatDate(event.start_date)}
                              {reason ? ` (${reason})` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              {events.error && (
                <p className="mt-2 text-xs text-red-600">
                  Events could not be loaded: {getApiErrorMessage(events.error)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-[15px]">2. Customer</CardTitle>
              <CardDescription>
                Tickets will be emailed here once payment is verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full name"
                htmlFor="customer_name"
                error={errors.customer_name?.message}
                required
                className="sm:col-span-2"
              >
                <Input
                  id="customer_name"
                  autoComplete="name"
                  placeholder="e.g. John Smith"
                  {...register("customer_name")}
                  {...ariaFor("customer_name")}
                />
              </FormField>
              <FormField
                label="Email address"
                htmlFor="customer_email"
                error={errors.customer_email?.message}
                required
              >
                <Input
                  id="customer_email"
                  type="email"
                  autoComplete="email"
                  placeholder="parent@example.com"
                  {...register("customer_email")}
                  {...ariaFor("customer_email")}
                />
              </FormField>
              <FormField
                label="Phone number"
                htmlFor="customer_phone"
                error={errors.customer_phone?.message}
                required
              >
                <Input
                  id="customer_phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="868 123 4567"
                  {...register("customer_phone")}
                  {...ariaFor("customer_phone")}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-[15px]">3. Tickets</CardTitle>
              <CardDescription>
                Choose ticket types and quantities. Availability and limits are
                checked by the server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedEvent && ticketTypes.length === 0 && (
                <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertCircle className="size-4 shrink-0" aria-hidden /> This
                  event has no ticket types yet.
                </p>
              )}
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {fields.map((field, index) => (
                    <OrderItemRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      setValue={setValue}
                      errors={errors}
                      ticketTypes={ticketTypes}
                      selectedType={ticketTypes.find(
                        (t) => t.id === items[index]?.ticket_type,
                      )}
                      quantity={Number(items[index]?.quantity) || 0}
                      takenTypeIds={items
                        .map((i) => i.ticket_type)
                        .filter(Boolean)}
                      typesDisabled={!selectedEvent}
                      canRemove={fields.length > 1}
                      onRemove={() => remove(index)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
              {errors.items?.root?.message && (
                <p className="text-xs font-medium text-red-600">
                  {errors.items.root.message}
                </p>
              )}
              <button
                type="button"
                onClick={() => append({ ...emptyItem })}
                disabled={!selectedEvent || fields.length >= ticketTypes.length}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:border-slate-300 disabled:hover:bg-transparent"
              >
                <Plus className="size-4" aria-hidden /> Add another ticket type
              </button>
            </CardContent>
          </Card>
        </form>

        <div className="lg:sticky lg:top-24">
          <OrderSummaryPanel
            formId={FORM_ID}
            event={selectedEvent}
            items={items}
            ticketTypes={ticketTypes}
            isSubmitting={createOrder.isPending}
            hasErrors={hasErrors}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(15,31,61,0.06)] lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {estimate.tickets} ticket{estimate.tickets === 1 ? "" : "s"} ·
              estimate
            </p>
            <p className="text-lg font-semibold tabular-nums text-navy-900">
              {formatCurrency(estimate.total)}
            </p>
          </div>
          <Button
            type="submit"
            form={FORM_ID}
            size="lg"
            disabled={createOrder.isPending}
          >
            {createOrder.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            Create order
          </Button>
        </div>
      </div>
    </div>
  );
}
