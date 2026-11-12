from django.contrib import admin

from .models import Event, TicketType

class TicketTypeInline(admin.TabularInline):
	model = TicketType
	extra = 1

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
	list_display = (
		'name',
		'venue',
		'start_date',
		'status',
		'created_by',
		'has_artwork',
	)

	list_filter = ('status', 'start_date')
	search_fields = ('name', 'venue')
	prepopulated_fields = {'slug': ('name',)}
	inlines = [TicketTypeInline]

	@admin.display(boolean=True, description='Has artwork')
	def has_artwork(self, obj):
		return bool(obj.banner_image)

@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
	list_display = (
		'name',
		'event',
		'price',
		'quantity_available',
		'is_active',
	)

	list_filter = ('is_active', 'currency')
	search_fields = ('name', 'event_name')
