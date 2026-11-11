from rest_framework import generics, status
from rest_framework.response import Response

from accounts.permissions import IsEventManagerOrCashier

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
