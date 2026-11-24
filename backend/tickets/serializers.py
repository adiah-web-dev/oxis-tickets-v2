from rest_framework import serializers
from .models import Ticket, TicketDelivery

class TicketCheckInSerializer(serializers.Serializer):
	ticket_code = serializers.CharField(
		max_length=19,
		required=True,
		trim_whitespace=True
	)

	def validate_ticket_code(self, value):
		return value.upper()

class TicketListSerializer(serializers.ModelSerializer):
	order_number = serializers.CharField(
		source='order_item.order.order_number',
		read_only=True
	)

	customer_name = serializers.CharField(
		source='order_item.order.customer_name',
		read_only=True
	)

	event_name = serializers.CharField(
		source='order_item.order.event.name',
		read_only=True
	)

	ticket_type = serializers.CharField(
		source='order_item.ticket_type.name',
		read_only=True
	)

	class Meta:
		model = Ticket
		fields = [
			'id',
			'ticket_code',
			'order_number',
			'customer_name',
			'event_name',
			'ticket_type',
			'status',
			'issued_at',
		]

class TicketDetailSerializer(TicketListSerializer):
	customer_email = serializers.EmailField(
		source='order_item.order.customer_email',
		read_only=True
	)

	checked_in_at = serializers.DateTimeField(read_only=True)

	cancelled_by_email = serializers.EmailField(
		source='cancelled_by.email',
		read_only=True,
		allow_null=True,
	)

	checked_in_by_email = serializers.EmailField(
		source='checked_in_by.email',
		read_only=True,
		allow_null=True
	)

	class Meta(TicketListSerializer.Meta):
		fields = TicketListSerializer.Meta.fields + [
			'customer_email',
			'checked_in_at',
			'checked_in_by_email',
			'cancelled_at',
			'cancelled_by_email',
			'cancellation_reason',
		]

class TicketDeliverySerializer(serializers.ModelSerializer):
	order_number = serializers.CharField(
		source='order.order_number',
		read_only=True,
	)

	order_status = serializers.CharField(
		source='order.status',
		read_only=True,
	)

	class Meta:
		model = TicketDelivery
		fields = [
			'id',
			'order',
			'order_number',
			'order_status',
			'recipient_email',
			'status',
			'attempts',
			'sent_at',
			'last_error',
			'created_at',
			'updated_at',
		]
		read_only_fields = fields
