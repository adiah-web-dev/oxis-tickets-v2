from rest_framework import serializers

class TicketCheckInSerializer(serializers.Serializer):
	ticket_code = serializers.CharField(
		max_length=19,
		required=True,
		trim_whitespace=True
	)

	def validate_ticket_code(self, value):
		return value.upper()
