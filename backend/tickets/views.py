from io import BytesIO
from datetime import timedelta

import qrcode

from django.db import models, transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from accounts.permissions import IsEventManager, IsEventManagerOrScanner, IsEventManagerOrCashier
from .models import Ticket, TicketDelivery
from .pdf import generate_ticket_pdf
from .serializers import TicketCheckInSerializer, TicketListSerializer, TicketDetailSerializer, TicketDeliverySerializer
from .services import send_ticket_email_for_order

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

class TicketQRCodeView(APIView):
	permission_classes = [
		IsAuthenticated,
		IsEventManagerOrCashier
	]

	renderer_classes = [JSONRenderer]

	def get(self, request, id):
		ticket = get_object_or_404(
			Ticket.objects.select_related(
				'order_item',
				'order_item__order'
			),
			id=id
		)

		# Generate a QR code containing only the ticket code.
		qr = qrcode.QRCode(
			version=None,
			error_correction=qrcode.constants.ERROR_CORRECT_M,
			box_size=10,
			border=4,
		)

		qr.add_data(ticket.ticket_code)
		qr.make(fit=True)

		image = qr.make_image(
			fill_color='black',
			back_color='white'
		)

		# Convert the image into PNG bytes.
		buffer = BytesIO()
		image.save(buffer, format='PNG')
		buffer.seek(0)

		response = HttpResponse(
			buffer.getvalue(),
			content_type='image/png'
		)

		response['Content-Disposition'] = (
			f'inline; filename="ticket-{ticket.ticket_code}.png"'
		)

		return response

class TicketPDFView(APIView):
	permission_classes = [
		IsAuthenticated,
		IsEventManagerOrCashier
	]

	renderer_classes = [JSONRenderer]

	def get(self, request, id):
		ticket = get_object_or_404(
			Ticket.objects.select_related(
				'order_item',
				'order_item__order',
				'order_item__order__event',
				'order_item__ticket_type',
			),
			id=id
		)

		if ticket.status == Ticket.Status.CANCELLED:
			return Response(
				{
					'success': False,
					'message': 'Cannot generate a PDF for a cancelled ticket.'
				},
				status=status.HTTP_400_BAD_REQUEST
			)

		if ticket.order_item.order.status != 'confirmed':
			return Response(
				{
					'success': False,
					'message': 'Tickets can only be downloaded for confirmed orders.'
				},
				status=status.HTTP_400_BAD_REQUEST
			)

		pdf_buffer = generate_ticket_pdf(ticket)

		response = HttpResponse(
			pdf_buffer.getvalue(),
			content_type='application/pdf'
		)

		response['Content-Disposition'] = (
			f'attachment; filename="ticket-{ticket.ticket_code}.pdf"'
		)

		return response

class TicketDeliveryListView(generics.ListAPIView):
	serializer_class = TicketDeliverySerializer
	permission_classes = [IsEventManager]

	def get_queryset(self):
		queryset = TicketDelivery.objects.select_related(
			'order',
			'order__event',
		).all()

		status_filter = self.request.query_params.get('status')
		order_id = self.request.query_params.get('order')
		event_id = self.request.query_params.get('event')

		if status_filter:
			queryset = queryset.filter(status=status_filter)

		if order_id:
			queryset = queryset.filter(order_id=order_id)

		if event_id:
			queryset = queryset.filter(order__event_id=event_id)

		return queryset


class TicketDeliveryDetailView(generics.RetrieveAPIView):
	serializer_class = TicketDeliverySerializer
	permission_classes = [IsEventManager]
	lookup_field = 'id'
	lookup_url_kwarg = 'id'
	queryset = TicketDelivery.objects.select_related(
		'order',
		'order__event',
	).all()

class TicketDeliveryRetryView(generics.GenericAPIView):
	permission_classes = [IsEventManager]
	queryset = TicketDelivery.objects.select_related('order').all()

	lookup_field = 'id'
	lookup_url_kwarg = 'id'

	def post(self, request, *args, **kwargs):
		delivery = self.get_object()

		if delivery.status == TicketDelivery.Status.SENT:
			raise ValidationError({
				'delivery': 'This order\'s tickets have already been emailed.'
			})

		if (
			delivery.status == TicketDelivery.Status.PENDING
			and delivery.attemps == 0
		):
			raise ValidationError({
				'delivery': 'No previous delivery attempt exists.'
			})

		if (
			delivery.status == TicketDelivery.Status.PENDING
			and delivery.updated_at > timezone.now() - timedelta(minutes=10)
		):
			raise ValidationError({
				'delivery': 'An email delivery attempt is already in progress.'
			})

		success = send_ticket_email_for_order(delivery.order_id)

		delivery.refresh_from_db()

		return Response({
			'success': success,
			'delivery': TicketDeliverySerializer(delivery).data,
		}, status=status.HTTP_200_OK)
