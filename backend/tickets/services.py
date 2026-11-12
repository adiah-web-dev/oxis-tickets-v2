from django.db import transaction

from orders.models import Order, OrderItem
from .models import Ticket

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
