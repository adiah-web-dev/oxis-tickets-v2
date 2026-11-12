from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from accounts.permissions import (
	IsEventManager,
	IsEventManagerOrCashier,
)

from orders.models import Order
from .models import Payment
from .serializers import (
	CreatePaymentSerializer,
	PaymentDetailSerializer,
)

from tickets.services import issue_tickets_for_order

class PaymentListView(generics.ListAPIView):
	serializer_class = PaymentDetailSerializer
	permission_classes = [IsEventManagerOrCashier]

	filter_backends = [
		DjangoFilterBackend,
		SearchFilter,
		OrderingFilter,
	]

	filterset_fields = ['status', 'method', 'order']
	search_fields = [
		'order__order_number',
		'order__customer_name',
		'reference',
	]

	ordering_fields = ['received_at', 'amount']
	ordering = ['-received_at']

	def get_queryset(self):
		return (
			Payment.objects.select_related(
				'order',
				'received_by',
				'verified_by',
			)
		)


class PaymentCreateView(generics.CreateAPIView):
	serializer_class = CreatePaymentSerializer
	permission_classes = [IsEventManagerOrCashier]

	@transaction.atomic
	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		order_id = serializer.validated_data['order'].id

		# Lock the order while checking its balance and recording payment.
		order = get_object_or_404(
			Order.objects.select_for_update(),
			id=order_id,
		)

		if order.status != Order.Status.PENDING:
			raise ValidationError({
				'order': 'Payments can only be recorded against pending orders.'
			})

		if order.expires_at <= timezone.now():
			raise ValidationError({
				'order': 'This order has expired.'
			})

		verified_total = (
			order.payments.filter(status=Payment.Status.VERIFIED)
			.aggregate(total=Sum('amount'))['total'] or 0
		)

		pending_total = (
			order.payments.filter(status=Payment.Status.PENDING)
			.aggregate(total=Sum('amount'))['total'] or 0
		)

		remaining_balance = (
			order.total - verified_total - pending_total
		)

		amount = serializer.validated_data['amount']

		if amount > remaining_balance:
			raise ValidationError({
				'amount': (
					f'Payment exceeds the remaining balance of '
					f'{remaining_balance}.'
				)
			})

		payment = serializer.save(received_by=request.user)

		return Response(
			PaymentDetailSerializer(payment).data,
			status=status.HTTP_201_CREATED,
		)

class PaymentDetailView(generics.RetrieveAPIView):
	serializer_class = PaymentDetailSerializer
	permission_classes = [IsEventManagerOrCashier]

	def get_queryset(self):
		return Payment.objects.select_related(
			'order',
			'received_by',
			'verified_by',
		)

class PaymentVerifyView(APIView):
	permission_classes = [IsEventManager]

	@transaction.atomic
	def post(self, request, id):
		# Lock the payment and its associated order.
		payment = get_object_or_404(
			Payment.objects.select_for_update(),
			id=id,
		)

		order = get_object_or_404(
			Order.objects.select_for_update(),
			id=payment.order_id,
		)

		if payment.status != Payment.Status.PENDING:
			raise ValidationError({
				'payment': 'Only pending payments can be verified.'
			})

		if order.status != Order.Status.PENDING:
			raise ValidationError({
				'order': 'This order is no longer pending.'
			})

		if order.expires_at <= timezone.now():
			raise ValidationError({
				'order': 'This order has expired and cannot be confirmed.'
			})

		verified_total = (
			order.payments.filter(status=Payment.Status.VERIFIED)
			.aggregate(total=Sum('amount'))['total'] or 0
		)

		new_verified_total = verified_total + payment.amount

		if new_verified_total > order.total:
			raise ValidationError({
				'payment': 'This payment would exceed the order total.'
			})

		payment.status = Payment.Status.VERIFIED
		payment.verified_by = request.user
		payment.verified_at = timezone.now()
		payment.save(update_fields=[
			'status',
			'verified_by',
			'verified_at',
			'updated_at',
		])

		# Confirm the order only when it is fully paid.
		if new_verified_total == order.total:
			order.status = Order.Status.CONFIRMED
			order.save(update_fields=['status', 'updated_at'])

			issue_tickets_for_order(order.id)

		return Response({
			'payment': PaymentDetailSerializer(payment).data,
			'verified_total': str(new_verified_total),
			'order_total': str(order.total),
			'order_status': order.status,
		})


class PaymentRejectView(APIView):
	permission_classes = [IsEventManager]

	@transaction.atomic
	def post(self, request, id):
		payment = get_object_or_404(
			Payment.objects.select_for_update(),
			id=id,
		)

		if payment.status != Payment.Status.PENDING:
			raise ValidationError({
				'payment': 'Only pending payments can be rejected.'
			})

		payment.status = Payment.Status.REJECTED
		payment.verified_by = request.user
		payment.verified_at = timezone.now()
		payment.save(update_fields=[
			'status',
			'verified_by',
			'verified_at',
			'updated_at',
		])

		return Response(
			PaymentDetailSerializer(payment).data,
			status=status.HTTP_200_OK,
		)
