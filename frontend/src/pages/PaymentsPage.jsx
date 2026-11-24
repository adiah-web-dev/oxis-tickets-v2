import { Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "../components/common/DataTable";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { TablePagination } from "../components/common/TablePagination";
import { PaymentReviewActions } from "../components/payments/PaymentReviewActions";
import { PaymentVoidAction } from "../components/payments/PaymentVoidAction";
import { Card } from "../components/ui/Card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { useAuth } from "../contexts/AuthContext";
import { usePayments } from "../hooks/usePayments";
import { formatCurrency, formatDateTime } from "../lib/format";
import { paymentMethodLabels, paymentStatusMeta } from "../lib/status";

export function PaymentsPage() {
  const { can } = useAuth();
  const canVerify = can("verifyPayments");
  const [status, setStatus] = useState(canVerify ? "pending" : "all");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = usePayments({
    status: status === "all" ? undefined : status,
    page,
  });
  // Defensive client-side filter in case `status` isn't a server-side filter.
  const rows = data?.results.filter(
    (p) => status === "all" || p.status === status,
  );

  const columns = [
    {
      key: "order",
      header: "Order",
      cell: (p) => (
        <Link
          to={`/orders/${p.order}`}
          className="font-mono text-[13px] font-medium text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {p.order_number ?? "View order"}
        </Link>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "tabular-nums font-medium",
      cell: (p) => formatCurrency(p.amount),
    },
    {
      key: "method",
      header: "Method",
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
      cell: (p) => (
        <div className="min-w-0">
          <p>{paymentMethodLabels[p.method] ?? p.method}</p>
          {p.reference && (
            <p className="truncate text-xs text-muted-foreground">
              Ref {p.reference}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      className:
        "hidden xl:table-cell max-w-[240px] truncate text-muted-foreground",
      headerClassName: "hidden xl:table-cell",
      cell: (p) => p.notes || "—",
    },
    {
      key: "recorded",
      header: "Recorded",
      className: "hidden md:table-cell whitespace-nowrap text-muted-foreground",
      headerClassName: "hidden md:table-cell",
      cell: (p) => formatDateTime(p.received_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (p) =>
        p.is_voided ? (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            Voided
          </span>
        ) : (
          <StatusBadge {...paymentStatusMeta[p.status]} />
        ),
    },
    ...(canVerify
      ? [
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (p) => (
              <div className="flex justify-end gap-2">
                {p.status === "pending" && !p.is_voided && (
                  <PaymentReviewActions payment={p} />
                )}
                {!p.is_voided && <PaymentVoidAction payment={p} />}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        description={
          canVerify
            ? "Verify recorded payments. Fully verified orders are confirmed and their tickets issued automatically."
            : "Payments recorded against orders."
        }
      />

      <Card className="gap-0 overflow-hidden p-0">
        <div className="border-b p-4">
          <Tabs
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="pending">Awaiting verification</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(p) => p.id}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={() => refetch()}
          emptyState={
            <EmptyState
              icon={Wallet}
              title={
                status === "pending" ? "Nothing to verify" : "No payments found"
              }
              description={
                status === "pending"
                  ? "All recorded payments have been reviewed."
                  : "Payments recorded on orders will appear here."
              }
            />
          }
        />
        {data && data.count > 0 && (
          <TablePagination
            page={page}
            count={data.count}
            hasNext={!!data.next}
            hasPrevious={!!data.previous}
            onPageChange={setPage}
            itemLabel="payments"
          />
        )}
      </Card>
    </div>
  );
}
