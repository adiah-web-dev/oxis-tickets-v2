from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsEventManager
from .models import Event, TicketType
from .serializers import EventSerializer, TicketTypeSerializer

def can_manage_events(user):
	return user.is_superuser or user.role == 'event_manager'

class EventListCreateView(generics.ListCreateAPIView):
	serializer_class = EventSerializer

	def get_permissions(self):
		if self.request.method == 'POST':
			return [IsEventManager()]
		return [IsAuthenticated()]

	def get_queryset(self):
		queryset = Event.objects.all()

		if not can_manage_events(self.request.user):
			queryset = queryset.filter(status=Event.Status.PUBLISHED)

		return queryset

	def perform_create(self, serializer):
		serializer.save(created_by=self.request.user)

class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
	serializer_class = EventSerializer
	lookup_field = 'id'

	def get_permissions(self):
		if self.request.method in ['PUT', 'PATCH', 'DELETE']:
			return [IsEventManager()]
		return [IsAuthenticated()]

	def get_queryset(self):
		queryset = Event.objects.all()

		if not can_manage_events(self.request.user):
			queryset = queryset.filter(status=Event.Status.PUBLISHED)

		return queryset

class TicketTypeListCreateView(generics.ListCreateAPIView):
	serializer_class = TicketTypeSerializer

	def get_permissions(self):
		if self.request.method == 'POST':
			return [IsEventManager()]
		return [IsAuthenticated()]

	def get_queryset(self):
		queryset = TicketType.objects.select_related('event')

		if not can_manage_events(self.request.user):
			queryset = queryset.filter(
				event__status=Event.Status.PUBLISHED
			)

		return queryset

class TicketTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
	serializer_class = TicketTypeSerializer
	lookup_field = 'id'

	def get_permissions(self):
		if self.request.method in ['PUT', 'PATCH', 'DELETE']:
			return [IsEventManager()]
		return [IsAuthenticated()]

	def get_queryset(self):
		queryset = TicketType.objects.select_related('event')

		if not can_manage_events(self.request.user):
			queryset = queryset.filter(
				event__status=Event.Status.PUBLISHED
			)

		return queryset
