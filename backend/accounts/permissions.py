from rest_framework.permissions import BasePermission

class HasRole(BasePermission):
	allowed_roles = []

	def has_permission(self, request, view):
		user = request.user

		if not user or not user.is_authenticated:
			return False

		if user.is_superuser:
			return True

		return user.role in self.allowed_roles

class IsStaffRole(HasRole):
	allowed_roles = ['staff']

class IsEventManager(HasRole):
	allowed_roles = ['event_manager']

class IsCashier(HasRole):
	allowed_roles = ['cashier']

class IsScanner(HasRole):
	allowed_roles = ['scanner']

class IsEventManagerOrCashier(HasRole):
	allowed_roles = ['event_manager', 'cashier']

class IsEventManagerOrScanner(HasRole):
	allowed_roles = ['event_manager', 'scanner']
