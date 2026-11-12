from django.urls import path

from .views import TicketCheckInView, TicketDetailView, TicketListView

urlpatterns = [
	path('', TicketListView.as_view(), name='ticket-list'),
	path('check-in/', TicketCheckInView.as_view(), name='ticket-check-in'),
	path('<uuid:id>/', TicketDetailView.as_view(), name='ticket-detail'),
]
