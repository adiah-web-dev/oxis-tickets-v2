from collections import Counter
from datetime import timedelta
from email.mime.image import MIMEImage
from urllib.parse import urljoin

from django.conf import settings
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

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
		# order = Order.objects.select_for_update().get(pk=order_id)
		order = Order.objects.select_for_update().select_related(
			'event'
		).get(pk=order_id)

		if order.status != Order.Status.CONFIRMED:
			return False

		delivery, created = TicketDelivery.objects.get_or_create(
			order=order,
			defaults={
				# 'recipient_email': 'vipconcierge@oxis.edu.tt'
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

		# Reserve this attempt.
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

		# Calculate ticketet quantities
		ticket_counts = Counter(
			ticket.order_item.ticket_type.name
			for ticket in tickets
		)

		ticket_summary = [
			{
				'name': name,
				'quantity': quantity,
			}
			for name, quantity in ticket_counts.items()
		]

		total_tickets = tickets.count()


		# Prepare email template context

		context = {
			'customer_name': order.customer_name,

			'event_name': event.name,
			'event_theme': getattr(event, 'theme', ''),
			'event_date': event.start_date,
			'event_venue': event.venue,

			# 'event_banner_url': event_banner_url,
			'event_banner_attached': bool(event.banner_image),

			'ticket_counts': ticket_summary,
			'total_tickets': total_tickets,
		}

		# Render HTML email
		html_content = render_to_string(
			'emails/ticket_delivery.html',
			context
		)

		# Plain-text fallback.
		text_content = (
			f"Dear {order.customer_name},\n\n"
			f"Thank you for your purchase!\n\n"
			f"Your tickets for {event.name} are attached.\n\n"
			f"Event: {event.name}\n"
			f"Date: {event.start_date}\n"
			f"Venue: {event.venue}n\n"
			f"Ticket Summary:\n"
		)

		for item in ticket_summary:
			text_content += (
				f"- {item['name']}: {item['quantity']}\n"
			)

		text_content += (
			f"\nTotal Tickets: {total_tickets}\n\n"
			'Please present the QR code on each ticket'
			'at the entrance. Each ticket can only be'
			'used once.\n\n'
			'We look forward to seeing you!\n\n'
			'The Oxbridge International School'
		)


		# text_content = strip_tags(html_content)
		# construct email

		email = EmailMultiAlternatives(
			subject=f'Your tickets for {event.name}',
			body=text_content,
			from_email=settings.DEFAULT_FROM_EMAIL,
			to=[delivery.recipient_email],
			# to=['vipconcierge@oxis.edu.tt'],
		)

		email.attach_alternative(html_content, 'text/html')

		if event.banner_image:
			with event.banner_image.open('rb') as image_file:
				banner_image = MIMEImage(image_file.read())

			banner_image.add_header(
				'Content-ID',
				'<event-banner>'
			)

			banner_image.add_header(
				'Content-Disposition',
				'inline',
				filename='event-banner'
			)

			email.attach(banner_image)


		# Generate and attach individual PDF tickets
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
