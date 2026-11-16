import { AxiosError } from "axios";
import { useCallback, useRef, useState } from "react";
import { getApiErrorMessage, getHttpStatus } from "../lib/errors";
import { playScanFeedback } from "../lib/scanFeedback";
import { parseTicketCode } from "../lib/ticketCode";
import {
  checkInTicket,
  findTicketByCode,
  getTicket,
} from "../services/ticketService";
import { useInvalidateOrderWorkflow } from "./useOrders";

function ticketFromError(error) {
  const data = error instanceof AxiosError ? error.response?.data : undefined;
  return data?.ticket ?? null;
}

/** Scanner state machine. The backend is always the authority on validity and check-in. */
export function useTicketScanner({ autoCheckIn, sound, canPreview }) {
  const [state, setState] = useState({ phase: "idle" });
  const [log, setLog] = useState([]);
  const busyRef = useRef(false);
  const lastScanRef = useRef(null);
  const invalidate = useInvalidateOrderWorkflow();

  const addLog = useCallback((entry) => {
    setLog((current) =>
      [
        { ...entry, id: `${Date.now()}-${Math.random()}`, at: new Date() },
        ...current,
      ].slice(0, 12),
    );
  }, []);

  const checkIn = useCallback(
    async (code, preview) => {
      setState({ phase: "checking-in", code, ticket: preview });
      try {
        const ticket = (await checkInTicket(code)) ?? preview;
        invalidate();
        setState({ phase: "checked-in", code, ticket });
        playScanFeedback("success", sound);
        addLog({
          code,
          holder: ticket?.customer_name ?? null,
          outcome: "checked-in",
        });
      } catch (error) {
        const status = getHttpStatus(error);
        const message = getApiErrorMessage(error);
        if (status === 400 && /already|used/i.test(message)) {
          const ticket = ticketFromError(error) ?? preview;
          setState({ phase: "already-checked-in", code, ticket, message });
          playScanFeedback("warning", sound);
          addLog({
            code,
            holder: ticket?.customer_name ?? null,
            outcome: "already",
          });
        } else {
          setState({
            phase: "invalid",
            code,
            message:
              status === 404
                ? "No ticket matches this code. It may be forged or from another system."
                : message,
          });
          playScanFeedback("error", sound);
          addLog({
            code,
            holder: preview?.customer_name ?? null,
            outcome: "invalid",
          });
        }
      } finally {
        busyRef.current = false;
      }
    },
    [addLog, invalidate, sound],
  );

  const lookup = useCallback(
    async (raw) => {
      const code = parseTicketCode(raw);
      if (!code || busyRef.current) return;
      const last = lastScanRef.current;
      if (last && last.code === code && Date.now() - last.at < 2500) return;
      lastScanRef.current = { code, at: Date.now() };
      busyRef.current = true;

      if (!canPreview) {
        await checkIn(code, null);
        return;
      }

      setState({ phase: "looking-up", code });
      try {
        const found = await findTicketByCode(code);
        if (!found) {
          setState({
            phase: "invalid",
            code,
            message:
              "No ticket matches this code. It may be forged or from another system.",
          });
          playScanFeedback("error", sound);
          addLog({ code, holder: null, outcome: "invalid" });
          busyRef.current = false;
          return;
        }
        if (found.status === "used") {
          const detail = await getTicket(found.id).catch(() => found);
          setState({
            phase: "already-checked-in",
            code,
            ticket: detail,
            message: "This ticket has already been used.",
          });
          playScanFeedback("warning", sound);
          addLog({ code, holder: found.customer_name, outcome: "already" });
          busyRef.current = false;
          return;
        }
        if (found.status === "cancelled") {
          setState({
            phase: "invalid",
            code,
            message: `This ticket was cancelled (order ${found.order_number}).`,
          });
          playScanFeedback("error", sound);
          addLog({ code, holder: found.customer_name, outcome: "invalid" });
          busyRef.current = false;
          return;
        }
        if (autoCheckIn) {
          await checkIn(found.ticket_code, found);
          return;
        }
        setState({ phase: "valid", code: found.ticket_code, ticket: found });
        playScanFeedback("success", sound);
        addLog({ code, holder: found.customer_name, outcome: "valid" });
        busyRef.current = false;
      } catch (error) {
        setState({
          phase: "invalid",
          code,
          message: getApiErrorMessage(error),
        });
        playScanFeedback("error", sound);
        busyRef.current = false;
      }
    },
    [addLog, autoCheckIn, canPreview, checkIn, sound],
  );

  const confirm = useCallback(() => {
    if (state.phase !== "valid" || busyRef.current) return;
    busyRef.current = true;
    void checkIn(state.code, state.ticket);
  }, [checkIn, state]);

  const reset = useCallback(() => {
    busyRef.current = false;
    lastScanRef.current = null;
    setState({ phase: "idle" });
  }, []);

  return { state, log, lookup, confirm, reset };
}
