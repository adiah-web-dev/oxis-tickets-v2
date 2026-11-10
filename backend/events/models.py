import uuid

from django.conf import settings
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

	max_per_order = models.PositiveIntegerField(default=10)

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
