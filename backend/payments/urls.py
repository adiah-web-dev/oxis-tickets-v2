from django.urls import path

from .views import (
	PaymentListView,
	PaymentCreateView,
	PaymentDetailView,
	PaymentVerifyView,
	PaymentRejectView,
)

urlpatterns = [
	path('', PaymentListView.as_view(), name='payment-list'),
	path('create/', PaymentCreateView.as_view(), name='payment-create'),
	path('<uuid:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
	path('<uuid:id>/verify/', PaymentVerifyView.as_view(), name='payment-verify'),
	path('<uuid:id>/reject/', PaymentRejectView.as_view(), name='payment-reject'),
]
