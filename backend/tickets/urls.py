from django.urls import path

from .views import TicketCheckInView, TicketDetailView, TicketListView, TicketQRCodeView

urlpatterns = [
	path('', TicketListView.as_view(), name='ticket-list'),
	path('check-in/', TicketCheckInView.as_view(), name='ticket-check-in'),
	path('<uuid:id>/qr/', TicketQRCodeView.as_view(), name='ticket-qr'),
	path('<uuid:id>/', TicketDetailView.as_view(), name='ticket-detail'),
]
