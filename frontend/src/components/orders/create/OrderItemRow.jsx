import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { formatCurrency, toNumber } from "../../../lib/format";
import { FormField } from "../../common/FormField";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/Select";

export const remainingFor = (t) =>
  t.quantity != null ? Math.max(0, t.quantity - (t.quantity_sold ?? 0)) : null;

export function OrderItemRow({
  index,
  control,
  register,
  setValue,
  errors,
  ticketTypes,
  selectedType,
  quantity,
  takenTypeIds,
  typesDisabled,
  canRemove,
  onRemove,
}) {
  const rowErrors = errors.items?.[index];
  const id = (field) => `items-${index}-${field}`;
  const max = selectedType?.max_per_order ?? undefined;
  const remaining = selectedType ? remainingFor(selectedType) : null;
  const step = (delta) =>
    setValue(
      `items.${index}.quantity`,
      Math.max(1, (Number(quantity) || 0) + delta),
      { shouldValidate: true },
    );

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-lg border bg-white p-4"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-start">
        <FormField
          label="Ticket type"
          htmlFor={id("type")}
          error={rowErrors?.ticket_type?.message}
          required
        >
          <Controller
            control={control}
            name={`items.${index}.ticket_type`}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={typesDisabled}
              >
                <SelectTrigger
                  id={id("type")}
                  className="w-full"
                  aria-invalid={!!rowErrors?.ticket_type || undefined}
                  onBlur={field.onBlur}
                >
                  <SelectValue
                    placeholder={
                      typesDisabled
                        ? "Select an event first"
                        : "Choose a ticket type"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((type) => {
                    const left = remainingFor(type);
                    const taken =
                      takenTypeIds.includes(type.id) && type.id !== field.value;
                    return (
                      <SelectItem
                        key={type.id}
                        value={type.id}
                        disabled={taken || left === 0}
                      >
                        {type.name} · {formatCurrency(type.price)}
                        {left === 0
                          ? " (sold out)"
                          : taken
                            ? " (already added)"
                            : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField
          label="Quantity"
          htmlFor={id("qty")}
          error={rowErrors?.quantity?.message}
          required
        >
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-r-none"
              onClick={() => step(-1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </Button>
            <Input
              id={id("qty")}
              type="number"
              inputMode="numeric"
              min={1}
              max={max}
              className="rounded-none border-x-0 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              aria-invalid={!!rowErrors?.quantity || undefined}
              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-l-none"
              onClick={() => step(1)}
              disabled={max !== undefined && quantity >= max}
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </FormField>

        <div className="flex items-end justify-between gap-2 sm:flex-col sm:items-end sm:pt-6">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label={`Remove item ${index + 1}`}
            className="text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {selectedType && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span>
            {max ? `Max ${max} per order` : "No per-order limit"}
            {remaining !== null && ` · ${remaining} remaining`}
          </span>
          <span className="tabular-nums">
            Est.{" "}
            {formatCurrency(
              toNumber(selectedType.price) * (Number(quantity) || 0),
            )}
          </span>
        </div>
      )}
    </motion.li>
  );
}
