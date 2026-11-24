from django.utils import timezone
from rest_framework import serializers

from .models import Payment

class CreatePaymentSerializer(serializers.ModelSerializer):
	class Meta:
		model = Payment
		fields = [
			'id',
			'order',
			'amount',
			'method',
			'reference',
			'notes',
			'status',
			'received_at',
		]

		read_only_fields = [
			'id',
			'status',
			'received_at',
		]

	def validate_amount(self, value):
		if value <= 0:
			raise serializers.ValidationError(
				'Payment amount must be greater than zero.'
			)
		return value


	def validate(self, attrs):
		order = attrs['order']

		if order.is_deleted:
			raise serializers.ValidationError({'order': 'Deleted orders cannot receive payments.'})

		if order.status != 'pending':
			raise serializers.ValidationError({
				'order': 'Payments can only be recorded against pending orders.'
			})

		if (
			order.expires_at is not None
			and order.expires_at <= timezone.now()
		):
			raise serializers.ValidationError({
				'order': 'This order has expired.'
			})

		return attrs

class PaymentDetailSerializer(serializers.ModelSerializer):
	order_number = serializers.CharField(
		source='order.order_number',
		read_only=True
	)
	order_event = serializers.IntegerField(source='order.event_id', read_only=True)
	received_by_email = serializers.EmailField(
		source='received_by.email',
		read_only=True
	)
	verified_by_email = serializers.EmailField(
		source='verified_by.email',
		read_only=True,
		allow_null=True,
	)
	voided_by_email = serializers.EmailField(
		source='voided_by.email', read_only=True, allow_null=True
	)

	class Meta:
		model = Payment
		fields = [
			'id',
			'order',
			'order_number',
			'order_event',
			'amount',
			'method',
			'reference',
			'notes',
			'status',
			'received_by_email',
			'verified_by_email',
			'received_at',
			'verified_at',
			'updated_at',
			'is_voided',
			'voided_at',
			'voided_by_email',
			'voided_reason',
		]
