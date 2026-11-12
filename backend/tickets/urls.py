from django.urls import path

from .views import TicketCheckInView, TicketDetailView, TicketListView, TicketQRCodeView, TicketPDFView, TicketDeliveryListView, TicketDeliveryDetailView, TicketDeliveryRetryView

urlpatterns = [
	path('', TicketListView.as_view(), name='ticket-list'),
	path('check-in/', TicketCheckInView.as_view(), name='ticket-check-in'),
	path('deliveries/', TicketDeliveryListView.as_view(), name='ticket-delivery-list'),
	path('deliveries/<uuid:id>/', TicketDeliveryDetailView.as_view(), name='ticket-delivery-detail'),
	path('deliveries/<uuid:id>/retry/', TicketDeliveryRetryView.as_view(), name='ticket-delivery-retry'),
	path('<uuid:id>/pdf/', TicketPDFView.as_view(), name='ticket-pdf'),
	path('<uuid:id>/qr/', TicketQRCodeView.as_view(), name='ticket-qr'),
	path('<uuid:id>/', TicketDetailView.as_view(), name='ticket-detail'),
]
