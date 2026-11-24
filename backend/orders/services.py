from django.db import transaction
from django.utils import timezone

from orders.models import Order
from payments.models import Payment
from tickets.models import Ticket


@transaction.atomic
def soft_delete_order(order_id, user, reason=""):
    order = Order.objects.select_for_update().get(pk=order_id)

    if order.is_deleted:
        return order

    now = timezone.now()
    reason = (reason or "").strip() or "Order deleted by administrator."

    # Keep already-cancelled tickets' original cancellation audit details.
    Ticket.objects.filter(
        order_item__order=order,
    ).exclude(
        status=Ticket.Status.CANCELLED,
    ).update(
        status=Ticket.Status.CANCELLED,
        cancelled_at=now,
        cancelled_by=user,
        cancellation_reason=reason,
    )

    Payment.objects.filter(order=order, is_voided=False).update(
        is_voided=True,
        voided_at=now,
        voided_by=user,
        voided_reason=reason,
        updated_at=now,
    )

    order.is_deleted = True
    order.status = Order.Status.CANCELLED
    order.deleted_at = now
    order.deleted_by = user
    order.deletion_reason = reason
    order.save(update_fields=[
        "is_deleted", "status", "deleted_at", "deleted_by",
        "deletion_reason", "updated_at",
    ])
    return order


@transaction.atomic
def void_payment(payment_id, user, reason=""):
    payment = Payment.objects.select_for_update().select_related("order").get(pk=payment_id)
    if payment.is_voided:
        return payment

    payment.is_voided = True
    payment.voided_at = timezone.now()
    payment.voided_by = user
    payment.voided_reason = (reason or "").strip() or "Payment voided by administrator."
    payment.save(update_fields=[
        "is_voided", "voided_at", "voided_by", "voided_reason", "updated_at",
    ])
    return payment


@transaction.atomic
def cancel_ticket(ticket_id, user, reason=""):
    ticket = Ticket.objects.select_for_update().select_related("order_item__order").get(pk=ticket_id)
    if ticket.status == Ticket.Status.CANCELLED:
        return ticket

    ticket.status = Ticket.Status.CANCELLED
    ticket.cancelled_at = timezone.now()
    ticket.cancelled_by = user
    ticket.cancellation_reason = (reason or "").strip() or "Ticket invalidated by administrator."
    ticket.save(update_fields=["status", "cancelled_at", "cancelled_by", "cancellation_reason"])
    return ticket
