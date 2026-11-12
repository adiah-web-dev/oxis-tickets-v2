from django.db import models, transaction
from django.utils import timezone

from rest_framework import generics
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsEventManagerOrScanner, IsEventManagerOrCashier
from .models import Ticket
from .serializers import TicketCheckInSerializer, TicketListSerializer, TicketDetailSerializer

class TicketCheckInView(APIView):
	permission_classes = [IsAuthenticated, IsEventManagerOrScanner]

	def post(self, request):
		serializer = TicketCheckInSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		ticket_code = serializer.validated_data['ticket_code']

		with transaction.atomic():
			try:
				ticket = (
					Ticket.objects
					.select_for_update()
					.get(ticket_code=ticket_code)
				)
			except Ticket.DoesNotExist:
				return Response(
					{
						'success': False,
						'message': 'Ticket not found.'
					},
					status=status.HTTP_404_NOT_FOUND
				)

			# The order must be confirmed before entry is allowed.
			if ticket.order_item.order.status != 'confirmed':
				return Response(
					{
						'success': False,
						'message': 'This ticket does not belong to a confirmed order.'
					},
					status=status.HTTP_400_BAD_REQUEST
				)

			if ticket.status == Ticket.Status.USED:
				return Response(
					{
						'success': False,
						'message': 'This ticket has already been used.',
						'checked_in_at': ticket.checked_in_at
					},
					status=status.HTTP_400_BAD_REQUEST
				)

			if ticket.status == Ticket.Status.CANCELLED:
				return Response(
					{
						'success': False,
						'message': 'This ticket has been cancelled.'
					},
					status=status.HTTP_400_BAD_REQUEST
				)

			ticket.status = Ticket.Status.USED
			ticket.checked_in_at = timezone.now()
			ticket.checked_in_by = request.user

			ticket.save(
				update_fields=[
					'status',
					'checked_in_at',
					'checked_in_by'
				]
			)

		return Response(
			{
				'success': True,
				'message': 'Ticket successfully checked in.',
				'ticket': {
					'ticket_code': ticket.ticket_code,
					'status': ticket.status,
					'customer_name': ticket.order_item.order.customer_name,
					'event': ticket.order_item.order.event.name,
					'ticket_type': ticket.order_item.ticket_type.name,
					'checked_in_at': ticket.checked_in_at,
				}
			},
			status=status.HTTP_200_OK
		)

class TicketListView(generics.ListAPIView):
	serializer_class = TicketListSerializer
	permission_classes = [
		IsAuthenticated,
		IsEventManagerOrCashier
	]

	def get_queryset(self):
		queryset = Ticket.objects.select_related(
			'order_item',
			'order_item__order',
			'order_item__order__event',
			'order_item__ticket_type',
		)

		event_id = self.request.query_params.get('event')
		order_id = self.request.query_params.get('order')
		ticket_status = self.request.query_params.get('status')
		search = self.request.query_params.get('search')

		if event_id:
			queryset = queryset.filter(
				order_item__order__event_id=event_id
			)

		if order_id:
			queryset = queryset.filter(
				order_item__order_id=order_id
			)

		if ticket_status:
			queryset = queryset.filter(status=ticket_status)

		if search:
			queryset = queryset.filter(
				models.Q(ticket_code__icontains=search)
				| models.Q(
					order_item__order__order_number__icontains=search
				)
				| models.Q(
					order_item__order__customer_name__icontains=search
				)
				| models.Q(
					order_item__order__customer_email__icontains=search
				)
			)
		return queryset

class TicketDetailView(generics.RetrieveAPIView):
	serializer_class = TicketDetailSerializer
	permission_classes = [
		IsAuthenticated,
		IsEventManagerOrCashier
	]
	lookup_field = 'id'

	queryset = Ticket.objects.select_related(
		'order_item',
		'order_item__order',
		'order_item__order__event',
		'order_item__ticket_type',
		'checked_in_by',
	)
