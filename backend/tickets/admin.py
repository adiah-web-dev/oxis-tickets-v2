from django.contrib import admin

from .models import Ticket

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
	list_display = (
		'ticket_code',
		'order_item',
		'status',
		'issued_at',
		'checked_in_at',
	)

	list_filter = ('status', 'issued_at')
	search_fields = (
		'ticket_code',
		'order_item__order__order_number',
		'order_item__order__customer_name',
		'order_item__order__customer_email',
	)

	readonly_fields = (
		'id',
		'ticket_code',
		'order_item',
		'issued_at',
		'checked_in_at',
		'checked_in_by',
	)

	def has_add_permission(self, request):
		return False

	def has_delete_permission(self, request, obj=None):
		return False
