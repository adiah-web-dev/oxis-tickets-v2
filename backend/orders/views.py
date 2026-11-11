from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsEventManagerOrCashier

from .models import Order
from .serializers import (
	CreateOrderSerializer,
	OrderDetailSerializer,
)

class OrderCreateView(generics.CreateAPIView):
	serializer_class = CreateOrderSerializer
	permission_classes = [IsEventManagerOrCashier]

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		order = serializer.save()

		response_serializer = OrderDetailSerializer(order)

		return Response(
			response_serializer.data,
			status=status.HTTP_201_CREATED
		)

class OrderPagination(PageNumberPagination):
	page_size = 25
	page_size_query_param = 'page_size'
	max_page_size = 100

class OrderListView(generics.ListAPIView):
	serializer_class = OrderDetailSerializer
	permission_classes = [IsEventManagerOrCashier]
	pagination_class = OrderPagination

	filter_backends = [
		DjangoFilterBackend,
		SearchFilter,
		OrderingFilter,
	]

	filterset_fields = ['event', 'status']

	search_fields = [
		'order_number',
		'customer_name',
		'customer_email',
		'customer_phone',
	]

	ordering_fields = ['created_at', 'customer_name']
	ordering = ['-created_at']

	def get_queryset(self):
		return(
			Order.objects
			.select_related('event', 'created_by')
			.prefetch_related('items', 'items__ticket_type')
			.all()
		)

class OrderDetailView(generics.RetrieveAPIView):
	serializer_class = OrderDetailSerializer
	permission_classes = [IsEventManagerOrCashier]

	lookup_field = 'id'

	def get_queryset(self):
		return (
			Order.objects
			.select_related('event', 'created_by')
			.prefetch_related('items', 'items__ticket_type')
		)

class OrderCancelView(APIView):
	permission_classes = [IsEventManagerOrCashier]

	@transaction.atomic
	def post(self, request, id):
		order = get_object_or_404(
			Order.objects.select_for_update()
			.select_related('event')
			.prefetch_related('items', 'items__ticket_type'),
			id=id
		)

		if order.status == Order.Status.CANCELLED:
			return Response(
				OrderDetailSerializer(order).data,
				status=status.HTTP_200_OK
			)

		if order.status == Order.Status.CONFIRMED:
			return Response(
				{
					'detail': (
						'Confirmed orders cannot be cancelled'
						'through this endpoint.'
					)
				},
				status=status.HTTP_400_BAD_REQUEST
			)

		order.status = Order.Status.CANCELLED
		order.save(update_fields=['status', 'updated_at'])

		return Response(
			OrderDetailSerializer(order).data,
			status=status.HTTP_200_OK
		)
