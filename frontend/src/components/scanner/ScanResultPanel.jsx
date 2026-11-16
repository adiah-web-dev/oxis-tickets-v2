import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ScanLine,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { formatDateTime } from "../../lib/format";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

function TicketFacts({ ticket, code, tone }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-3 rounded-xl p-4 text-sm",
        tone === "dark" ? "bg-white/10" : "bg-white/70",
      )}
    >
      {ticket && (
        <>
          <div className="col-span-2">
            <dt className="text-xs opacity-70">Event</dt>
            <dd className="font-medium">{ticket.event_name}</dd>
          </div>
          <div>
            <dt className="text-xs opacity-70">Ticket type</dt>
            <dd className="font-medium">
              {ticket.ticket_type_name ?? ticket.ticket_type}
            </dd>
          </div>
          <div>
            <dt className="text-xs opacity-70">Order</dt>
            <dd className="font-mono text-[13px] font-medium">
              {ticket.order_number}
            </dd>
          </div>
        </>
      )}
      <div className="col-span-2">
        <dt className="text-xs opacity-70">Ticket code</dt>
        <dd className="break-all font-mono text-[13px] font-medium">
          {ticket?.ticket_code ?? code}
        </dd>
      </div>
    </dl>
  );
}

export function ScanResultPanel({ state, onConfirm, onReset }) {
  return (
    <div aria-live="assertive" className="min-h-[340px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={state.phase}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          {state.phase === "idle" && (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
              <ScanLine className="size-10 text-slate-300" aria-hidden />
              <p className="mt-4 text-base font-semibold">
                Waiting for a ticket
              </p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Scan a QR code or type the ticket code. The result will appear
                here.
              </p>
            </div>
          )}

          {state.phase === "looking-up" && (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-2xl border bg-white p-8 text-center">
              <Loader2
                className="size-10 animate-spin text-blue-600"
                aria-hidden
              />
              <p className="mt-4 text-base font-semibold">Checking ticket…</p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {state.code}
              </p>
            </div>
          )}

          {state.phase === "checking-in" && !state.ticket && (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-2xl border bg-white p-8 text-center">
              <Loader2
                className="size-10 animate-spin text-emerald-600"
                aria-hidden
              />
              <p className="mt-4 text-base font-semibold">Checking in…</p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {state.code}
              </p>
            </div>
          )}

          {(state.phase === "valid" ||
            (state.phase === "checking-in" && state.ticket)) && (
            <div className="flex h-full flex-col rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 text-navy-900 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <ShieldCheck className="size-5" aria-hidden /> Valid ticket
              </div>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Customer
              </p>
              <p className="text-3xl font-semibold tracking-tight">
                {state.ticket?.customer_name}
              </p>
              <div className="mt-4">
                <TicketFacts
                  ticket={state.ticket}
                  code={state.code}
                  tone="light"
                />
              </div>
              <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-[1fr_auto]">
                <Button
                  size="lg"
                  onClick={onConfirm}
                  disabled={state.phase === "checking-in"}
                  className="h-14 bg-emerald-600 text-lg font-semibold text-white hover:bg-emerald-700"
                  autoFocus
                >
                  {state.phase === "checking-in" ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-5" aria-hidden />
                  )}
                  Confirm check-in
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onReset}
                  disabled={state.phase === "checking-in"}
                  className="h-14 bg-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {state.phase === "checked-in" && (
            <div className="flex h-full flex-col rounded-2xl bg-emerald-600 p-5 text-white sm:p-6">
              <div className="flex items-center gap-3">
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 16 }}
                  className="flex size-12 items-center justify-center rounded-full bg-white text-emerald-600"
                >
                  <CheckCircle2 className="size-7" aria-hidden />
                </motion.span>
                <div>
                  <p className="text-xl font-semibold">Checked in</p>
                  <p className="text-sm text-emerald-50">Welcome them in</p>
                </div>
              </div>
              {state.ticket && (
                <p className="mt-5 text-3xl font-semibold tracking-tight">
                  {state.ticket.customer_name}
                </p>
              )}
              <div className="mt-4">
                <TicketFacts
                  ticket={state.ticket}
                  code={state.code}
                  tone="dark"
                />
              </div>
              <Button
                size="lg"
                onClick={onReset}
                className="mt-auto h-14 w-full bg-white text-lg font-semibold text-emerald-700 hover:bg-emerald-50"
                autoFocus
              >
                Scan next ticket
              </Button>
            </div>
          )}

          {state.phase === "already-checked-in" && (
            <div className="flex h-full flex-col rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-950 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-amber-500 text-white">
                  <AlertTriangle className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="text-xl font-semibold">Already checked in</p>
                  <p className="text-sm text-amber-800">
                    {state.ticket?.checked_in_at
                      ? `Entered ${formatDateTime(state.ticket.checked_in_at)}`
                      : state.message}
                    {state.ticket?.checked_in_by_email &&
                      ` by ${state.ticket.checked_in_by_email}`}
                  </p>
                </div>
              </div>
              {state.ticket && (
                <p className="mt-5 text-3xl font-semibold tracking-tight">
                  {state.ticket.customer_name}
                </p>
              )}
              <div className="mt-4">
                <TicketFacts
                  ticket={state.ticket}
                  code={state.code}
                  tone="light"
                />
              </div>
              <p className="mt-4 text-sm text-amber-900">
                Do not admit again without checking with the events office.
              </p>
              <Button
                size="lg"
                onClick={onReset}
                className="mt-auto h-14 w-full bg-amber-600 text-lg font-semibold text-white hover:bg-amber-700"
                autoFocus
              >
                Scan next ticket
              </Button>
            </div>
          )}

          {state.phase === "invalid" && (
            <div className="flex h-full min-h-[340px] flex-col rounded-2xl bg-red-600 p-5 text-white sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-white text-red-600">
                  <XCircle className="size-7" aria-hidden />
                </span>
                <div>
                  <p className="text-xl font-semibold">Invalid ticket</p>
                  <p className="text-sm text-red-100">Do not admit</p>
                </div>
              </div>
              <p className="mt-6 text-xs uppercase tracking-wide text-red-100">
                Scanned code
              </p>
              <p className="break-all font-mono text-lg font-semibold">
                {state.code}
              </p>
              <p className="mt-3 rounded-lg bg-white/10 p-3 text-sm">
                {state.message}
              </p>
              <Button
                size="lg"
                onClick={onReset}
                className="mt-auto h-14 w-full bg-white text-lg font-semibold text-red-700 hover:bg-red-50"
                autoFocus
              >
                Try another ticket
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
