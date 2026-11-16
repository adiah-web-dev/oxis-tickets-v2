import { Check, X } from "lucide-react";
import { useState } from "react";
import { useRejectPayment, useVerifyPayment } from "../../hooks/usePayments";
import { formatCurrency } from "../../lib/format";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Button } from "../ui/Button";

/** Verify / reject buttons with confirmation — shown to event managers on pending payments. */
export function PaymentReviewActions({ payment }) {
  const verify = useVerifyPayment();
  const reject = useRejectPayment();
  const [action, setAction] = useState(null);
  const label = `${formatCurrency(payment.amount)}${payment.order_number ? ` for ${payment.order_number}` : ""}`;

  return (
    <div
      className="flex justify-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setAction("reject")}
      >
        <X className="size-3.5" aria-hidden /> Reject
      </Button>
      <Button
        size="sm"
        className="bg-emerald-600 text-white hover:bg-emerald-700"
        onClick={() => setAction("verify")}
      >
        <Check className="size-3.5" aria-hidden /> Verify
      </Button>

      <ConfirmDialog
        open={action === "verify"}
        onOpenChange={(open) => !open && setAction(null)}
        title="Verify this payment?"
        description={
          <>
            Confirm that {label} has been received. If this completes the order
            total, the order is confirmed and tickets are generated and emailed
            automatically.
          </>
        }
        confirmLabel="Verify payment"
        isPending={verify.isPending}
        onConfirm={() =>
          verify.mutate(payment, { onSettled: () => setAction(null) })
        }
      />
      <ConfirmDialog
        open={action === "reject"}
        onOpenChange={(open) => !open && setAction(null)}
        title="Reject this payment?"
        description={
          <>
            {label} will be marked as rejected and will no longer count towards
            the order total.
          </>
        }
        confirmLabel="Reject payment"
        destructive
        isPending={reject.isPending}
        onConfirm={() =>
          reject.mutate(payment, { onSettled: () => setAction(null) })
        }
      />
    </div>
  );
}
