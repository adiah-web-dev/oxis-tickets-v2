from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Event, TicketType

class TicketTypeSerializer(serializers.ModelSerializer):
	class Meta:
		model = TicketType
		fields = [
			'id',
			'event',
			'name',
			'description',
			'price',
			'currency',
			'quantity_available',
			'max_per_order',
			'sale_start',
			'sale_end',
			'is_active',
			'created_at',
			'updated_at',
		]
		read_only_fields = ['id', 'created_at', 'updated_at']

	def validate(self, attrs):
		instance = self.instance or TicketType()
		for field, value in attrs.items():
			setattr(instance, field, value)
		try:
			instance.full_clean()
		except DjangoValidationError as exc:
			raise serializers.ValidationError(
				getattr(exc, 'message_dict', exc.messages)
			)

		return attrs

class EventSerializer(serializers.ModelSerializer):
	ticket_types = TicketTypeSerializer(many=True, read_only =True)
	created_by_email = serializers.EmailField(
		source='created_by.email',
		read_only=True,
	)

	class Meta:
		model = Event
		fields = [
			'id',
			'name',
			'slug',
			'description',
			'venue',
			'start_date',
			'end_date',
			'sales_start',
			'sales_end',
			'status',
			'created_by_email',
			'ticket_types',
			'created_at',
			'updated_at',
		]
		read_only_fields = [
			'id',
			'slug',
			'created_by_email',
			'ticket_types',
			'create_at',
			'updated_at',
		]

	def validate(self, attrs):
		instance = self.instance or Event()

		for field, value in attrs.items():
			setattr(instance, field, value)
		try:
			instance.full_clean(exclude=['created_by'])
		except DjangoValidationError as exc:
			raise serializers.ValidationError(
				getattr(exc, 'message_dict', exc.messages)
			)

		return attrs
