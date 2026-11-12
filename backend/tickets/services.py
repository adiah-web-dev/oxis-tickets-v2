from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMessage
from django.db import transaction
from django.utils import timezone

from orders.models import Order, OrderItem
from .models import Ticket, TicketDelivery
from .pdf import generate_ticket_pdf

@transaction.atomic
def issue_tickets_for_order(order_id):
	"""
	Generate one ticket for every quantity purchased
	in a confirmed order.

	Safe to call more than once for the same order.
	"""
	# Lock th order so two requests cannot issue tickets
	# for it simultaneously
	order = Order.objects.select_for_update().get(pk=order_id)

	if order.status != 'confirmed':
		raise ValueError(
			'Tickets can only be issued for confirmed orders.'
		)

	order_items = OrderItem.objects.select_for_update().filter(
		order_id=order.pk
	)

	created_tickets = []

	for item in order_items:
		existing_count = Ticket.objects.filter(
			order_item=item
		).count()

		if existing_count > item.quantity:
			raise ValueError(
				f'More tickets exist than the quantity purchased'
				f'for order item {item.pk}.'
			)

		missing_count = item.quantity - existing_count

		new_tickets = [
			Ticket(order_item=item)
			for _ in range(missing_count)
		]

		if new_tickets:
			Ticket.objects.bulk_create(new_tickets)
			created_tickets.extend(new_tickets)

	return created_tickets


def send_ticket_email_for_order(order_id):
	"""
	Email all PDF tickets for a confirmed order.

	A sent delivery cannot be sent again accidentally.
	Failed deliveries can be retried.
	"""

	# First reserve the delivery attempt in the database.
	with transaction.atomic():
		order = Order.objects.select_for_update().get(pk=order_id)

		if order.status != Order.Status.CONFIRMED:
			return False

		delivery, created = TicketDelivery.objects.get_or_create(
			order=order,
			defaults={
				'recipient_email': order.customer_email,
			},
		)

		delivery = TicketDelivery.objects.select_for_update().get(
			pk=delivery.pk
		)

		if delivery.status == TicketDelivery.Status.SENT:
			return True

		# Another attempt is already in progress.
		if (
			delivery.status == TicketDelivery.Status.PENDING
			and delivery.attempts > 0
			and delivery.updated_at > timezone.now() - timedelta(minutes=10)
		):
			return False

		delivery.recipient_email = order.customer_email
		delivery.status = TicketDelivery.Status.PENDING
		delivery.attempts += 1
		delivery.last_error = ""

		delivery.save(update_fields=[
			'recipient_email',
			'status',
			'attempts',
			'last_error',
			'updated_at',
		])

		delivery_id = delivery.pk

	# Generate the attachments and send outside the transaction.
	try:
		tickets = Ticket.objects.filter(
			order_item__order_id=order_id
		).select_related(
			'order_item__order__event',
			'order_item__ticket_type',
		).order_by('issued_at')

		if not tickets.exists():
			raise ValueError('No tickets have been issued for this order.')

		event = order.event

		email = EmailMessage(
			subject=f'Your tickets for {event.name}',
			body=(
				f'Hello {order.customer_name},\n\n'
				f'Thank you for your purchase.\n\n'
				f'Attached are your tickets for {event.name}.\n'
				'Please present the QR code on each ticket at the'
				'entrance. Each ticket can only be used once.\n\n'
				'We look forward to seeing you!\n\n'
				'Oxbridge International School'
			),
			from_email=settings.DEFAULT_FROM_EMAIL,
			to=[order.customer_email],
		)

		for ticket in tickets:
			pdf_buffer = generate_ticket_pdf(ticket)

			email.attach(
				filename=f'ticket-{ticket.ticket_code}.pdf',
				content=pdf_buffer.getvalue(),
				mimetype='application/pdf',
			)

		sent_count = email.send(fail_silently=False)

		if sent_count != 1:
			raise RuntimeError('The email backend did not confirm delivery.')

		TicketDelivery.objects.filter(pk=delivery_id).update(
			status=TicketDelivery.Status.SENT,
			sent_at=timezone.now(),
			last_error='',
			updated_at=timezone.now(),
		)

		return True

	except Exception as exc:
		TicketDelivery.objects.filter(pk=delivery_id).update(
			status=TicketDelivery.Status.FAILED,
			last_error=str(exc),
			updated_at=timezone.now()
		)

		return False
