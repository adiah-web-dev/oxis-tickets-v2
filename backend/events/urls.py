from django.urls import path

from .views import (
	EventListCreateView,
	EventDetailView,
	TicketTypeListCreateView,
	TicketTypeDetailView,
)

urlpatterns = [
	path('', EventListCreateView.as_view(), name='event-list-create'),
	path('<uuid:id>/', EventDetailView.as_view(), name='event-detail'),
	path(
		'ticket-types/',
		TicketTypeListCreateView.as_view(),
		name='ticket-type-list-create',
	),
	path(
		'ticket-types/<uuid:id>/',
		TicketTypeDetailView.as_view(),
		name='ticket-type-detail',
	),
]
