import secrets
import uuid

from django.conf import settings
from django.db import models

def generate_ticket_code():
	return f'OX-{secrets.token_hex(8).upper()}'

class Ticket(models.Model):
	class Status(models.TextChoices):
		VALID = 'valid', 'Valid'
		USED = 'used', 'Used'
		CANCELLED = 'cancelled', 'Cancelled'

	id = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False
	)

	order_item = models.ForeignKey(
		'orders.OrderItem',
		on_delete=models.PROTECT,
		related_name='tickets'
	)

	ticket_code = models.CharField(
		max_length=19,
		unique=True,
		default=generate_ticket_code,
		editable=False
	)

	status = models.CharField(
		max_length=20,
		choices=Status.choices,
		default=Status.VALID
	)

	issued_at = models.DateTimeField(auto_now_add=True)

	checked_in_at = models.DateTimeField(null=True, blank=True)

	checked_in_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='checked_in_tickets'
	)

	class Meta:
		ordering = ['-issued_at']
		indexes = [
			models.Index(fields=['status']),
			models.Index(fields=['order_item']),
		]

	def __str__(self):
		return self.ticket_code

	@property
	def order(self):
		return self.order_item.order
