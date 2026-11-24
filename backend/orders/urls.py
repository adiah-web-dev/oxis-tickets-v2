from django.urls import path

from .views import (
	OrderCreateView,
	OrderListView,
	OrderDetailView,
	OrderCancelView,
	OrderSoftDeleteView,
)

urlpatterns = [
	path('', OrderListView.as_view(), name='order-list'),
	path('create/', OrderCreateView.as_view(), name='order-create'),
	path('<uuid:id>/', OrderDetailView.as_view(), name='order-detail'),
	path('<uuid:id>/cancel/', OrderCancelView.as_view(), name='order-cancel'),
	path('<uuid:id>/delete/', OrderSoftDeleteView.as_view(), name='order-soft-delete'),
]
