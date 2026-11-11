from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from rest_framework import serializers

from events.models import Event, TicketType
from .models import Order, OrderItem

class OrderItemInputSerializer(serializers.Serializer):
	ticket_type = serializers.PrimaryKeyRelatedField(
		queryset=TicketType.objects.all()
	)
	quantity = serializers.IntegerField(min_value=1)

class OrderItemReadSerializer(serializers.ModelSerializer):
	ticket_type_name = serializers.CharField(
		source='ticket_type.name',
		read_only=True
	)
	line_total = serializers.DecimalField(
		max_digits=12,
		decimal_places=2,
		read_only=True
	)

	class Meta:
		model = OrderItem
		fields = [
			'id',
			'ticket_type',
			'ticket_type_name',
			'quantity',
			'unit_price',
			'line_total',
		]

class OrderDetailSerializer(serializers.ModelSerializer):
	event_name = serializers.CharField(
		source='event.name',
		read_only=True
	)
	items = OrderItemReadSerializer(many=True, read_only=True)
	total = serializers.DecimalField(
		max_digits=12,
		decimal_places=2,
		read_only=True
	)

	class Meta:
		model = Order
		fields = [
			'id',
			'order_number',
			'event',
			'event_name',
			'customer_name',
			'customer_email',
			'customer_phone',
			'status',
			'items',
			'total',
			'expires_at',
			'created_at',
		]

class CreateOrderSerializer(serializers.ModelSerializer):
	event = serializers.PrimaryKeyRelatedField(
		queryset=Event.objects.all()
	)
	items = OrderItemInputSerializer(many=True)

	class Meta:
		model = Order
		fields = [
			'event',
			'customer_name',
			'customer_email',
			'customer_phone',
			'items',
		]

	def validated_items(self, items):
		if not items:
			raise serializers.ValidationError(
				'An order must contain at least one ticket type.'
			)

		ticket_type_ids = [
			item['ticket_type'].id for item in items
		]

		if len(ticket_type_ids) != len(set(ticket_type_ids)):
			raise serializers.ValidationError(
				'Each ticket type can only appear once in an order.'
				'Combine quantities for duplicate ticket types.'
			)

		return items

	@transaction.atomic
	def create(self, validated_data):
		items_data = validated_data.pop('items')
		event = validated_data.pop('event')
		now = timezone.now()

		# Lock the event row. Prevent overselling
		event = Event.objects.select_for_update().get(pk=event.pk)

		if event.status != Event.Status.PUBLISHED:
			raise serializers.ValidationError({
				'event': 'This event is not currently available for sale.'
			})

		if not (event.sales_start <= now <= event.sales_end):
			raise serializers.ValidationError({
				'event': 'Ticket sales for this event are not currently open.'
			})

		ticket_type_ids = sorted(
			item['ticket_type'].id for item in items_data
		)

		# Lock ticket type rows in a consistent order.
		locked_ticket_types = {
			ticket.id: ticket
			for ticket in TicketType.objects.select_for_update()
			.filter(id__in=ticket_type_ids)
			.order_by('id')
		}

		# Calculate all tickets already reserved by active pending orders.
		reserved_quantities = dict(
			OrderItem.objects.filter(
				ticket_type_id__in=ticket_type_ids,
				order__status=Order.Status.PENDING,
				order__expires_at__gt=now,
			)
			.values('ticket_type_id')
			.annotate(total=Sum('quantity'))
			.values_list('ticket_type_id', 'total')
		)

		for item in items_data:
			ticket_type = locked_ticket_types.get(
				item['ticket_type'].id
			)
			quantity = item['quantity']

			if ticket_type is None:
				raise serializers.ValidationError({
					'items': 'One or more ticket types no longer exist.'
				})

			if ticket_type.event_id != event.id:
				raise serializers.ValidationError({
					'items': (
						f'{ticket_type.name} does not belong to '
						'the selected event.'
					)
				})

			if not ticket_type.is_active:
				raise serializers.ValidationError({
					'items': f'{ticket_type.name} is not available.'
				})

			if quantity > ticket_type.max_per_order:
				raise serializers.ValidationError({
					'items': (
						f'You can only purchase up to '
						f'{ticket_type.max_per_order} '
						f'{ticket_type.name} tickets per order.'
					)
				})

			if (ticket_type.sale_start and now < ticket_type.sale_start):
				raise serializers.ValidationError({
					'items': f'Sales for {ticket_type.name} have not started.'
				})

			if (ticket_type.sale_end and now > ticket_type.sale_end):
				raise serializers.ValidationError({
					'items': f'Sales for {ticket_type.name} have ended.'
				})

			already_reserved = reserved_quantities.get(ticket_type.id, 0)

			available = (ticket_type.quantity_available - already_reserved)

			if quantity > available:
				raise serializers.ValidationError({
					'items': (
						f'Only {max(available, 0)}'
						f'{ticket_type.name} tickets are available.'
					)
				})

		# Create the order only after all items pass validation.
		order = Order.objects.create(
			event=event,
			created_by=self.context['request'].user,
			**validated_data,
		)

		# Save each ticket type and its current price.
		OrderItem.objects.bulk_create([
			OrderItem(
				order=order,
				ticket_type=locked_ticket_types[item['ticket_type'].id],
				quantity=item['quantity'],
				unit_price=locked_ticket_types[
					item['ticket_type'].id
				].price,
			)
			for item in items_data
		])

		return order
