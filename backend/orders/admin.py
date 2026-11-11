from django.contrib import admin

from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
	model = OrderItem
	extra = 0
	readonly_fields = ['id', 'line_total']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
	list_display = [
		'order_number',
		'customer_name',
		'event',
		'status',
		'created_at',
	]

	list_filter = ['status', 'event', 'created_at']

	search_fields = [
		'order_number',
		'customer_name',
		'customer_email',
	]

	readonly_fields = [
		'id',
		'order_number',
		'created_at',
		'updated_at',
	]

	inlines = [OrderItemInline]

	list_select_related = ['event', 'created_by']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
	list_display = [
		'order',
		'ticket_type',
		'quantity',
		'unit_price',
	]

	list_select_related = ['order', 'ticket_type']
