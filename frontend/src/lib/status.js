export const eventStatusMeta = {
  draft: { label: "Draft", tone: "neutral" },
  published: { label: "Published", tone: "info" },
  cancelled: { label: "Cancelled", tone: "danger" },
  completed: { label: "Completed", tone: "success" },
};

export const orderStatusMeta = {
  pending: { label: "Pending payment", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const paymentStatusMeta = {
  pending: { label: "Awaiting verification", tone: "warning" },
  verified: { label: "Verified", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const ticketStatusMeta = {
  valid: { label: "Not checked in", tone: "info" },
  used: { label: "Checked in", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export const deliveryStatusMeta = {
  sent: { label: "Sent", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
};

export const paymentMethodLabels = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  card: "Card",
  other: "Other",
};
