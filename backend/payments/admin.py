from django.contrib import admin

from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
	list_display = [
		'order',
		'amount',
		'method',
		'status',
		'received_by',
		'received_at',
		'verified_by',
	]

	list_filter = [
		'status',
		'method',
		'received_at',
	]

	search_fields = [
		'order__order_number',
		'order__customer_name',
		'reference',
	]

	readonly_fields = [
		'id',
		'order',
		'amount',
		'method',
		'reference',
		'notes',
		'status',
		'received_by',
		'received_at',
		'verified_by',
		'verified_at',
		'updated_at',
	]

	list_select_related = [
		'order',
		'received_by',
		'verified_by',
	]

	def has_add_permission(self, request):
		return False

	def has_delete_permission(self, request, obj=None):
		return False
