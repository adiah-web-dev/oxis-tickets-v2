import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from orders.models import Order

class Payment(models.Model):

	class Method(models.TextChoices):
		CASH = 'cash', 'Cash'
		BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
		CHEQUE = 'cheque', 'Cheque'
		CARD = 'card', 'Card'
		OTHER = 'other', 'Other'

	class Status(models.TextChoices):
		PENDING = 'pending', 'Pending Verification'
		VERIFIED = 'verified', 'Verified'
		REJECTED = 'rejected', 'Rejected'
		REFUNDED = 'refunded', 'Refunded'

	id = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False
	)

	order = models.ForeignKey(
		Order,
		on_delete=models.PROTECT,
		related_name='payments'
	)

	amount = models.DecimalField(
		max_digits=10,
		decimal_places=2,
		validators=[MinValueValidator(0.01)]
	)

	method = models.CharField(
		max_length=20,
		choices=Method.choices
	)

	reference = models.CharField(
		max_length=150,
		blank=True,
		help_text='Bank reference, cheque number, or transaction ID.'
	)

	notes = models.TextField(blank=True)

	status = models.CharField(
		max_length=20,
		choices=Status.choices,
		default=Status.PENDING
	)

	received_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.PROTECT,
		related_name='recorded_payments'
	)

	verified_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.PROTECT,
		related_name= 'verified_payments',
		null=True,
		blank=True
	)

	received_at = models.DateTimeField(auto_now_add=True)
	verified_at = models.DateTimeField(null=True, blank=True)

	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f'{self.order.order_number} - {self.amount}'

	class Meta:
		ordering = ['-received_at']
		indexes = [
			models.Index(fields=['order', 'status']),
			models.Index(fields=['received_at']),
		]
