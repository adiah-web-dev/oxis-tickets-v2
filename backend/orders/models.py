import uuid
import secrets
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from events.models import Event, TicketType


def generate_order_number():
	return f'OX-{timezone.now():%Y}-{secrets.token_hex(4).upper()}'

def default_expiry():
	return timezone.now() + timedelta(minutes=30)

class Order(models.Model):
	# Stores the customer's information, the event, the overall status
	# and who created the order.
	class Status(models.TextChoices):
		PENDING = 'pending', 'Pending'
		CONFIRMED = 'confirmed', 'Confirmed'
		CANCELLED = 'cancelled', 'Cancelled'

	id = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False
	)

	order_number = models.CharField(
		max_length=30,
		unique=True,
		default=generate_order_number
	)

	event = models.ForeignKey(
		Event,
		on_delete=models.PROTECT,
		related_name='orders'
	)

	customer_name = models.CharField(max_length=200)
	customer_email = models.EmailField()
	customer_phone = models.CharField(max_length=30, blank=True)

	status = models.CharField(
		max_length=20,
		choices=Status.choices,
		default=Status.PENDING
	)

	expires_at = models.DateTimeField(
		null=True,
		blank=True,
		default=None,
	)

	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.PROTECT,
		related_name='created_orders'
	)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	is_deleted = models.BooleanField(default=False)
	deleted_at = models.DateTimeField(null=True, blank=True)
	deleted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_orders')
	deletion_reason = models.TextField(blank=True)

	@property
	def total(self):
		return sum(
			(item.line_total for item in self.items.all()),
			Decimal("0.00")
		)

	def __str__(self):
		return self.order_number

	class Meta:
		ordering = ['-created_at']
		indexes = [
			models.Index(fields=['event', 'status']),
			models.Index(fields=['status', 'expires_at']),
		]

class OrderItem(models.Model):
	# Each ticket type included in that order.
	# E.G. an order could contain two VIP and three General Admission tickets.
	id = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False
	)

	order = models.ForeignKey(
		Order,
		on_delete=models.CASCADE,
		related_name='items'
	)

	ticket_type = models.ForeignKey(
		TicketType,
		on_delete=models.PROTECT,
		related_name='order_items'
	)

	quantity = models.PositiveIntegerField()

	# Snapshot of the ticket price when the order was created.
	unit_price = models.DecimalField(
		max_digits=10,
		decimal_places=2
	)

	@property
	def line_total(self):
		if self.quantity is None or self.unit_price is None:
			return None

		return self.quantity * self.unit_price

	def clean(self):
		from django.core.exceptions import ValidationError

		if self.quantity < 1:
			raise ValidationError({
				'quantity': 'Quantity must be at least 1.'
			})

		if self.order_id and self.ticket_type_id:
			if self.order.event_id != self.ticket_type.event_id:
				raise ValidationError(
					"The ticket type must belong to the order's event."
				)

	def __str__(self):
		return f'{self.ticket_type.name} x {self.quantity}'

	class Meta:
		ordering = ['id']
		constraints = [
			models.UniqueConstraint(
				fields=['order', 'ticket_type'],
				name='unique_ticket_type_per_order'
			)
		]
