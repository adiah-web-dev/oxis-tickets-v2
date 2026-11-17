import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import (
	MaxValueValidator,
	MinValueValidator,
	RegexValidator,
)
from django.db import models
from django.utils.text import slugify

class Event(models.Model):

	class Status(models.TextChoices):
		DRAFT = 'draft', 'Draft'
		PUBLISHED = 'published', 'Published'
		CANCELLED = 'cancelled', 'Cancelled'
		COMPLETED = 'completed', 'Completed'

	id = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False,
	)

	name = models.CharField(max_length=200)
	slug = models.SlugField(max_length=220, unique=True, blank=True)

	description = models.TextField(blank=True)
	banner_image = models.ImageField(upload_to='event_artwork/', blank=True, null=True)
	ticket_text_color = models.CharField(
		max_length=7,
		default='#FFFFFF',
		validators=[
			RegexValidator(
				regex=r'^#[0-9A-Fa-f]{6}$',
				message='Enter a valid hex colour, e.g. #FFFFFF.',
			)
		],
	)

	ticket_overlay_opacity = models.DecimalField(
		max_digits=3,
		decimal_places=2,
		default=Decimal('0.45'),
		validators=[
			MinValueValidator(Decimal('0.00')),
			MaxValueValidator(Decimal('0.85')),
		]
	)

	venue = models.CharField(max_length=255)

	start_date = models.DateTimeField()
	end_date = models.DateTimeField()

	sales_start = models.DateTimeField()
	sales_end = models.DateTimeField()

	status = models.CharField(
		max_length=20,
		choices=Status.choices,
		default=Status.DRAFT
	)

	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.PROTECT,
		related_name='created_events',
	)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def save(self, *args, **kwargs):
		if not self.slug:
			self.slug = slugify(self.name)

		super().save(*args, **kwargs)

	def clean(self):
		errors = {}

		if self.end_date and self.start_date:
			if self.end_date <= self.start_date:
				errors['end_date'] = 'End date must be after start date.'

		if self.sales_start and self.sales_end:
			if self.sales_end <= self.sales_start:
				errors['sales_end'] = 'Sales end must be after sales start.'

		if errors:
			raise ValidationError(errors)

	def __str__(self):
		return self.name

	class Meta:
		ordering = ['-start_date']

class TicketType(models.Model):

	id = models.UUIDField(
		primary_key=True,
		default=uuid.uuid4,
		editable=False,
	)

	event = models.ForeignKey(
		Event,
		on_delete=models.CASCADE,
		related_name='ticket_types',
	)

	name = models.CharField(max_length=100)
	description = models.TextField(blank=True)

	price = models.DecimalField(
		max_digits=10,
		decimal_places=2,
		default=0,
	)

	currency = models.CharField(
		max_length=3,
		default='TTD',
	)

	quantity_available = models.PositiveIntegerField()

	max_per_order = models.PositiveIntegerField(null=True, blank=True, default=None)

	sale_start = models.DateTimeField(
		null=True,
		blank=True,
	)

	sale_end = models.DateTimeField(
		null=True,
		blank=True,
	)

	is_active = models.BooleanField(default=True)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def clean(self):
		errors = {}

		if self.price is not None and self.price < 0:
			errors['price'] = 'Price cannot be negative.'

		if self.max_per_order and self.quantity_available:
			if self.max_per_order > self.quantity_available:
				errors['max_per_order'] = (
					'Maximum per order cannot exceed available quantity.'
				)

		if self.sale_start and self.sale_end:
			if self.sale_end <= self.sale_start:
				errors['sale_end'] = 'Sale end must be after sale start.'

		if errors:
			raise ValidationError(errors)

	def __str__(self):
		return f'{self.event.name} - {self.name}'

	class Meta:
		ordering = ['price', 'name']
		constraints = [
			models.UniqueConstraint(
				fields=['event', 'name'],
				name='unique_ticket_type_per_event',
			),
		]
