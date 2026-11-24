import { Ban } from "lucide-react";
import { useState } from "react";
import { useVoidPayment } from "../../hooks/usePayments";
import { formatCurrency } from "../../lib/format";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Button } from "../ui/Button";

export function PaymentVoidAction({ payment }) {
  const [open, setOpen] = useState(false);
  const mutation = useVoidPayment();

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        <Ban className="size-3.5" aria-hidden /> Void
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Void this payment?"
        description={`${formatCurrency(payment.amount)} will remain in the payment history with its original status, but it will no longer count towards revenue. Voiding a payment does not automatically cancel the order or its tickets.`}
        confirmLabel="Void payment"
        destructive
        isPending={mutation.isPending}
        onConfirm={() =>
          mutation.mutate({ payment }, { onSettled: () => setOpen(false) })
        }
      />
    </>
  );
}
